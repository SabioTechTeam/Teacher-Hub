"""CCSS rubric lookups for grades 4-6.

curriculum/rubrics/grade{4,5,6}_ccss_math_rubric.json hold 82 standards across
five domains per grade, each with a description and 1-4 level criteria. Two uses:

  standard_for()  grounds worksheet generation in the actual standard text and
                  its "meets"/"exceeds" criteria, instead of a bare id string.
  proficiency()   turns a mastery fraction into the rubric's own 1-4 scale and
                  label, so the UI can say "Approaching Standard" not "0.5".
"""
from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from typing import Optional

from .loader import _repo_root, load_curriculum


@lru_cache(maxsize=8)
def rubric(grade: int) -> Optional[dict]:
    """Rubric for a grade, or None if that file is not present."""
    path = os.path.join(
        _repo_root(), "curriculum", "rubrics", f"grade{grade}_ccss_math_rubric.json"
    )
    if not os.path.isfile(path):
        return None
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def standard_for(skill_id: str) -> Optional[dict]:
    """The rubric standard a curriculum skill maps to, or None.

    Skill YAML writes cluster letters ("4.NF.A.1"); the rubrics do not
    ("4.NF.1"), so the letter is stripped before matching.
    """
    skill = load_curriculum().get(skill_id)
    if not skill:
        return None
    wanted = {re.sub(r"\.([A-Z])\.", ".", s) for s in skill.standards}
    # Own grade first, then any grade: a grade-5 skill may cite a grade-4 standard.
    for grade in [skill.grade] + [g for g in (4, 5, 6) if g != skill.grade]:
        book = rubric(grade)
        if not book:
            continue
        for domain in book["domains"]:
            for std in domain["standards"]:
                if std["id"] in wanted:
                    return std
    return None


def grounding(skill_id: str) -> str:
    """Prompt fragment describing the skill.

    Prefers the CCSS standard. Falls back to the skill's own `description` when
    no standard maps -- a bare skill name is not enough to pin the content, and
    the model drifts to an adjacent skill without it.
    """
    std = standard_for(skill_id)
    if not std:
        skill = load_curriculum().get(skill_id)
        if skill and skill.description:
            return f"Skill definition: {skill.description}\n"
        return ""
    return (
        f"CCSS {std['id']}: {std['description']}\n"
        f"Meets the standard: {std['levels']['3']}\n"
        f"Exceeds it: {std['levels']['4']}\n"
        "Target the items at the 'meets' criteria.\n"
    )


# The one place these thresholds live. They were duplicated in three files and two
# of the copies had already drifted apart.
# Level 3 "Meets Standard" sits at 0.8, the same cut update_student.ADVANCE_AT uses
# to advance -- so a student advances exactly when they meet the standard.
PROFICIENCY_CUTS: tuple[tuple[float, int], ...] = ((0.95, 4), (0.80, 3), (0.50, 2))


def proficiency_level(fraction: float) -> int:
    """Fraction correct (0-1) -> the rubric's 1-4 level."""
    for cut, level in PROFICIENCY_CUTS:
        if fraction >= cut:
            return level
    return 1


def proficiency_scale_text() -> str:
    """The same thresholds as prose, for prompts. Never hand-write these again."""
    parts, prev = [], 1.01
    for cut, level in PROFICIENCY_CUTS:
        parts.append(f"{cut:.0%}-{prev - 0.01:.0%} is level {level}")
        prev = cut
    parts.append(f"below {PROFICIENCY_CUTS[-1][0]:.0%} is level 1")
    return "; ".join(parts)


def proficiency(mastery: float, grade: int) -> tuple[int, str]:
    """Fraction correct -> the rubric's 1-4 level and its label."""
    level = proficiency_level(mastery)
    book = rubric(grade)
    if not book:
        return level, ""
    return level, book["metadata"]["proficiency_scale"][str(level)]["label"]
