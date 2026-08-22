"""Node: generate_worksheet — the "homework" the student receives.

Contract: given a target skill + grade level + strategy, produce N items that
each carry their own answer key AND a check expression. Every item is verified
before it ships; unverified items are dropped and topped up from the template
bank. The worksheet that reaches a student is always fully graded-able.
"""
from __future__ import annotations
import os
import random
import sys
import uuid
from datetime import datetime, timezone
from fractions import Fraction

_AGENT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _AGENT_ROOT not in sys.path:
    sys.path.insert(0, _AGENT_ROOT)

from curriculum import load_curriculum  # noqa: E402
from mathcheck import safe_eval, verify_item  # noqa: E402
from schemas import Worksheet, WorksheetItem  # noqa: E402
import llm  # noqa: E402

from ..state import AgentState

DEFAULT_ITEM_COUNT = 6

_SYSTEM = """You are a Grades 4-6 mathematics item writer.
Return JSON only: {"items": [...]}
Each item: {"prompt", "answer", "check", "type", "difficulty", "hint", "explanation"}
Rules:
- "check" MUST be a plain arithmetic expression using only digits and + - * / ( ) that evaluates
  to exactly the value in "answer". Example: answer "23/20", check "3/4 + 2/5".
- "answer" is a bare number or fraction like "3/4" or "7". No words, no units.
- "type" is one of: fraction, numeric, multiple_choice.
- Reading level must match the grade. Keep prompts under 25 words.
- No names of real people. No topics outside mathematics.
"""


def _prompt(skill_name: str, grade: int, standards: list[str], strategy: str, n: int) -> str:
    return (
        f"Write {n} practice items for grade {grade}.\n"
        f"Skill: {skill_name}\n"
        f"Standards: {', '.join(standards) or 'n/a'}\n"
        f"Teaching strategy to reflect in wording: {strategy}\n"
        f"Vary difficulty from easy to moderate. Return JSON only."
    )


def _template_items(skill_id: str, grade: int, n: int, rng: random.Random) -> list[WorksheetItem]:
    """Deterministic, always-correct fallback bank. Keyed off skill id."""
    items: list[WorksheetItem] = []
    guard = 0
    while len(items) < n and guard < n * 20:
        guard += 1
        b, d = rng.randint(2, 9), rng.randint(2, 9)
        a, c = rng.randint(1, b - 1), rng.randint(1, d - 1)
        if "parts" in skill_id:
            prompt = f"A pizza is cut into {b} equal slices. You eat {a}. What fraction did you eat?"
            check = f"{a}/{b}"
        elif "equivalent" in skill_id:
            k = rng.randint(2, 4)
            prompt = f"Fill in the blank: {a}/{b} = ___/{b * k}"
            check = f"{a * k}"
        elif "compare" in skill_id:
            if Fraction(a, b) == Fraction(c, d):
                continue  # "which is larger" must have an answer
            prompt = f"Which is larger, {a}/{b} or {c}/{d}? Answer with the larger fraction."
            larger = max(Fraction(a, b), Fraction(c, d))
            check = f"{larger.numerator}/{larger.denominator}"
        elif "add-like" in skill_id:
            den = rng.randint(3, 9)
            x, y = rng.randint(1, den - 1), rng.randint(1, den - 1)
            prompt = f"{x}/{den} + {y}/{den} = ?"
            check = f"{x}/{den} + {y}/{den}"
        else:  # ratios
            prompt = f"A recipe uses {a} cups of flour for {b} cups of milk. What is the ratio as a fraction?"
            check = f"{a}/{b}"
        val = safe_eval(check)
        if val is None:
            continue
        items.append(
            WorksheetItem(
                id=f"i-{uuid.uuid4().hex[:8]}",
                skill_id=skill_id,
                type="fraction",
                prompt=prompt,
                answer=str(val),
                check=check,
                difficulty=0.4,
                hint="Work it out one step at a time.",
                explanation=f"{check} = {val}",
            )
        )
    return items


def build(
    student_id: str,
    target_skill: str,
    grade_level: int,
    strategy: str = "worked_example",
    count: int = DEFAULT_ITEM_COUNT,
    seed: int | None = None,
) -> Worksheet:
    cur = load_curriculum()
    skill = cur.get(target_skill) or cur.easiest()
    rng = random.Random(seed)

    items: list[WorksheetItem] = []
    source = "mock"
    rejected: list[str] = []

    if llm.enabled():
        raw = llm.complete_json(
            _SYSTEM, _prompt(skill.name, skill.grade, skill.standards, strategy, count)
        )
        for d in (raw or {}).get("items", []) or []:
            try:
                item = WorksheetItem(
                    id=f"i-{uuid.uuid4().hex[:8]}",
                    skill_id=skill.id,
                    type=d.get("type", "fraction"),
                    prompt=str(d.get("prompt", "")).strip(),
                    choices=d.get("choices"),
                    answer=str(d.get("answer", "")).strip(),
                    check=str(d.get("check") or "").strip() or None,
                    difficulty=float(d.get("difficulty", skill.difficulty)),
                    hint=d.get("hint"),
                    explanation=d.get("explanation"),
                )
            except Exception as exc:  # noqa: BLE001
                rejected.append(f"malformed: {exc}")
                continue
            ok, reason = verify_item(item)
            if ok and item.prompt:
                items.append(item)
            else:
                rejected.append(reason)
        if items:
            source = "llm"

    if rejected:
        print(f"[worksheet] dropped {len(rejected)} unverified item(s): {rejected[:3]}")
    if len(items) < count:
        items += _template_items(skill.id, skill.grade, count - len(items), rng)

    return Worksheet(
        id=f"w-{uuid.uuid4().hex[:8]}",
        student_id=student_id,
        grade_level=skill.grade,
        target_skill=skill.id,
        skill_name=skill.name,
        standards=skill.standards,
        strategy=strategy,
        items=items[:count],
        generated_at=datetime.now(timezone.utc).isoformat(),
        source=source,
    )


def run(state: AgentState) -> AgentState:
    ws = build(
        student_id=state.student_id,
        target_skill=state.gap_skill or "",
        grade_level=state.grade_level or 5,
        strategy=state.strategy or "worked_example",
    )
    state.worksheet = ws.model_dump()
    state.grade_level = ws.grade_level
    state.gap_skill = ws.target_skill
    return state
