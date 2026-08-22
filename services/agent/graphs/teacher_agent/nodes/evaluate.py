"""Node: evaluate — grade the returned worksheet.

Deliberately NOT an LLM call. The worksheet shipped with a verified answer key,
so grading is exact-value comparison. That makes it free, instant, and unable
to hallucinate a wrong grade. The LLM's job is writing items, not marking them.
"""
from __future__ import annotations
import os
import sys

_AGENT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _AGENT_ROOT not in sys.path:
    sys.path.insert(0, _AGENT_ROOT)

from mathcheck import answers_match  # noqa: E402
from schemas import ItemGrade, Worksheet  # noqa: E402

from ..state import AgentState


def grade(worksheet: Worksheet, answers: dict[str, str]) -> tuple[float, list[ItemGrade]]:
    grades: list[ItemGrade] = []
    for item in worksheet.items:
        got = str(answers.get(item.id, "") or "")
        grades.append(
            ItemGrade(
                item_id=item.id,
                skill_id=item.skill_id,
                correct=answers_match(item.answer, got),
                expected=item.answer,
                got=got,
                explanation=item.explanation,
            )
        )
    score = (sum(1 for g in grades if g.correct) / len(grades)) if grades else 0.0
    return score, grades


def run(state: AgentState) -> AgentState:
    ws = Worksheet(**(state.worksheet or {}))
    answers = (state.evaluation or {}).get("answers", {}) if state.evaluation else {}
    score, grades = grade(ws, answers)
    state.evaluation = {
        "answers": answers,
        "score": score,
        "grades": [g.model_dump() for g in grades],
    }
    return state
