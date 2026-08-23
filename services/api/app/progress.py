"""progress.py — per-student assessment progress + gamification (SQLite).

State lives in schema ``unstuck`` (students / answers / assessment_* tables)
and survives restarts.  Shape returned by load_progress():
    {
      "student_id": "demo",
      "points": 130, "level": 2,
      "current_streak": 3, "best_streak": 5,
      "badges": ["first-correct", "on-fire"],
      "assessments": {
        "asmt-101": {
          "answers": [ {question_id, correct, points, streak, ts}, ... ],
          "result": {...}          # filled when assessment finishes
        }
      },
      "updated_at": "..."
    }

Gamification rules (per question):
  correct  -> +10 pts, streak +1, bonus = min(streak - 1, 5) * 2
  wrong    -> +0 pts, streak reset to 0
  level    = points // 100 + 1
  badges   -> first-correct (1st), on-fire (streak >= 5),
              century (100 pts), scholar (500 pts)
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Optional

from . import db

BASE_POINTS = 10
LEVEL_SIZE = 100

_BADGES = {
    "first-correct": lambda p: p["points"] >= BASE_POINTS,
    "on-fire": lambda p: p["best_streak"] >= 5,
    "century": lambda p: p["points"] >= 100,
    "scholar": lambda p: p["points"] >= 500,
}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _ensure_student(student_id: str) -> None:
    db.execute(
        "INSERT OR IGNORE INTO unstuck.students(id, created_at, updated_at)"
        " VALUES(?,?,?)", (student_id, _now(), _now()))


def _entries(student_id: str) -> dict[str, dict[str, Any]]:
    """All of a student's assessment entries, keyed by assessment id."""
    aids = {r["id"] for r in db.query_all(
        "SELECT id FROM unstuck.assessments WHERE student_id = ?", (student_id,))}
    aids |= {r["id"] for r in db.query_all(
        "SELECT DISTINCT assessment_id AS id FROM unstuck.answers"
        " WHERE student_id = ?", (student_id,))}
    aids |= {r["id"] for r in db.query_all(
        "SELECT assessment_id AS id FROM unstuck.assessment_results"
        " WHERE student_id = ?", (student_id,))}
    entries: dict[str, dict[str, Any]] = {}
    for aid in sorted(aids):
        qids = [r["question_id"] for r in db.query_all(
            "SELECT question_id FROM unstuck.assessment_questions"
            " WHERE assessment_id = ? ORDER BY position", (aid,))]
        answers = [{
            "question_id": r["question_id"],
            "skill_id": r["skill_id"],
            "answer": json.loads(r["answer"]) if r["answer"] is not None else None,
            "correct": bool(r["correct"]),
            "points": r["points"],
            "streak": r["streak"],
            "ts": r["answered_at"],
        } for r in db.query_all(
            "SELECT a.question_id, q.skill_id, a.answer, a.correct,"
            " a.points, a.streak, a.answered_at"
            " FROM unstuck.answers a LEFT JOIN unstuck.questions q"
            " ON q.id = a.question_id"
            " WHERE a.student_id = ? AND a.assessment_id = ?"
            " ORDER BY a.seq", (student_id, aid))]
        entry: dict[str, Any] = {"answers": answers, "question_ids": qids}
        res = db.query_one(
            "SELECT evaluated_by, result FROM unstuck.assessment_results"
            " WHERE student_id = ? AND assessment_id = ?", (student_id, aid))
        if res:
            entry["result"] = json.loads(res["result"] or "{}")
            entry["evaluated_by"] = res["evaluated_by"]
        entries[aid] = entry
    return entries


def reset_progress(student_id: str) -> bool:
    """Clear a student's assessment history + gamification counters."""
    _ensure_student(student_id)
    row = db.query_one(
        "SELECT (SELECT COUNT(*) FROM unstuck.answers WHERE student_id = :s)"
        " + (SELECT COUNT(*) FROM unstuck.assessments WHERE student_id = :s)"
        " + (SELECT MAX(points, 0) FROM unstuck.students WHERE id = :s) AS n",
        {"s": student_id})
    with db.tx() as conn:
        conn.execute(
            "DELETE FROM unstuck.answers WHERE student_id = ?", (student_id,))
        conn.execute(
            "DELETE FROM unstuck.assessment_results WHERE student_id = ?",
            (student_id,))
        conn.execute(
            "DELETE FROM unstuck.assessment_questions WHERE assessment_id IN"
            " (SELECT id FROM unstuck.assessments WHERE student_id = ?)",
            (student_id,))
        conn.execute(
            "DELETE FROM unstuck.assessments WHERE student_id = ?", (student_id,))
        conn.execute(
            "UPDATE unstuck.students SET points = 0, level = 1,"
            " current_streak = 0, best_streak = 0, badges = '[]',"
            " updated_at = ? WHERE id = ?", (_now(), student_id))
    return (row["n"] or 0) > 0


def load_progress(student_id: str) -> dict[str, Any]:
    """Return the student's progress from SQLite, creating state if absent."""
    _ensure_student(student_id)
    row = db.query_one(
        "SELECT * FROM unstuck.students WHERE id = ?", (student_id,))
    return {
        "student_id": student_id,
        "name": row["name"],
        "grade_level": row["grade_level"],
        "points": row["points"],
        "level": row["level"],
        "current_streak": row["current_streak"],
        "best_streak": row["best_streak"],
        "badges": json.loads(row["badges"] or "[]"),
        "assessments": _entries(student_id),
        "updated_at": row["updated_at"],
    }


