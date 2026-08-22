"""Node: update_student — mastery update + the adapt decision.

This is what closes the loop. Score on the worksheet decides whether the next
worksheet walks UP the prerequisite graph (advance), stays put (hold), or walks
DOWN to the prerequisite that is actually blocking the student (remediate).

Adapting on grade level alone is too coarse -- a grade holds several skills.
Adapting on the skill graph is what makes "the LLM learns the student" real.
"""
from __future__ import annotations
import os
import sys

_AGENT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _AGENT_ROOT not in sys.path:
    sys.path.insert(0, _AGENT_ROOT)

from curriculum import load_curriculum  # noqa: E402
from schemas import AttemptResult, ItemGrade  # noqa: E402

from ..state import AgentState

ADVANCE_AT = 0.8
REMEDIATE_BELOW = 0.5
LEARNING_RATE = 0.25


def update_mastery(
    mastery: dict[str, float], grades: list[ItemGrade], lr: float = LEARNING_RATE
) -> dict[str, float]:
    out = dict(mastery)
    for g in grades:
        cur = out.get(g.skill_id, 0.5)
        out[g.skill_id] = round(cur + lr * ((1.0 if g.correct else 0.0) - cur), 4)
    return out


def decide_next(target_skill: str, score: float, mastery: dict[str, float]) -> tuple[str, str, int, str]:
    """Return (decision, next_skill, next_grade, rationale)."""
    cur = load_curriculum()
    skill = cur.get(target_skill) or cur.easiest()

    if score >= ADVANCE_AT:
        nxt = sorted(
            cur.successors(skill.id), key=lambda s: (cur.skills[s].grade, cur.skills[s].difficulty)
        )
        if nxt:
            n = cur.skills[nxt[0]]
            return ("advance", n.id, n.grade,
                    f"Scored {score:.0%} on {skill.name}. Moving up to {n.name} (grade {n.grade}).")
        return ("hold", skill.id, skill.grade,
                f"Scored {score:.0%} on {skill.name}, the top skill available. Holding with harder items.")

    if score < REMEDIATE_BELOW:
        # Pick the weakest prerequisite by current mastery -- the actual blocker.
        preds = cur.predecessors(skill.id)
        if preds:
            weakest = min(preds, key=lambda s: mastery.get(s, 0.5))
            p = cur.skills[weakest]
            return ("remediate", p.id, p.grade,
                    f"Scored {score:.0%} on {skill.name}. Dropping to prerequisite {p.name} "
                    f"(grade {p.grade}, mastery {mastery.get(p.id, 0.5):.0%}).")
        return ("hold", skill.id, skill.grade,
                f"Scored {score:.0%} on {skill.name}, no prerequisite below it. Repeating with easier items.")

    return ("hold", skill.id, skill.grade,
            f"Scored {score:.0%} on {skill.name}. Staying on this skill for another set.")


def apply(
    worksheet_id: str,
    student_id: str,
    target_skill: str,
    score: float,
    grades: list[ItemGrade],
    mastery: dict[str, float],
) -> AttemptResult:
    before = dict(mastery)
    after = update_mastery(before, grades)
    decision, next_skill, next_grade, rationale = decide_next(target_skill, score, after)
    return AttemptResult(
        worksheet_id=worksheet_id,
        student_id=student_id,
        score=round(score, 4),
        grades=grades,
        mastery_before=before,
        mastery_after=after,
        decision=decision,
        next_target_skill=next_skill,
        next_grade_level=next_grade,
        rationale=rationale,
    )


def run(state: AgentState) -> AgentState:
    ev = state.evaluation or {}
    grades = [ItemGrade(**g) for g in ev.get("grades", [])]
    result = apply(
        worksheet_id=(state.worksheet or {}).get("id", ""),
        student_id=state.student_id,
        target_skill=state.gap_skill or "",
        score=float(ev.get("score", 0.0)),
        grades=grades,
        mastery=state.mastery or {},
    )
    state.mastery = result.mastery_after
    state.gap_skill = result.next_target_skill
    state.grade_level = result.next_grade_level
    state.result = result.model_dump()
    return state
