"""Teacher-Hub API.

Owns the adaptive loop endpoints:
  POST /worksheets/generate  -> the "homework" a student receives
  POST /worksheets/grade     -> grade it, update mastery, decide where the loop goes next

The frontend never sees the LLM key and never sees an answer key
(GET /worksheets/{id} strips it).
"""
from __future__ import annotations
import os
import sys
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
for p in (os.path.join(_REPO, "services", "agent"),):
    if p not in sys.path:
        sys.path.insert(0, p)

from graphs.teacher_agent.nodes import evaluate as evaluate_node  # noqa: E402
from graphs.teacher_agent.nodes import generate_worksheet as worksheet_node  # noqa: E402
from graphs.teacher_agent.nodes import select_strategy  # noqa: E402
from graphs.teacher_agent.nodes import update_student as adapt_node  # noqa: E402
from schemas import ItemGrade, Worksheet  # noqa: E402
from curriculum import load_curriculum  # noqa: E402

from .store import STORE
from . import seed

# Populate mock fixtures on startup
try:
    seed.load()
except Exception as exc:
    print(f"[seed] note: fixture load skipped or failed: {exc}")

app = FastAPI(title="UnStuck API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_START_SKILL = "math.5.fractions.compare"


class AnswerIn(BaseModel):
    question_id: str
    answer: Any


class WorksheetIn(BaseModel):
    student_id: str = "demo"
    skill_id: Optional[str] = None
    grade_level: Optional[int] = None
    item_count: int = 6


class AnswerItem(BaseModel):
    item_id: str
    response: str = ""


class GradeIn(BaseModel):
    worksheet_id: str
    answers: list[AnswerItem]


def _strip_keys(ws: dict[str, Any]) -> dict[str, Any]:
    """Never send answer keys to the browser."""
    safe = dict(ws)
    safe["items"] = [
        {k: v for k, v in it.items() if k not in ("answer", "check", "explanation")}
        for it in ws.get("items", [])
    ]
    return safe


@app.get("/health")
def health():
    return {
        "ok": True,
        "llm": bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")),
        "students_loaded": len(seed.students),
    }


@app.get("/curriculum/skills")
def curriculum_skills():
    cur = load_curriculum()
    return {
        "skills": [
            {"id": s.id, "name": s.name, "grade": s.grade, "standards": s.standards,
             "difficulty": s.difficulty}
            for s in sorted(cur.skills.values(), key=lambda x: (x.grade, x.difficulty))
        ],
        "edges": [{"from": a, "to": b} for a, b in cur.edges],
    }


@app.get("/students")
def students_list():
    return list(seed.students.values()) or [STORE.student("demo")]


from .store import STORE
from . import seed
from . import progress


@app.post("/assessments/start")
def assessment_start(student_id: str = "demo"):
    """Start an assessment; returns a real id and the first question batch."""
    assessment_id = seed.next_id("asmt")
    questions = seed.questions_by_skill.get(DEFAULT_START_SKILL, [])
    return {
        "assessment_id": assessment_id,
        "student_id": student_id,
        "status": "started",
        "questions": [
            {k: q[k] for k in ("id", "prompt", "choices") if k in q}
            for q in questions
        ],
    }


@app.post("/assessments/{assessment_id}/answer")
def assessment_answer(assessment_id: str, body: AnswerIn, student_id: str = "demo"):
    """Grade one answer, award gamification points, persist to the student's file."""
    question = seed.questions.get(body.question_id)
    if not question:
        raise HTTPException(404, f"question not found: {body.question_id}")
    return progress.record_answer(student_id, assessment_id, question, body.answer)


@app.get("/assessments/{assessment_id}/results")
def assessment_results(assessment_id: str, student_id: str = "demo"):
    """Score the recorded answers per skill, persist and return the result."""
    answers = progress.assessment_answers(student_id, assessment_id)
    if not answers:
        raise HTTPException(404, f"no answers recorded for {assessment_id}")

    scores: dict[str, list[int]] = {}
    for a in answers:
        scores.setdefault(a.get("skill_id") or "unknown", [0, 0])
        scores[a["skill_id"]][1] += 1
        if a["correct"]:
            scores[a["skill_id"]][0] += 1

    skill_scores = {
        skill: round(correct / total, 2)
        for skill, (correct, total) in scores.items()
    }
    gap_skill = min(skill_scores, key=skill_scores.get) if skill_scores else DEFAULT_START_SKILL

    result = {
        "assessment_id": assessment_id,
        "scores": skill_scores,
        "gap_skill": gap_skill,
        "grade_level": seed.students.get(student_id, {}).get("grade_level", 5),
    }
    progress.finish_assessment(student_id, assessment_id, result)
    p = progress.load_progress(student_id)
    result["gamification"] = {
        "total_points": p["points"],
        "level": p["level"],
        "best_streak": p["best_streak"],
        "badges": p["badges"],
    }
    return result


@app.get("/students/{student_id}/progress")
def student_progress(student_id: str):
    """Full gamified progress for one student (points, level, badges, history)."""
    return progress.load_progress(student_id)


@app.delete("/students/{student_id}/progress")
def student_progress_reset(student_id: str):
    path = progress._file(student_id)
    if path.exists():
        path.unlink()
    return {"ok": True, "student_id": student_id, "reset": True}


@app.post("/worksheets/generate")
def worksheets_generate(body: WorksheetIn):
    """Step 4 of the loop: the homework."""
    student = STORE.student(body.student_id)
    skill_id = body.skill_id or student.get("target_skill") or DEFAULT_START_SKILL
    grade = body.grade_level or student.get("grade_level") or 5
    strategy = select_strategy.choose((student.get("mastery") or {}).get(skill_id, 0.5))

    ws = worksheet_node.build(
        student_id=body.student_id,
        target_skill=skill_id,
        grade_level=grade,
        strategy=strategy,
        count=max(1, min(body.item_count, 12)),
    )
    payload = ws.model_dump()
    STORE.save_worksheet(payload)
    student["target_skill"] = ws.target_skill
    student["grade_level"] = ws.grade_level
    return _strip_keys(payload)


@app.get("/worksheets/{worksheet_id}")
def worksheet_get(worksheet_id: str):
    ws = STORE.get_worksheet(worksheet_id)
    if not ws:
        raise HTTPException(404, "worksheet not found")
    return _strip_keys(ws)


@app.post("/worksheets/grade")
def worksheets_grade(body: GradeIn):
    """Steps 5-6: grade deterministically, update mastery, decide the next step."""
    raw = STORE.get_worksheet(body.worksheet_id)
    if not raw:
        raise HTTPException(404, "worksheet not found")
    ws = Worksheet(**raw)
    answers = {a.item_id: a.response for a in body.answers}
    score, grades = evaluate_node.grade(ws, answers)

    student = STORE.student(ws.student_id)
    result = adapt_node.apply(
        worksheet_id=ws.id,
        student_id=ws.student_id,
        target_skill=ws.target_skill,
        score=score,
        grades=grades,
        mastery=student.get("mastery") or {},
    )
    payload = result.model_dump()
    STORE.record_attempt(payload)
    return payload


@app.get("/students/{student_id}")
def student_get(student_id: str):
    return seed.students.get(student_id) or STORE.student(student_id)


@app.get("/students/{student_id}/mastery")
def student_mastery(student_id: str):
    s = seed.students.get(student_id) or STORE.student(student_id)
    return {
        "student_id": student_id,
        "mastery": s.get("mastery", {}),
        "target_skill": s.get("target_skill"),
        "grade_level": s.get("grade_level", 5)
    }
