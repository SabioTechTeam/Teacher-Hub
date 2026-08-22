"""Python mirror of packages/types. Keep these in sync."""
from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field

ItemType = Literal["numeric", "fraction", "multiple_choice"]
AdaptDecision = Literal["advance", "hold", "remediate"]


class WorksheetItem(BaseModel):
    id: str
    skill_id: str
    type: ItemType = "fraction"
    prompt: str
    choices: Optional[list[str]] = None
    answer: str
    difficulty: float = 0.5
    hint: Optional[str] = None
    explanation: Optional[str] = None
    check: Optional[str] = None  # arithmetic expression proving `answer`


class Worksheet(BaseModel):
    id: str
    student_id: str
    grade_level: int
    target_skill: str
    skill_name: str = ""
    standards: list[str] = Field(default_factory=list)
    strategy: str = "worked_example"
    items: list[WorksheetItem] = Field(default_factory=list)
    generated_at: str = ""
    # Provenance: what parent/teacher notes changed about this set. Shown in the
    # UI so an adjustment is never invisible.
    guidance_applied: list[str] = Field(default_factory=list)
    hints_up_front: bool = False
    source: Literal["llm", "mock"] = "mock"


class ItemAttempt(BaseModel):
    item_id: str
    response: str = ""


class ItemGrade(BaseModel):
    item_id: str
    skill_id: str
    correct: bool
    expected: str
    got: str
    explanation: Optional[str] = None


class AttemptResult(BaseModel):
    worksheet_id: str
    student_id: str
    score: float
    grades: list[ItemGrade] = Field(default_factory=list)
    mastery_before: dict[str, float] = Field(default_factory=dict)
    mastery_after: dict[str, float] = Field(default_factory=dict)
    decision: AdaptDecision = "hold"
    next_target_skill: str = ""
    next_grade_level: int = 5
    rationale: str = ""
    proficiency_level: int = 1
    proficiency_label: str = ""
