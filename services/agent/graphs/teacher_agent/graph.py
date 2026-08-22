"""The adaptive loop.

    grade level ──► generate_worksheet ──► student answers ──► evaluate
         ▲                                                        │
         └──────────────── update_student (adapt) ◄───────────────┘

Two entry points, because the student is in the middle of it:
  next_worksheet(...)  -> what the student receives
  submit(...)          -> grade + adapt, returns where the loop goes next
"""
from __future__ import annotations

from .nodes import evaluate as evaluate_node
from .nodes import generate_worksheet as worksheet_node
from .nodes import update_student as adapt_node
from .state import AgentState


def next_worksheet(state: AgentState) -> AgentState:
    return worksheet_node.run(state)


def submit(state: AgentState, answers: dict[str, str]) -> AgentState:
    state.evaluation = {"answers": answers}
    state = evaluate_node.run(state)
    return adapt_node.run(state)


def run_cycle(state: AgentState, answers: dict[str, str] | None = None) -> AgentState:
    """One full turn of the loop: hand out a worksheet, take it back, adapt."""
    state = next_worksheet(state)
    if answers is not None:
        state = submit(state, answers)
    return state
