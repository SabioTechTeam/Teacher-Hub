"""Interest themes — the bridge from the parent hub to worksheet content.

Parents pick their child's interests in /parent/dashboard. Those ids flow
through the session to /worksheets/generate, and land here, where they decide
the *context* of each word problem. The maths never changes; only the story
around it does. That keeps standards alignment intact while making the page
feel like it was written for one specific kid.

Theme ids match HOBBY_OPTIONS in apps/web/app/parent/dashboard/page.tsx.
"""
from __future__ import annotations
import random
from dataclasses import dataclass, field


@dataclass
class Theme:
    id: str
    label: str
    emoji: str
    # (container, unit) pairs — "a {container} holds {n} {unit}s"
    vessels: list[tuple[str, str]] = field(default_factory=list)
    # things you can have a ratio of: (a, b)
    pairs: list[tuple[str, str]] = field(default_factory=list)
    # short encouragement in the theme's voice
    cheers: list[str] = field(default_factory=list)


THEMES: dict[str, Theme] = {
    "space": Theme(
        id="space", label="Space & Rockets", emoji="🚀",
        vessels=[("rocket", "fuel cell"), ("space station", "solar panel"), ("cargo pod", "supply crate")],
        pairs=[("astronauts", "seats"), ("moons", "planets"), ("oxygen tanks", "fuel tanks")],
        cheers=["Liftoff!", "You're in orbit!", "Mission control is impressed!"],
    ),
    "minecraft": Theme(
        id="minecraft", label="Minecraft Blocks", emoji="🎮",
        vessels=[("chest", "block"), ("crafting grid", "slot"), ("stack", "item")],
        pairs=[("diamonds", "iron ingots"), ("oak planks", "sticks"), ("redstone", "torches")],
        cheers=["Blocks stacked!", "Crafted perfectly!", "That's a diamond answer!"],
    ),
    "basketball": Theme(
        id="basketball", label="Basketball Stats", emoji="🏀",
        vessels=[("game", "quarter"), ("season", "game"), ("practice", "drill")],
        pairs=[("free throws made", "attempts"), ("three-pointers", "total shots"), ("assists", "passes")],
        cheers=["Nothing but net!", "Buzzer beater!", "That's a triple-double!"],
    ),
    "dinosaurs": Theme(
        id="dinosaurs", label="Dinosaurs", emoji="🦖",
        vessels=[("fossil dig site", "bone"), ("museum case", "specimen"), ("nest", "egg")],
        pairs=[("herbivores", "carnivores"), ("complete fossils", "fragments"), ("footprints", "trails")],
        cheers=["Roar-some!", "Prehistoric precision!", "You dug that up perfectly!"],
    ),
    "robotics": Theme(
        id="robotics", label="Robotics & Coding", emoji="🤖",
        vessels=[("robot", "servo"), ("circuit board", "sensor"), ("battery pack", "cell")],
        pairs=[("working robots", "kits"), ("lines of code", "functions"), ("motors", "wheels")],
        cheers=["Compiled successfully!", "Zero bugs!", "Systems nominal!"],
    ),
    "soccer": Theme(
        id="soccer", label="Soccer", emoji="⚽",
        vessels=[("match", "half"), ("tournament", "match"), ("training session", "drill")],
        pairs=[("goals", "shots on target"), ("wins", "matches played"), ("passes completed", "passes")],
        cheers=["GOAL!", "Back of the net!", "What a strike!"],
    ),
}

# Used when a parent has selected nothing, so the page is never bare.
NEUTRAL = Theme(
    id="neutral", label="Everyday", emoji="✏️",
    vessels=[("pizza", "slice"), ("chocolate bar", "piece"), ("ribbon", "equal part")],
    pairs=[("apples", "oranges"), ("red marbles", "blue marbles"), ("cups of flour", "cups of milk")],
    cheers=["Great job!", "Well done!", "You got it!"],
)


def resolve(theme_ids: list[str] | None) -> list[Theme]:
    """Map ids from the parent hub to Themes, ignoring anything unknown."""
    picked = [THEMES[t] for t in (theme_ids or []) if t in THEMES]
    return picked or [NEUTRAL]


def pick(theme_ids: list[str] | None, rng: random.Random) -> Theme:
    return rng.choice(resolve(theme_ids))


def prompt_hint(theme_ids: list[str] | None) -> str:
    """One line for the LLM system prompt describing the child's interests."""
    themes = resolve(theme_ids)
    if themes == [NEUTRAL]:
        return "Use everyday contexts (food, sports, school supplies)."
    names = ", ".join(t.label for t in themes)
    return (
        f"Set word problems in contexts the student loves: {names}. "
        "Keep the mathematics identical to the standard — only the story changes. "
        "Do not let the theme make the wording longer or harder to read."
    )
