"""Run the adaptive loop end-to-end with no server and no API key.

    python scripts/dev/loop_demo.py

Proves: worksheets generate, answer keys verify, grading is exact, and the
target skill walks the prerequisite graph in both directions.
"""
from __future__ import annotations
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "services", "agent"))

from graphs.teacher_agent import AgentState, next_worksheet, submit  # noqa: E402
from mathcheck import safe_eval, to_fraction  # noqa: E402


def turn(state: AgentState, correct_ratio: float, n: int) -> AgentState:
    state = next_worksheet(state)
    ws = state.worksheet
    print(f"\n  Worksheet {n}: {ws['skill_name']} (grade {ws['grade_level']}) "
          f"· {len(ws['items'])} items · {ws['source']} · {ws['strategy']}")
    print(f"    e.g. {ws['items'][0]['prompt']}   -> {ws['items'][0]['answer']}")

    bad = [i for i in ws["items"] if i.get("check") and safe_eval(i["check"]) != to_fraction(i["answer"])]
    assert not bad, f"BAD ANSWER KEY: {bad}"

    cutoff = round(len(ws["items"]) * correct_ratio)
    answers = {it["id"]: (it["answer"] if k < cutoff else "0") for k, it in enumerate(ws["items"])}
    state = submit(state, answers)
    r = state.result
    print(f"    scored {r['score']:.0%} -> {r['decision'].upper()}: {r['rationale']}")
    return state


def main() -> None:
    print("=" * 72)
    print("STRUGGLING STUDENT — should walk DOWN to prerequisites")
    st = AgentState(student_id="kid-a", grade_level=6, gap_skill="math.6.ratios.intro")
    for n in range(1, 4):
        st = turn(st, 0.0, n)

    print("\n" + "=" * 72)
    print("STRONG STUDENT — should walk UP the graph")
    st = AgentState(student_id="kid-b", grade_level=4, gap_skill="math.4.fractions.parts")
    for n in range(1, 4):
        st = turn(st, 1.0, n)

    print("\n" + "=" * 72)
    print("BORDERLINE STUDENT — should HOLD on the same skill")
    st = AgentState(student_id="kid-c", grade_level=5, gap_skill="math.5.fractions.compare")
    st = turn(st, 0.5, 1)
    print(f"\n  mastery: {st.mastery}")
    print("\nAll answer keys verified. Loop OK.")


if __name__ == "__main__":
    main()
