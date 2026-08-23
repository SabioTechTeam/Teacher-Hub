"""Diagnostic quiz evaluation: quiz answers -> mastery -> gap skill -> grade level.

This is the assessment half of the loop. The worksheet half already adapts on the
prerequisite graph; this seeds it with where the student actually starts.

The LLM is the evaluator: it reads every answer, scores against the CCSS rubric,
and decides the grade level and gap skill (ai/prompts/assessment/quiz_evaluator.md).

The deterministic scorer still runs underneath. It supplies the factual per-skill
counts, and it is the fallback whenever the model is unavailable or returns
something invalid -- notably a gap_skill outside the curriculum, which would crash
worksheet generation. The demo must survive a dead key.

Mastery from a diagnostic is fraction-correct, not the exponential update used by
update_student. There is no prior mastery to move away from, and with 3 questions
per skill the fraction is the signal. The worksheet loop takes over with EMA
updates from there.
"""
from __future__ import annotations

import os
import sys
from typing import Any, Optional

_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
for _p in (os.path.join(_REPO, "services", "agent"),):
    if _p not in sys.path:
        sys.path.insert(0, _p)

from curriculum import (  # noqa: E402
    load_curriculum, proficiency, proficiency_scale_text, rubric, standard_for,
)
import llm  # noqa: E402

from . import progress, db

MASTERED_AT = 0.8
ERROR_TYPES = {"conceptual", "procedural", "computational"}
_PROMPTS = os.path.join(_REPO, "ai", "prompts")


def _order(skill_id: str) -> tuple[int, float]:
    """Curriculum position: earlier prerequisites first. Ties in mastery break here."""
    sk = load_curriculum().get(skill_id)
    return (sk.grade, sk.difficulty) if sk else (99, 99.0)


def build_quiz(student_id: str) -> dict[str, Any]:
    """Create an assessment and return its questions, answer key withheld."""
    cur = load_curriculum()
    rows = db.questions_for_quiz()

    question_ids: list[str] = []
    payload: list[dict[str, Any]] = []
    for q in rows:
        skill_id = q["skill_id"]
        skill = cur.get(skill_id)
        question_ids.append(q["id"])
        payload.append(
            {
                "id": q["id"],
                "skill_id": skill_id,
                "skill_name": skill.name if skill else skill_id,
                "grade": skill.grade if skill else None,
                "prompt": q["prompt"],
                "choices": list(q.get("choices") or []),
            }
        )

    assessment_id = db.next_id("asmt")
    progress.register_assessment(student_id, assessment_id, question_ids)

    return {
        "assessment_id": assessment_id,
        "student_id": student_id,
        "total_questions": len(payload),
        "questions": payload,
    }


def _skill_row(sid: str, tally: dict, mastery: dict) -> dict[str, Any]:
    """One row of the per-skill breakdown, including its CCSS standard."""
    skill = load_curriculum().get(sid)
    std = standard_for(sid)
    return {
        "skill_id": sid,
        "skill_name": skill.name if skill else sid,
        "grade": skill.grade if skill else None,
        "standard": std["id"] if std else None,
        "has_prerequisite": bool(load_curriculum().predecessors(sid)),
        "standard_description": std["description"] if std else None,
        "correct": tally[sid][0],
        "asked": tally[sid][1],
        "mastery": round(mastery[sid], 4),
    }


def _deterministic(student_id: str, assessment_id: str) -> dict[str, Any]:
    """Score per skill, pick the gap, derive the grade level. No LLM."""
    question_ids = progress.assessment_questions(student_id, assessment_id)
    if not question_ids:
        raise KeyError("assessment not found")
    answers = progress.assessment_answers(student_id, assessment_id)
    if not answers:
        raise ValueError("no answers recorded for this assessment")
    header = {"id": assessment_id, "student_id": student_id, "question_ids": question_ids}

    cur = load_curriculum()

    tally: dict[str, list[int]] = {}
    for row in answers:
        hit_total = tally.setdefault(row["skill_id"], [0, 0])
        hit_total[0] += bool(row["correct"])
        hit_total[1] += 1

    # Only skills the student was actually asked about. An unasked skill is
    # unknown, not failed, and must not win "weakest".
    mastery = {sid: hit / total for sid, (hit, total) in tally.items()}

    weakest = min(mastery, key=lambda sid: (mastery[sid], _order(sid)))

    # "Mastered" requires every skill on the quiz to have been answered. Without
    # this, a student who answers one question correctly and walks away is
    # reported as having mastered the whole track.
    covered = {q["skill_id"] for q in (db.question_get(x) for x in header["question_ids"]) if q}
    complete = covered <= set(tally)
    mastered = complete and all(v >= MASTERED_AT for v in mastery.values())

    if mastered:
        # Nothing is holding them back. Report the top of what was tested.
        gap_skill: Optional[str] = None
        grade_level = max(
            (cur.get(sid).grade for sid in mastery if cur.get(sid)), default=6
        )
    else:
        gap_skill = weakest
        skill = cur.get(gap_skill)
        grade_level = skill.grade if skill else None

    answered = len(answers)
    overall = sum(1 for row in answers if row["correct"]) / answered
    prof_level, prof_label = proficiency(overall, grade_level or 5)

    result = {
        "assessment_id": assessment_id,
        "student_id": student_id,
        "answered": answered,
        "total_questions": len(header["question_ids"]),
        "score": round(overall, 4),
        "grade_level": grade_level,
        "gap_skill": gap_skill,
        "mastered": mastered,
        "complete": complete,
        "proficiency_level": prof_level,
        "proficiency_label": prof_label,
        "skills": [_skill_row(sid, tally, mastery) for sid in sorted(mastery, key=_order)],
    }
    return result


