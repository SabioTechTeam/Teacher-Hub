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
    """Prompt fragment describing the standard, or "" when unmapped."""
    std = standard_for(skill_id)
    if not std:
        return ""
    return (
        f"CCSS {std['id']}: {std['description']}\n"
        f"Meets the standard: {std['levels']['3']}\n"
        f"Exceeds it: {std['levels']['4']}\n"
        "Target the items at the 'meets' criteria.\n"
    )


def proficiency(mastery: float, grade: int) -> tuple[int, str]:
    """Mastery fraction -> the rubric's 1-4 level and its label.

    Level 3 "Meets Standard" is pinned to the same 0.8 that update_student
    treats as advancing, so the label and the routing cannot disagree.
    """
    level = 4 if mastery >= 0.95 else 3 if mastery >= 0.8 else 2 if mastery >= 0.5 else 1
    book = rubric(grade)
    if not book:
        return level, ""
    return level, book["metadata"]["proficiency_scale"][str(level)]["label"]
