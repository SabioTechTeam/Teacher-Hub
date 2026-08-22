"""Node: generate_worksheet — calls shared worksheet_gen helper when available."""
from __future__ import annotations

from ..state import AgentState


def run(state: AgentState) -> AgentState:
    try:
        from services.api.app.worksheet_gen import generate_worksheet
    except Exception:
        try:
            import sys
            from pathlib import Path
            root = Path(__file__).resolve().parents[5]
            sys.path.insert(0, str(root / "services" / "api"))
            from app.worksheet_gen import generate_worksheet
        except Exception:
            return state

    result = generate_worksheet(
        student_id=state.student_id,
        skill_id=state.gap_skill,
        grade_level=state.grade_level,
    )
    state.worksheet = result
    return state
