"""One-time seeder: static JSON fixtures -> unstuck SQLite tables.

Runs inside init_db() only when the database is empty.  Sources:
  curriculum/math-curriculum-4-6.json -> skills + skill_edges
  data/mock/students.json             -> students + mastery
  data/mock/assessments.json          -> questions (+ legacy answers/results)
  data/mock/questions-grade*.json     -> expanded banks
  data/mock/worksheets.json           -> worksheets + worksheet_items
  data/mock/attempts.json             -> attempts
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))
_MOCK = os.path.join(_ROOT, "data", "mock")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _load(*parts: str):
    with open(os.path.join(_ROOT, *parts), encoding="utf-8") as fh:
        return json.load(fh)


def _questions(asmt: dict) -> dict:
    """Merge the expanded grade banks into the base assessment fixture."""
    have = {q["id"] for q in asmt["questions"]}
    for g in (4, 5, 6):
        for q in _load("data", "mock", f"questions-grade{g}.json"):
            if q["id"] not in have:
                asmt["questions"].append(q)
                have.add(q["id"])
    return asmt


def seed(conn) -> None:
    now = _now()

    # ---- curriculum ---------------------------------------------------------
    bundle = _load("curriculum", "math-curriculum-4-6.json")
    conn.executemany(
        "INSERT OR REPLACE INTO unstuck.skills"
        "(id, grade, name, subject, difficulty, description, standards)"
        " VALUES(?,?,?,?,?,?,?)",
        [(s["id"], s["grade"], s["name"], s.get("subject", "mathematics"),
          float(s.get("difficulty", 0.5)), s.get("description", ""),
          json.dumps(s.get("standards") or [])) for s in bundle["skills"]],
    )
    conn.executemany(
        "INSERT OR REPLACE INTO unstuck.skill_edges(from_skill, to_skill)"
        " VALUES(?,?)",
        [(e["from"], e["to"]) for e in bundle.get("edges", [])],
    )

    # ---- students + mastery ---------------------------------------------------
    for s in _load("data", "mock", "students.json"):
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.students"
            "(id, name, grade_level, gap_skill, strategy, sessions_completed,"
            " created_at, updated_at) VALUES(?,?,?,?,?,?,?,?)",
            (s["id"], s.get("name", ""), s.get("grade_level"),
             s.get("gap_skill"), s.get("strategy"),
             s.get("sessions_completed", 0), now, now))
        conn.executemany(
            "INSERT OR REPLACE INTO unstuck.mastery"
            "(student_id, skill_id, value, updated_at) VALUES(?,?,?,?)",
            [(s["id"], k, float(v), now)
             for k, v in (s.get("mastery") or {}).items()])
    # legacy quiz fixtures are attributed to the demo account
    conn.execute(
        "INSERT OR REPLACE INTO unstuck.students"
        "(id, name, created_at, updated_at) VALUES('demo','Demo Student',?,?)",
        (now, now))

    # ---- questions (+ legacy assessment artefacts) ----------------------------
    asmt = _questions(_load("data", "mock", "assessments.json"))
    conn.executemany(
        "INSERT OR REPLACE INTO unstuck.questions"
        "(id, skill_id, prompt, choices, correct_index) VALUES(?,?,?,?,?)",
        [(q["id"], q["skill_id"], q["prompt"],
          json.dumps(q.get("choices") or []), q.get("correct_index"))
         for q in asmt["questions"]],
    )
    for a in asmt.get("assessments", []):
        _stub_assessment(conn, a["id"], now)
    for aid, answers in (asmt.get("answers") or {}).items():
        _stub_assessment(conn, aid, now)
        conn.executemany(
            "INSERT INTO unstuck.answers(assessment_id, student_id, question_id,"
            " answer, correct, points, streak, answered_at)"
            " VALUES(?,'demo',?,?,?,?,?,?)",
            [(aid, a.get("question_id"), json.dumps(a.get("answer")),
              1 if a.get("correct") else 0, a.get("points", 0),
              a.get("streak", 0), a.get("ts", now)) for a in answers])
    for aid, result in (asmt.get("results") or {}).items():
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.assessment_results"
            "(assessment_id, student_id, evaluated_by, result, created_at)"
            " VALUES(?,'demo','mock',?,?)", (aid, json.dumps(result), now))

    _seed_worksheets_and_attempts(conn, now)


def _stub_assessment(conn, aid: str, now: str) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO unstuck.assessments(id, student_id, status,"
        " started_at) VALUES(?,'demo','finished',?)", (aid, now))


def _seed_worksheets_and_attempts(conn, now: str) -> None:
    for ws in _load("data", "mock", "worksheets.json")["worksheets"]:
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.worksheets"
            "(id, student_id, target_skill, grade_level, strategy, created_at)"
            " VALUES(?,?,?,?,?,?)",
            (ws["id"], ws.get("student_id"), ws.get("target_skill"),
             ws.get("grade_level"), ws.get("strategy"), now))
        conn.executemany(
            "INSERT OR REPLACE INTO unstuck.worksheet_items"
            "(worksheet_id, position, item) VALUES(?,?,?)",
            [(ws["id"], i, json.dumps(it))
             for i, it in enumerate(ws.get("items") or [])])

    for att in _load("data", "mock", "attempts.json")["attempts"]:
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.attempts"
            "(id, worksheet_id, student_id, score, decision, next_target_skill,"
            " next_grade_level, payload, created_at) VALUES(?,?,?,?,?,?,?,?,?)",
            (att["id"], att.get("worksheet_id"), att.get("student_id"),
             att.get("score"), att.get("decision"),
             att.get("next_target_skill"), att.get("next_grade_level"),
             json.dumps(att), att.get("completed_at", now)))

