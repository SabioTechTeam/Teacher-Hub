"""Node: select_strategy — pick how to present the next worksheet.

Scoped per (student, skill), never a permanent "visual learner" label.
Hackathon version: rotate on repeated failure so a stuck student does not get
the same presentation twice. Strategy effectiveness gets tracked, not assumed.
"""
from __future__ import annotations

from ..state import AgentState

STRATEGIES = ["worked_example", "visual_model", "story_context"]


def choose(mastery: float, attempts_on_skill: int = 0) -> str:
    if mastery < 0.4:
        return STRATEGIES[attempts_on_skill % len(STRATEGIES)]
    return "worked_example"


def run(state: AgentState) -> AgentState:
    m = (state.mastery or {}).get(state.gap_skill or "", 0.5)
    state.strategy = choose(m)
    return state
