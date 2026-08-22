"""Teacher agent state carried through the loop."""
from typing import Any, Optional
from pydantic import BaseModel, Field


class AgentState(BaseModel):
    student_id: str = "demo"
    grade_level: Optional[int] = None
    gap_skill: Optional[str] = None
    strategy: Optional[str] = "worked_example"
    mastery: dict[str, float] = Field(default_factory=dict)
    worksheet: Optional[dict[str, Any]] = None
    evaluation: Optional[dict[str, Any]] = None
    result: Optional[dict[str, Any]] = None