# ---------------------------------------------------------------------------
# LLM evaluation
# ---------------------------------------------------------------------------

def _transcript(header: dict, answers: list[dict]) -> str:
    """The quiz as the model sees it: question, options, key, and what was chosen."""
    by_question = {row["question_id"]: row for row in answers}
    lines = []
    for n, qid in enumerate(header["question_ids"], start=1):
        q = db.question_get(qid)
        row = by_question.get(qid)
        opts = " ".join(
            f"{chr(65 + i)}) {c}" for i, c in enumerate(q.get("choices") or [])
        )
        key = chr(65 + q["correct_index"])
        if row is None:
            chose = "NOT ANSWERED"
        else:
            try:
                chose = f"{chr(65 + int(row['answer']))} ({'correct' if row['correct'] else 'INCORRECT'})"
            except (TypeError, ValueError):
                chose = f"{row['answer']!r} (INCORRECT)"
        lines.append(
            f"{n}. [{qid} | skill: {q['skill_id']}] {q['prompt']}\n"
            f"   options: {opts}\n   correct: {key}\n   student chose: {chose}"
        )
    return "\n".join(lines)


def _rubric_context(skill_ids: list[str]) -> str:
    """CCSS standard text and level criteria for the skills on this quiz."""
    cur = load_curriculum()
    out = []
    for sid in sorted(skill_ids, key=_order):
        skill = cur.get(sid)
        std = standard_for(sid)
        prereqs = ", ".join(cur.predecessors(sid)) or "none"
        head = (
            f"- {sid} | {skill.name if skill else sid} | grade {skill.grade if skill else '?'}"
            f" | prerequisites: {prereqs}"
        )
        if std:
            head += (
                f" | CCSS {std['id']}: {std['description']}\n"
                f"    level 3 (meets): {std['levels']['3']}\n"
                f"    level 2 (approaching): {std['levels']['2']}"
            )
        out.append(head)
    return "\n".join(out)


def _blocked_by_prerequisite(gap: str, mastery: dict[str, float]) -> Optional[str]:
    """A gap whose own prerequisite was also failed is the wrong thing to teach."""
    for prereq in load_curriculum().predecessors(gap):
        if mastery.get(prereq, 1.0) < MASTERED_AT:
            return prereq
    return None


def _validate(raw: dict, header: dict, allowed_skills: set, mastery: dict) -> Optional[dict]:
    """Reject anything the curriculum cannot honour.

    The gap_skill check is the one that matters: a hallucinated skill id flows
    straight into /worksheets/generate and takes the demo down.
    """
    if not isinstance(raw, dict):
        return None
    gap = raw.get("gap_skill")
    if gap is not None and gap not in allowed_skills:
        print(f"[diagnostic] rejecting LLM gap_skill not in curriculum: {gap!r}")
        return None
    if gap is None and any(v < MASTERED_AT for v in mastery.values()):
        print("[diagnostic] rejecting null gap_skill while skills remain unmastered")
        return None
    if gap is not None and all(v >= MASTERED_AT for v in mastery.values()):
        print(f"[diagnostic] rejecting gap {gap!r}: every tested skill is mastered")
        return None
    if gap is not None:
        blocker = _blocked_by_prerequisite(gap, mastery)
        if blocker:
            print(f"[diagnostic] rejecting gap {gap!r}: prerequisite {blocker} also failed")
            return None

    cur = load_curriculum()
    grade = raw.get("grade_level")
    if gap:
        skill = cur.get(gap)
        if skill and grade != skill.grade:
            grade = skill.grade  # the gap skill's grade is the grade level, by definition
    if gap is None:
        grade = max(
            (cur.get(sid).grade for sid in mastery if cur.get(sid)), default=grade
        )
    if grade not in (1, 2, 3, 4, 5, 6):
        print(f"[diagnostic] rejecting LLM grade_level: {grade!r}")
        return None

    level = raw.get("proficiency_level")
    if level not in (1, 2, 3, 4):
        return None

    valid_qids = set(header["question_ids"])
    questions = []
    for q in raw.get("questions") or []:
        if not isinstance(q, dict) or q.get("question_id") not in valid_qids:
            continue
        etype = q.get("error_type")
        questions.append(
            {
                "question_id": q["question_id"],
                "score": q["score"] if q.get("score") in (1, 2, 3, 4) else None,
                "error_type": etype if etype in ERROR_TYPES else None,
                "feedback": str(q.get("feedback") or "").strip() or None,
            }
        )

    return {
        "grade_level": grade,
        "gap_skill": gap,
        "proficiency_level": level,
        "summary": str(raw.get("summary") or "").strip(),
        "questions": questions,
    }


