"""Teacher agent state (hackathon stub)."""
from typing import Any, Optional
from pydantic import BaseModel

class AgentState(BaseModel):
    student_id: str = "demo"
    grade_level: Optional[int] = None
    gap_skill: Optional[str] = None
    strategy: Optional[str] = None
    worksheet: Optional[dict[str, Any]] = None
    evaluation: Optional[dict[str, Any]] = None
