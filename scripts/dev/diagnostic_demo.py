"""Offline check for the diagnostic evaluation: quiz answers -> gap skill -> grade level.

No server, no API key, no network. Run: python3 scripts/dev/diagnostic_demo.py

Writes progress to a throwaway directory so it never touches data/progress/.
"""
import os
import sys
import tempfile

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

os.environ.setdefault("PROGRESS_DIR", tempfile.mkdtemp(prefix="teacherhub-progress-"))

from services.api.app import diagnostic, progress, seed  # noqa: E402


def take(student: str, knows: set, reverse: bool = False) -> dict:
    """Sit the whole quiz, answering correctly only for skills in `knows`.

    `reverse` answers hardest-first, so the tally is built in a different order
    than the curriculum. That is what actually exercises the tie-break: with
    several skills at 0.0, dict insertion order would otherwise decide the gap.
    """
    quiz = diagnostic.build_quiz(student)
    for q in (reversed(quiz["questions"]) if reverse else quiz["questions"]):
        full = seed.questions[q["id"]]
        key = full["correct_index"]
        wrong = (key + 1) % max(len(q["choices"]), 2)
        progress.record_answer(
            student, quiz["assessment_id"], full,
            key if q["skill_id"] in knows else wrong,
        )
    return diagnostic.evaluate(student, quiz["assessment_id"])


def main() -> None:
    seed.load()
    all_skills = set(seed.questions_by_skill)

    # Knows only the first skill. Four skills tie at 0.0, so the tie-break by
    # curriculum order decides -- it must pick the earliest prerequisite.
    weak = take("t-weak", {"math.4.fractions.parts"})
    assert weak["gap_skill"] == "math.4.fractions.equivalent", weak["gap_skill"]
    assert weak["grade_level"] == 4, weak["grade_level"]
    assert weak["proficiency_label"] == "Below Standard", weak["proficiency_label"]
    assert not weak["mastered"]

    # Same student, answering hardest-first. Insertion order now favours the
    # grade-6 skill, so only the curriculum tie-break can still return grade 4.
    backwards = take("t-weak-rev", {"math.4.fractions.parts"}, reverse=True)
    assert backwards["gap_skill"] == "math.4.fractions.equivalent", backwards["gap_skill"]
    assert backwards["grade_level"] == 4, backwards["grade_level"]

    # Solid through compare -> the gap is the next skill up, not the first stumble.
    mid = take("t-mid", {
        "math.4.fractions.parts",
        "math.4.fractions.equivalent",
        "math.5.fractions.compare",
    })
    assert mid["gap_skill"] == "math.5.fractions.add-like", mid["gap_skill"]
    assert mid["grade_level"] == 5, mid["grade_level"]

    # Everything correct -> no gap, top grade, and it must say so rather than
    # inventing a skill to remediate.
    ace = take("t-ace", all_skills)
    assert ace["gap_skill"] is None, ace["gap_skill"]
    assert ace["mastered"] and ace["complete"], ace
    assert ace["grade_level"] == 6, ace["grade_level"]
    assert ace["score"] == 1.0, ace["score"]

    # A half-finished quiz must not report mastery.
    quiz = diagnostic.build_quiz("t-partial")
    first = seed.questions[quiz["questions"][0]["id"]]
    progress.record_answer("t-partial", quiz["assessment_id"], first, first["correct_index"])
    partial = diagnostic.evaluate("t-partial", quiz["assessment_id"])
    assert not partial["complete"] and not partial["mastered"], partial

    # Answers are revisable, and a form's "2" means the same as 2.
    quiz = diagnostic.build_quiz("t-revise")
    q0 = seed.questions[quiz["questions"][0]["id"]]
    progress.record_answer("t-revise", quiz["assessment_id"], q0, str(q0["correct_index"]))
    rows = progress.assessment_answers("t-revise", quiz["assessment_id"])
    assert len(rows) == 1 and rows[0]["correct"], rows

    # Bad input is rejected, not silently scored.
    try:
        diagnostic.evaluate("t-guard", "asmt-nope")
        raise AssertionError("expected KeyError for unknown assessment")
    except KeyError:
        pass

    # --- guards on LLM output ------------------------------------------------
    # These run offline: they feed _validate synthetic model responses, which is
    # how the real failures showed up (structurally valid, pedagogically wrong).
    quiz = diagnostic.build_quiz("t-guard")
    header = {"question_ids": progress.assessment_questions("t-guard", quiz["assessment_id"])}
    allowed = set(seed.questions_by_skill)
    ok = {"grade_level": 5, "gap_skill": "math.5.fractions.add-like",
          "proficiency_level": 2, "summary": "s", "questions": []}

    struggling = {  # failed everything after parts-of-a-whole
        "math.4.fractions.parts": 1.0, "math.4.fractions.equivalent": 0.0,
        "math.5.fractions.compare": 0.0, "math.5.fractions.add-like": 0.0,
        "math.6.ratios.intro": 0.0,
    }
    perfect = {k: 1.0 for k in struggling}
    solid_to_compare = {  # add-like is a legitimate gap here: its prerequisite is met
        "math.4.fractions.parts": 1.0, "math.4.fractions.equivalent": 1.0,
        "math.5.fractions.compare": 1.0, "math.5.fractions.add-like": 0.0,
        "math.6.ratios.intro": 0.0,
    }

    # a skill id that is not in the curriculum must never reach worksheet generation
    assert diagnostic._validate({**ok, "gap_skill": "math.7.algebra.intro"}, header, allowed, struggling) is None
    # teaching compare to a student who failed equivalent is the wrong prescription
    assert diagnostic._validate({**ok, "gap_skill": "math.5.fractions.compare"}, header, allowed, struggling) is None
    # inventing a gap for a student who answered everything correctly
    assert diagnostic._validate({**ok, "gap_skill": "math.5.fractions.compare"}, header, allowed, perfect) is None
    # claiming no gap while skills are still unmastered
    assert diagnostic._validate({**ok, "gap_skill": None}, header, allowed, struggling) is None
    # grade level is corrected to the gap skill's own grade rather than trusted
    fixed = diagnostic._validate({**ok, "grade_level": 6}, header, allowed, solid_to_compare)
    assert fixed and fixed["grade_level"] == 5, fixed
    # a hallucinated error_type is dropped, not passed through to a teacher
    got = diagnostic._validate(
        {**ok, "questions": [{"question_id": header["question_ids"][0], "score": 2,
                              "error_type": "vibes", "feedback": "x"}]},
        header, allowed, solid_to_compare)
    assert got["questions"][0]["error_type"] is None, got

    print("ok  weak->equivalent(g4)  mid->add-like(g5)  ace->no gap(g6)  partial not mastered  ·  LLM guards reject bad verdicts")


if __name__ == "__main__":
    main()