def _llm_evaluate(
    header: dict, answers: list[dict], allowed: set, mastery: dict, score: float
) -> Optional[dict]:
    if not llm.enabled():
        return None
    try:
        with open(os.path.join(_PROMPTS, "assessment", "quiz_evaluator.md"), encoding="utf-8") as fh:
            system = fh.read()
    except OSError:
        return None

    skill_ids = sorted(
        {q["skill_id"] for q in (db.question_get(x) for x in header["question_ids"]) if q},
        key=_order)
    user = (
        "Evaluate this completed multiple-choice diagnostic. It is already scored "
        "against a known answer key, so do not re-derive correctness -- judge what "
        "the answer pattern reveals, then decide the student's working grade level "
        "and the single skill to teach next.\n\n"
        f"SCORE (already computed, do not recalculate): "
        f"{sum(1 for a in answers if a['correct'])} of {len(answers)} correct "
        f"= {score:.0%}\n\n"
        f"QUIZ TRANSCRIPT\n{_transcript(header, answers)}\n\n"
        f"SKILLS AND CCSS STANDARDS IN SCOPE\n{_rubric_context(skill_ids)}\n\n"
        "Return ONLY this JSON:\n"
        '{"grade_level": 1|2|3|4|5|6, "gap_skill": "<skill id>", "proficiency_level": 1-4,\n'
        ' "summary": "2-3 sentences for the teacher",\n'
        ' "questions": [{"question_id": "...", "score": 1-4,\n'
        '   "error_type": "conceptual"|"procedural"|"computational"|null,\n'
        '   "feedback": "one sentence, or null when the answer was correct"}]}\n\n'
        "RULES\n"
        f"- gap_skill MUST be exactly one of: {', '.join(skill_ids)}\n"
        "- Never invent a skill id. Never name a skill outside that list.\n"
        "- grade_level MUST equal the grade of the skill you choose as gap_skill.\n"
        "- If EVERY question was answered correctly there is no gap: return "
        '"gap_skill": null and the highest grade tested.\n'
        "- Otherwise choose the EARLIEST skill in the prerequisite chain that the "
        "student failed. Never choose a skill whose own prerequisite the student "
        "also failed -- fix the foundation first.\n"
        "- proficiency_level must reflect the overall score using this scale: "
        f"{proficiency_scale_text()}.\n"
        "- feedback must name the misconception the chosen wrong option reveals.\n"
        "- Never state a statistic you were not given. If you cite the score, cite "
        "the one above exactly."
    )

    for _ in range(2):
        raw = llm.complete_json(system, user, timeout=45.0)
        if raw is None:
            return None
        checked = _validate(raw, header, allowed, mastery)
        if checked:
            return checked
    return None


def _label(level: int, grade: int) -> str:
    """The rubric's own label for a proficiency level."""
    book = rubric(grade)
    if not book:
        return ""
    return book["metadata"]["proficiency_scale"][str(level)]["label"]


def evaluate(student_id: str, assessment_id: str) -> dict[str, Any]:
    """Evaluate the quiz. LLM decides grade level and gap skill; arithmetic is the net."""
    result = _deterministic(student_id, assessment_id)
    header = {
        "id": assessment_id,
        "student_id": student_id,
        "question_ids": progress.assessment_questions(student_id, assessment_id),
    }
    answers = progress.assessment_answers(student_id, assessment_id)
    allowed = set(load_curriculum().skills)

    mastery = {row["skill_id"]: row["mastery"] for row in result["skills"]}
    verdict = _llm_evaluate(header, answers, allowed, mastery, result['score'])
    if verdict:
        result["grade_level"] = verdict["grade_level"]
        result["gap_skill"] = verdict["gap_skill"]
        result["proficiency_level"] = verdict["proficiency_level"]
        result["proficiency_label"] = _label(
            verdict["proficiency_level"], verdict["grade_level"]
        )
        result["summary"] = verdict["summary"]
        result["questions"] = verdict["questions"]
        result["evaluated_by"] = "llm"

        # Surface the sharpest feedback per skill for the UI.
        worst: dict[str, dict] = {}
        for q in verdict["questions"]:
            qrow = db.question_get(q["question_id"])
            if not qrow:
                continue
            sid = qrow["skill_id"]
            if q["feedback"] and (sid not in worst or (q["score"] or 4) < (worst[sid]["score"] or 4)):
                worst[sid] = q
        for row in result["skills"]:
            hit = worst.get(row["skill_id"])
            row["error_type"] = hit["error_type"] if hit else None
            row["feedback"] = hit["feedback"] if hit else None
    else:
        result["summary"] = ""
        result["questions"] = []
        result["evaluated_by"] = "deterministic"
        for row in result["skills"]:
            row["error_type"] = None
            row["feedback"] = None

    progress.finish_assessment(student_id, assessment_id, result)
    return result