def save_progress(student_id: str, progress: dict[str, Any]) -> None:
    """Persist the mutable gamification counters back to SQLite."""
    _ensure_student(student_id)
    db.execute(
        "UPDATE unstuck.students SET points = ?, level = ?, current_streak = ?,"
        " best_streak = ?, badges = ?, updated_at = ? WHERE id = ?",
        (progress.get("points", 0), progress.get("level", 1),
         progress.get("current_streak", 0), progress.get("best_streak", 0),
         json.dumps(progress.get("badges") or []), _now(), student_id))


def _apply_badges(progress: dict[str, Any]) -> list[str]:
    earned = [
        name for name, rule in _BADGES.items()
        if name not in progress["badges"] and rule(progress)
    ]
    progress["badges"].extend(earned)
    return earned


def is_correct(question: dict[str, Any], answer: Any) -> bool:
    """Grade an answer against the question's answer key.

    Accepts the choice index (int or numeric string) or the choice text.
    """
    correct_idx = question.get("correct_index")
    if correct_idx is None:
        return False
    try:
        if int(answer) == int(correct_idx):
            return True
    except (TypeError, ValueError):
        pass
    choices = question.get("choices") or []
    if isinstance(answer, str) and 0 <= int(correct_idx) < len(choices):
        return answer.strip().lower() == str(choices[int(correct_idx)]).strip().lower()
    return False


def record_answer(
    student_id: str,
    assessment_id: str,
    question: dict[str, Any],
    answer: Any,
) -> dict[str, Any]:
    """Grade one question, update gamification, persist everything to SQLite."""
    correct = is_correct(question, answer)
    _ensure_student(student_id)
    row = db.query_one(
        "SELECT points, level, current_streak, best_streak, badges"
        " FROM unstuck.students WHERE id = ?", (student_id,))
    badges = json.loads(row["badges"] or "[]")

    streak = row["current_streak"] + 1 if correct else 0
    best = max(row["best_streak"], streak)
    bonus = min(streak - 1, 5) * 2 if correct else 0
    points = BASE_POINTS + bonus if correct else 0
    total = row["points"] + points
    level = total // LEVEL_SIZE + 1
    now = _now()

    new_badges = [
        name for name, rule in _BADGES.items()
        if name not in badges and rule({"points": total, "best_streak": best})
    ]
    badges.extend(new_badges)

    db.execute(
        "UPDATE unstuck.students SET points = ?, level = ?, current_streak = ?,"
        " best_streak = ?, badges = ?, updated_at = ? WHERE id = ?",
        (total, level, streak, best, json.dumps(badges), now, student_id))
    db.execute(
        "INSERT INTO unstuck.answers(assessment_id, student_id, question_id,"
        " answer, correct, points, streak, answered_at) VALUES(?,?,?,?,?,?,?,?)",
        (assessment_id, student_id, question["id"], json.dumps(answer),
         1 if correct else 0, points, streak, now))
    db.execute(
        "INSERT OR IGNORE INTO unstuck.assessments(id, student_id, status,"
        " started_at) VALUES(?,?,'started',?)", (assessment_id, student_id, now))

    return {
        "assessment_id": assessment_id,
        "question_id": question["id"],
        "correct": correct,
        "points_earned": points,
        "streak_bonus": bonus if correct else 0,
        "total_points": total,
        "level": level,
        "current_streak": streak,
        "new_badges": new_badges,
        "message": (
            f"✅ +{points} pts! 🔥 {streak} in a row!"
            if correct else "❌ Not quite — streak reset. Keep going!"
        ),
    }


def finish_assessment(student_id: str, assessment_id: str, result: dict[str, Any]) -> None:
    """Attach the final result (scores/gap/level) to the assessment record."""
    _ensure_student(student_id)
    now = _now()
    db.execute(
        "INSERT OR IGNORE INTO unstuck.assessments(id, student_id, status,"
        " started_at) VALUES(?,?,'finished',?)", (assessment_id, student_id, now))
    db.execute(
        "UPDATE unstuck.assessments SET status = 'finished', finished_at = ?"
        " WHERE id = ?", (now, assessment_id))
    db.execute(
        "INSERT OR REPLACE INTO unstuck.assessment_results"
        "(assessment_id, student_id, evaluated_by, result, created_at)"
        " VALUES(?,?,?,?,?)",
        (assessment_id, student_id, str(result.get("evaluated_by") or ""),
         json.dumps(result), now))


def register_assessment(
    student_id: str, assessment_id: str, question_ids: list[str]
) -> None:
    """Record which questions were served.

    The evaluator needs the full question set, not just the answered ones --
    otherwise a half-finished quiz looks complete and can report mastery.
    """
    _ensure_student(student_id)
    now = _now()
    with db.tx() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO unstuck.assessments(id, student_id, status,"
            " started_at) VALUES(?,?,'started',?)", (assessment_id, student_id, now))
        conn.execute(
            "DELETE FROM unstuck.assessment_questions WHERE assessment_id = ?",
            (assessment_id,))
        conn.executemany(
            "INSERT OR REPLACE INTO unstuck.assessment_questions"
            "(assessment_id, position, question_id) VALUES(?,?,?)",
            [(assessment_id, i, q) for i, q in enumerate(question_ids)])


def assessment_questions(student_id: str, assessment_id: str) -> list[str]:
    ids = [r["question_id"] for r in db.query_all(
        "SELECT question_id FROM unstuck.assessment_questions"
        " WHERE assessment_id = ? ORDER BY position", (assessment_id,))]
    if ids:
        return ids
    # Older records predate question_ids; fall back to what was answered.
    return [a["question_id"] for a in assessment_answers(student_id, assessment_id)]


def assessment_answers(student_id: str, assessment_id: str) -> list[dict[str, Any]]:
    entries = _entries(student_id)
    return entries.get(assessment_id, {}).get("answers", [])


def get_assessment(student_id: str, assessment_id: str) -> Optional[dict[str, Any]]:
    return _entries(student_id).get(assessment_id)

