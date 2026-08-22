"""progress.py — file-based, per-user assessment results + gamification.

One JSON file per student at  data/progress/{student_id}.json:
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
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from threading import Lock

_THIS_DIR = Path(__file__).resolve().parent


def _progress_dir() -> Path:
    """data/progress next to the mock data dir (same walk-up logic as seed.py)."""
    candidate = _THIS_DIR
    for _ in range(6):
        if (candidate / "data" / "mock").exists():
            return candidate / "data" / "progress"
        candidate = candidate.parent
    return _THIS_DIR.parent / "data" / "progress"


_PROGRESS_DIR = Path(os.getenv("PROGRESS_DIR", str(_progress_dir())))
_LOCK = Lock()

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


def _file(student_id: str) -> Path:
    safe = "".join(c if c.isalnum() or c in "-_" else "_" for c in student_id)
    return _PROGRESS_DIR / f"{safe}.json"


def load_progress(student_id: str) -> dict[str, Any]:
    """Load a student's progress file, creating a fresh one if missing."""
    path = _file(student_id)
    if path.exists():
        try:
            with open(path, encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, OSError):
            pass  # corrupted -> start fresh
    return {
        "student_id": student_id,
        "points": 0,
        "level": 1,
        "current_streak": 0,
        "best_streak": 0,
        "badges": [],
        "assessments": {},
        "updated_at": _now(),
    }


def save_progress(student_id: str, progress: dict[str, Any]) -> None:
    path = _file(student_id)
    with _LOCK:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(".tmp")
        with open(tmp, "w", encoding="utf-8") as fh:
            json.dump(progress, fh, indent=2)
        os.replace(tmp, path)  # atomic write


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
    """Grade one question, update gamification, persist to the user's file."""
    progress = load_progress(student_id)
    correct = is_correct(question, answer)

    if correct:
        progress["current_streak"] += 1
        progress["best_streak"] = max(progress["best_streak"], progress["current_streak"])
        streak_bonus = min(progress["current_streak"] - 1, 5) * 2
        points = BASE_POINTS + streak_bonus
    else:
        progress["current_streak"] = 0
        points = 0

    progress["points"] += points
    progress["level"] = progress["points"] // LEVEL_SIZE + 1
    new_badges = _apply_badges(progress)
    progress["updated_at"] = _now()

    assessment = progress["assessments"].setdefault(assessment_id, {"answers": []})
    assessment["answers"].append({
        "question_id": question["id"],
        "skill_id": question.get("skill_id"),
        "answer": answer,
        "correct": correct,
        "points": points,
        "streak": progress["current_streak"],
        "ts": progress["updated_at"],
    })

    save_progress(student_id, progress)

    return {
        "assessment_id": assessment_id,
        "question_id": question["id"],
        "correct": correct,
        "points_earned": points,
        "streak_bonus": max(0, points - BASE_POINTS) if correct else 0,
        "total_points": progress["points"],
        "level": progress["level"],
        "current_streak": progress["current_streak"],
        "new_badges": new_badges,
        "message": (
            f"✅ +{points} pts! 🔥 {progress['current_streak']} in a row!"
            if correct else "❌ Not quite — streak reset. Keep going!"
        ),
    }


def finish_assessment(student_id: str, assessment_id: str, result: dict[str, Any]) -> None:
    """Attach the final result (scores/gap/level) to the assessment record."""
    progress = load_progress(student_id)
    progress["assessments"].setdefault(assessment_id, {"answers": []})["result"] = result
    progress["updated_at"] = _now()
    save_progress(student_id, progress)


def register_assessment(
    student_id: str, assessment_id: str, question_ids: list[str]
) -> None:
    """Record which questions were served.

    The evaluator needs the full question set, not just the answered ones --
    otherwise a half-finished quiz looks complete and can report mastery.
    """
    progress = load_progress(student_id)
    entry = progress["assessments"].setdefault(assessment_id, {"answers": []})
    entry["question_ids"] = list(question_ids)
    progress["updated_at"] = _now()
    save_progress(student_id, progress)


def assessment_questions(student_id: str, assessment_id: str) -> list[str]:
    entry = load_progress(student_id)["assessments"].get(assessment_id) or {}
    ids = entry.get("question_ids")
    if ids:
        return list(ids)
    # Older records predate question_ids; fall back to what was answered.
    return [a["question_id"] for a in entry.get("answers", [])]


def assessment_answers(student_id: str, assessment_id: str) -> list[dict[str, Any]]:
    progress = load_progress(student_id)
    return progress["assessments"].get(assessment_id, {}).get("answers", [])


def get_assessment(student_id: str, assessment_id: str) -> Optional[dict[str, Any]]:
    progress = load_progress(student_id)
    return progress["assessments"].get(assessment_id)

