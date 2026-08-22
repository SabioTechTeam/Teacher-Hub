"""Parent and teacher notes -> worksheet guidance.

DEMO-GRADE. See docs/product/PENDING-notes-plumbing.md for what this needs
before it goes near a real classroom.

What it does today: takes the free-text observation boxes and the teacher's
strategy dropdown and turns them into a small set of typed knobs that shape the
*next* worksheet — strategy, item count, hint generosity, and a short sanitized
line of context for the item writer.

The one rule that is not demo-grade and should not be relaxed: notes influence
HOW a skill is taught, never WHAT skill is chosen or how an answer is graded.
Skill routing stays on the prerequisite graph and grading stays deterministic,
so a note can never move a child's mastery or mark a wrong answer right.
"""
from __future__ import annotations
import re
from dataclasses import dataclass, field

# Teacher dropdown values (apps/web/app/teacher/dashboard) -> agent strategies.
STRATEGY_MAP = {
    "visual": "visual_model",
    "worked_example": "worked_example",
    "story": "story_context",
    "steps": "worked_example",
}

# Phrases that read as instructions to a model rather than observations about a
# child. Stripped before any note text reaches a prompt. This is a blunt filter,
# deliberately — the real fix is typed extraction, not a better blocklist.
_INJECTION = re.compile(
    r"\b(ignore|disregard|forget)\b.{0,30}\b(previous|prior|above|instruction|prompt|rule)s?\b"
    r"|\byou are now\b|\bsystem prompt\b|\bact as\b|\bpretend to be\b"
    r"|\breveal\b.{0,25}\b(prompt|instruction|answer key|answer)s?\b"
    r"|\balways mark\b|\bmark (all|every)\b.{0,20}\bcorrect\b",
    re.IGNORECASE,
)
MAX_NOTE_CHARS = 400


@dataclass
class Guidance:
    """Typed knobs derived from notes. Everything here is advisory."""
    strategy: str | None = None
    item_count: int | None = None
    hints_up_front: bool = False
    context: str = ""            # sanitized, for the item writer
    sources: list[str] = field(default_factory=list)   # e.g. ["teacher", "parent"]
    applied: list[str] = field(default_factory=list)   # human-readable, shown in the UI


def sanitize(text: str) -> tuple[str, bool]:
    """Return (clean_text, was_modified). Never raises on odd input."""
    raw = (text or "").strip()
    clean = _INJECTION.sub("", raw)
    clean = re.sub(r"\s+", " ", clean).strip()[:MAX_NOTE_CHARS]
    return clean, clean != raw[:MAX_NOTE_CHARS]


# Observation keywords -> knob. Crude on purpose; see the pending doc.
_SLOW = ("struggl", "frustrat", "overwhelm", "anxious", "cries", "gives up",
         "shuts down", "tired", "confus", "lost")
_FAST = ("bored", "too easy", "breezes", "flies through", "ahead", "advanced")
_VISUAL = ("visual", "picture", "draw", "sees it", "fraction bar", "number line", "manipulative")
_STORY = ("story", "real world", "loves reading", "narrative", "context")


def derive(
    parent_note: str = "",
    teacher_note: str = "",
    strategy_override: str | None = None,
    default_items: int = 6,
) -> Guidance:
    g = Guidance()
    parts: list[str] = []

    for label, note in (("teacher", teacher_note), ("parent", parent_note)):
        clean, flagged = sanitize(note)
        if not clean:
            continue
        g.sources.append(label)
        parts.append(f"{label.capitalize()} observed: {clean}")
        if flagged:
            g.applied.append(f"{label} note partly filtered")

    blob = " ".join(parts).lower()

    # The dropdown is structured input, so it wins over anything inferred.
    if strategy_override and strategy_override in STRATEGY_MAP:
        g.strategy = STRATEGY_MAP[strategy_override]
        g.applied.append(f"teacher strategy: {strategy_override}")
    elif any(k in blob for k in _VISUAL):
        g.strategy = "visual_model"
        g.applied.append("visual models (from notes)")
    elif any(k in blob for k in _STORY):
        g.strategy = "story_context"
        g.applied.append("story context (from notes)")

    if any(k in blob for k in _SLOW):
        g.item_count = max(3, default_items - 2)
        g.hints_up_front = True
        g.applied.append("shorter set, hints shown up front")
    elif any(k in blob for k in _FAST):
        g.item_count = min(10, default_items + 2)
        g.applied.append("longer set")

    g.context = " ".join(parts)[:MAX_NOTE_CHARS]
    return g
