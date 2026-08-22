from fastapi import FastAPI
from pydantic import BaseModel
from typing import Any, Optional

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
    return {"assessment_id": assessment_id, "grade_level": 5, "gap_skill": "math.5.fractions.compare"}

@app.post("/worksheets/generate")
def worksheets_generate(body: WorksheetIn):
    return {"worksheet_id": "w1", "items": [], "meta": body.model_dump()}

@app.post("/worksheets/grade")
def worksheets_grade(body: GradeIn):
    return {"worksheet_id": body.worksheet_id, "score": 0.0, "next_grade_level": 5}

@app.get("/students/{student_id}/mastery")
def student_mastery(student_id: str):
    return {"student_id": student_id, "mastery": {}}
