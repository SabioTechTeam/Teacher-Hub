"""One-time seeder: static curriculum + JSON fixtures -> unstuck SQLite tables.

Runs inside init_db() only when the database is empty. Sources:
  curriculum.load_curriculum() -> skills + skill_edges (Grades 1 through 6)
  data/mock/students.json      -> students + mastery
  data/mock/assessments.json   -> questions across Grades 1 to 6
  data/mock/worksheets.json    -> worksheets + worksheet_items
  data/mock/attempts.json      -> attempts
"""
from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from typing import Any

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.abspath(os.path.join(_HERE, "..", "..", ".."))
_AGENT = os.path.join(_ROOT, "services", "agent")
if _AGENT not in sys.path:
    sys.path.insert(0, _AGENT)

from curriculum import load_curriculum  # noqa: E402


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _load_json(*parts: str) -> Any:
    p = os.path.join(_ROOT, *parts)
    if os.path.isfile(p):
        with open(p, encoding="utf-8") as fh:
            return json.load(fh)
    return {}


def seed(conn) -> None:
    now = _now()
    cur = load_curriculum()

    # ---- 1. Curriculum Skills & Edges (Grades 1 to 6) -------------------------
    for sk in cur.skills.values():
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.skills"
            "(id, grade, name, subject, difficulty, description, standards)"
            " VALUES(?,?,?,?,?,?,?)",
            (
                sk.id,
                sk.grade,
                sk.name,
                sk.subject,
                sk.difficulty,
                sk.description,
                json.dumps(sk.standards),
            ),
        )

    for from_skill, to_skill in cur.edges:
        conn.execute(
            "INSERT OR IGNORE INTO unstuck.skill_edges(from_skill, to_skill) VALUES(?,?)",
            (from_skill, to_skill),
        )

    # ---- 2. Students & Mastery ------------------------------------------------
    students = _load_json("data", "mock", "students.json")
    if isinstance(students, list):
        for s in students:
            conn.execute(
                "INSERT OR REPLACE INTO unstuck.students"
                "(id, name, grade_level, gap_skill, strategy, sessions_completed,"
                " points, level, current_streak, best_streak, badges, notes, themes,"
                " created_at, updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    s["id"],
                    s.get("name", ""),
                    s.get("grade_level", 4),
                    s.get("gap_skill"),
                    s.get("strategy"),
                    s.get("sessions_completed", 0),
                    s.get("points", 120),
                    s.get("level", 2),
                    s.get("current_streak", 3),
                    s.get("best_streak", 5),
                    json.dumps(s.get("badges", ["first-correct"])),
                    json.dumps(s.get("notes", {})),
                    json.dumps(s.get("themes", ["space", "videogames", "basketball"])),
                    now,
                    now,
                ),
            )
            for skill_id, val in (s.get("mastery") or {}).items():
                conn.execute(
                    "INSERT OR REPLACE INTO unstuck.mastery(student_id, skill_id, value, updated_at)"
                    " VALUES(?,?,?,?)",
                    (s["id"], skill_id, float(val), now),
                )

    # Default demo student
    conn.execute(
        "INSERT OR IGNORE INTO unstuck.students"
        "(id, name, grade_level, points, level, current_streak, best_streak, badges, created_at, updated_at)"
        " VALUES('demo', 'Aiden Torres', 4, 150, 2, 3, 5, '[\"first-correct\"]', ?, ?)",
        (now, now),
    )

    # ---- 3. Assessment Questions (Grades 1 to 6) ------------------------------
    asmt_data = _load_json("data", "mock", "assessments.json")
    for q in asmt_data.get("questions", []):
        sk = cur.get(q["skill_id"])
        grade = sk.grade if sk else None
        conn.execute(
            "INSERT OR REPLACE INTO unstuck.questions(id, skill_id, grade, prompt, choices, correct_index)"
            " VALUES(?,?,?,?,?,?)",
            (
                q["id"],
                q["skill_id"],
                grade,
                q["prompt"],
                json.dumps(q.get("choices") or []),
                q.get("correct_index"),
            ),
        )

    # ---- 4. Worksheets & Worksheet Items -------------------------------------
    worksheets = _load_json("data", "mock", "worksheets.json")
    if isinstance(worksheets, list):
        for ws in worksheets:
            conn.execute(
                "INSERT OR REPLACE INTO unstuck.worksheets(id, student_id, target_skill, grade_level, strategy, created_at)"
                " VALUES(?,?,?,?,?,?)",
                (
                    ws.get("id"),
                    ws.get("student_id", "demo"),
                    ws.get("target_skill"),
                    ws.get("grade_level", 4),
                    ws.get("strategy", ""),
                    ws.get("created_at", now),
                ),
            )
            for pos, item in enumerate(ws.get("items", [])):
                conn.execute(
                    "INSERT OR REPLACE INTO unstuck.worksheet_items(worksheet_id, position, item)"
                    " VALUES(?,?,?)",
                    (ws.get("id"), pos, json.dumps(item)),
                )

    # ---- 5. Attempts ---------------------------------------------------------
    attempts = _load_json("data", "mock", "attempts.json")
    if isinstance(attempts, list):
        for att in attempts:
            conn.execute(
                "INSERT OR REPLACE INTO unstuck.attempts(id, worksheet_id, student_id, score, decision, next_target_skill, next_grade_level, payload, created_at)"
                " VALUES(?,?,?,?,?,?,?,?,?)",
                (
                    att.get("id"),
                    att.get("worksheet_id"),
                    att.get("student_id"),
                    att.get("score"),
                    att.get("decision"),
                    att.get("next_target_skill"),
                    att.get("next_grade_level"),
                    json.dumps(att),
                    att.get("created_at", now),
                ),
            )
