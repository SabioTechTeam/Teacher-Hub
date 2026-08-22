"""Loads curriculum/skills/**.yaml and curriculum/prerequisites/math.yaml.

The prerequisite graph is what makes the loop adaptive: a low score walks
*down* an edge to the prerequisite skill, a high score walks *up* to a
successor. Without it, "adapt" is just a grade number going up and down.
"""
from __future__ import annotations
import os
from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None


def _repo_root() -> str:
    here = os.path.abspath(os.path.dirname(__file__))
    for _ in range(6):
        # Probe curriculum/skills, not curriculum: this file lives in a package
        # also named "curriculum", which otherwise matches first and makes the
        # loader silently fall back to _FALLBACK_SKILLS instead of reading YAML.
        if os.path.isdir(os.path.join(here, "curriculum", "skills")):
            return here
        here = os.path.dirname(here)
    return os.getcwd()


@dataclass
class Skill:
    id: str
    grade: int
    name: str
    prerequisites: list[str] = field(default_factory=list)
    standards: list[str] = field(default_factory=list)
    difficulty: float = 0.5
    subject: str = "mathematics"


@dataclass
class Curriculum:
    skills: dict[str, Skill]
    edges: list[tuple[str, str]]

    def successors(self, skill_id: str) -> list[str]:
        return [b for a, b in self.edges if a == skill_id and b in self.skills]

    def predecessors(self, skill_id: str) -> list[str]:
        out = [a for a, b in self.edges if b == skill_id and a in self.skills]
        sk = self.skills.get(skill_id)
        if sk:
            out += [p for p in sk.prerequisites if p in self.skills and p not in out]
        return out

    def get(self, skill_id: str) -> Optional[Skill]:
        return self.skills.get(skill_id)

    def by_grade(self, grade: int) -> list[Skill]:
        return sorted(
            [s for s in self.skills.values() if s.grade == grade],
            key=lambda s: s.difficulty,
        )

    def easiest(self) -> Skill:
        return sorted(self.skills.values(), key=lambda s: (s.grade, s.difficulty))[0]


# Fallback so the demo never dies on a missing file or missing PyYAML.
_FALLBACK_SKILLS = [
    dict(id="math.4.fractions.parts", grade=4, name="Parts of a Whole",
         prerequisites=[], standards=["4.NF.A.1"], difficulty=0.3),
    dict(id="math.4.fractions.equivalent", grade=4, name="Equivalent Fractions",
         prerequisites=["math.4.fractions.parts"], standards=["4.NF.A.1"], difficulty=0.45),
    dict(id="math.5.fractions.compare", grade=5, name="Compare Fractions",
         prerequisites=["math.4.fractions.equivalent"], standards=["5.NF.A.1"], difficulty=0.5),
    dict(id="math.5.fractions.add-like", grade=5, name="Add Fractions (Like Denominators)",
         prerequisites=["math.5.fractions.compare"], standards=["5.NF.A.1"], difficulty=0.55),
    dict(id="math.6.ratios.intro", grade=6, name="Ratio Concepts",
         prerequisites=["math.5.fractions.compare"], standards=["6.RP.A.1"], difficulty=0.6),
]
_FALLBACK_EDGES = [
    ("math.4.fractions.parts", "math.4.fractions.equivalent"),
    ("math.4.fractions.equivalent", "math.5.fractions.compare"),
    ("math.5.fractions.compare", "math.5.fractions.add-like"),
    ("math.5.fractions.compare", "math.6.ratios.intro"),
]


@lru_cache(maxsize=1)
def load_curriculum() -> Curriculum:
    root = _repo_root()
    skills: dict[str, Skill] = {}
    edges: list[tuple[str, str]] = []

    skills_dir = os.path.join(root, "curriculum", "skills")
    if yaml and os.path.isdir(skills_dir):
        for dirpath, _, files in os.walk(skills_dir):
            for fn in files:
                if not fn.endswith((".yaml", ".yml")):
                    continue
                with open(os.path.join(dirpath, fn), "r", encoding="utf-8") as fh:
                    d = yaml.safe_load(fh) or {}
                if not d.get("id"):
                    continue
                skills[d["id"]] = Skill(
                    id=d["id"], grade=int(d.get("grade", 5)), name=d.get("name", d["id"]),
                    prerequisites=list(d.get("prerequisites") or []),
                    standards=list(d.get("standards") or []),
                    difficulty=float(d.get("difficulty", 0.5)),
                    subject=d.get("subject", "mathematics"),
                )
        pre_path = os.path.join(root, "curriculum", "prerequisites", "math.yaml")
        if os.path.isfile(pre_path):
            with open(pre_path, "r", encoding="utf-8") as fh:
                d = yaml.safe_load(fh) or {}
            for e in d.get("edges") or []:
                if e.get("from") and e.get("to"):
                    edges.append((e["from"], e["to"]))

    if not skills:
        skills = {s["id"]: Skill(**s) for s in _FALLBACK_SKILLS}
        edges = list(_FALLBACK_EDGES)
    if not edges:
        for s in skills.values():
            for p in s.prerequisites:
                edges.append((p, s.id))

    return Curriculum(skills=skills, edges=edges)
