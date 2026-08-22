from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Optional
from dotenv import load_dotenv

load_dotenv()

from .worksheet_gen import generate_worksheet

app = FastAPI(title="Teacher-Hub API", version="0.1.0")


class AnswerIn(BaseModel):
    question_id: str
    answer: Any


class WorksheetIn(BaseModel):
    student_id: str
    skill_id: Optional[str] = None
    grade_level: Optional[int] = None


class GradeIn(BaseModel):
    worksheet_id: str
    answers: list[dict]
    skill_id: Optional[str] = None
    grade_level: Optional[int] = None


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/assessments/start")
def assessment_start(student_id: str = "demo"):
    return {"assessment_id": "a1", "student_id": student_id, "status": "started"}


@app.post("/assessments/{assessment_id}/answer")
def assessment_answer(assessment_id: str, body: AnswerIn):
    return {"assessment_id": assessment_id, "recorded": body.model_dump()}


@app.get("/assessments/{assessment_id}/results")
def assessment_results(assessment_id: str):
    return {
        "assessment_id": assessment_id,
        "grade_level": 5,
        "gap_skill": "math.5.fractions.compare",
    }


@app.post("/worksheets/generate")
def worksheets_generate(body: WorksheetIn):
    return generate_worksheet(body.student_id, body.skill_id, body.grade_level)


@app.post("/worksheets/grade")
def worksheets_grade(body: GradeIn):
    # Role 6 can harden this; keep a simple stub for now
    total = max(len(body.answers), 1)
    correct = sum(1 for a in body.answers if a.get("correct") is True)
    score = correct / total
    base = body.grade_level or 5
    next_level = base + 1 if score >= 0.8 else (base - 1 if score < 0.4 else base)
    next_level = min(6, max(4, next_level))
    return {
        "worksheet_id": body.worksheet_id,
        "score": score,
        "next_grade_level": next_level,
    }


@app.get("/students/{student_id}/mastery")
def student_mastery(student_id: str):
    return {"student_id": student_id, "mastery": {}}
