"""
seed.py — loads all mock JSON fixtures into in-memory stores at startup.

The stores are plain dicts/lists imported by main.py.  No database required.
Call `load()` once from the FastAPI lifespan hook.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Locate the data directory.
# Works for two layouts:
#   Local dev  → repo-root/services/api/app/seed.py  → repo-root/data/mock/
#   Docker     → /app/app/seed.py                    → /app/data/mock/
# ---------------------------------------------------------------------------
_THIS_DIR = Path(__file__).resolve().parent   # the 'app' package directory

def _find_data_dir() -> Path:
    """Walk up from this file until we find a 'data/mock' sibling."""
    candidate = _THIS_DIR
    for _ in range(6):
        p = candidate / "data" / "mock"
        if p.exists():
            return p
        candidate = candidate.parent
    # Last resort: same level as app package (Docker layout)
    return _THIS_DIR.parent / "data" / "mock"

_DATA_DIR = _find_data_dir()


def _load(filename: str) -> Any:
    path = _DATA_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Mock data file not found: {path}")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


# ---------------------------------------------------------------------------
# In-memory stores  (module-level so all routes share the same objects)
# ---------------------------------------------------------------------------

# List[dict]  — student objects keyed by "id"
students: dict[str, dict] = {}

# mastery: student_id -> {skill_id: float}
mastery: dict[str, dict[str, float]] = {}

# List[dict]  — assessment header records, keyed by "id"
assessments: dict[str, dict] = {}

# List[dict]  — all quiz questions, keyed by "id"
questions: dict[str, dict] = {}

# questions grouped by skill_id  — for /assessments/start
questions_by_skill: dict[str, list[dict]] = {}

# per-assessment recorded answers: assessment_id -> list[dict]
assessment_answers: dict[str, list[dict]] = {}

# QuizResult objects: assessment_id -> dict
assessment_results: dict[str, dict] = {}

# List[dict]  — worksheets keyed by "id"
worksheets: dict[str, dict] = {}

# worksheets grouped by skill_id + strategy: (skill_id, strategy) -> list[dict]
worksheets_by_skill_strategy: dict[tuple[str, str], list[dict]] = {}

# attempt records keyed by "id"
attempts: dict[str, dict] = {}

# session history: student_id -> list[dict]
session_history: dict[str, list[dict]] = {}

# simple counter for generating new IDs during a session
_counters: dict[str, int] = {"assessment": 100, "attempt": 100}


def next_id(prefix: str) -> str:
    _counters[prefix] = _counters.get(prefix, 100) + 1
    return f"{prefix}-{_counters[prefix]:03d}"


# ---------------------------------------------------------------------------
# Loader
# ---------------------------------------------------------------------------

def load() -> None:
    """Populate all in-memory stores from the mock JSON files."""

    # ---- students ----------------------------------------------------------
    raw_students: list[dict] = _load("students.json")
    for s in raw_students:
        students[s["id"]] = s
        mastery[s["id"]] = dict(s.get("mastery", {}))

    # ---- assessments -------------------------------------------------------
    raw_asmt = _load("assessments.json")

    for a in raw_asmt["assessments"]:
        assessments[a["id"]] = a

    for q in raw_asmt["questions"]:
        questions[q["id"]] = q
        skill = q["skill_id"]
        questions_by_skill.setdefault(skill, []).append(q)

    for asmt_id, answers in raw_asmt["answers"].items():
        assessment_answers[asmt_id] = answers

    for asmt_id, result in raw_asmt["results"].items():
        assessment_results[asmt_id] = result

    # ---- worksheets --------------------------------------------------------
    raw_ws = _load("worksheets.json")
    for ws in raw_ws["worksheets"]:
        worksheets[ws["id"]] = ws
        key = (ws["skill_id"], ws["strategy"])
        worksheets_by_skill_strategy.setdefault(key, []).append(ws)

    # ---- attempts ----------------------------------------------------------
    raw_att = _load("attempts.json")
    for att in raw_att["attempts"]:
        attempts[att["id"]] = att

    for hist in raw_att["session_history"]:
        session_history[hist["student_id"]] = hist["sessions"]

    print(
        f"[seed] loaded  students={len(students)}  questions={len(questions)}"
        f"  worksheets={len(worksheets)}  attempts={len(attempts)}"
    )


# ---------------------------------------------------------------------------
# Mastery update helper (mirrors services/student-model/app/mastery/update.py)
# Kept here so main.py has a single import surface.
# ---------------------------------------------------------------------------

def update_mastery_store(
    mastery_map: dict[str, float],
    skill_id: str,
    score: float,
    lr: float = 0.2,
) -> dict[str, float]:
    """Exponential moving-average mastery update.

    score is treated as the target (0.0–1.0).
    A score >= 0.5 moves mastery toward 1.0; below moves it toward 0.0.
    """
    cur = mastery_map.get(skill_id, 0.5)
    target = 1.0 if score >= 0.5 else 0.0
    mastery_map[skill_id] = round(cur + lr * (target - cur), 4)
    return mastery_map
