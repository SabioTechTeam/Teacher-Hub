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
    # (container, unit): genuinely fillable and divisible into equal parts.
    # "a {container} holds {n} {unit}s" must read true.
    vessels: list[tuple[str, str]] = field(default_factory=list)
    # Things you spend TIME on. Used when a sum exceeds one whole, where a
    # container story would be impossible but an accumulating one is fine.
    activities: list[str] = field(default_factory=list)
    # Small countable collectibles. Grades 1-3 count objects, and you cannot
    # "find 8 more segments" -- you find coins, eggs, bolts.
    tokens: list[str] = field(default_factory=list)
    # things you can have a ratio of: (a, b)
    pairs: list[tuple[str, str]] = field(default_factory=list)
    # short encouragement in the theme's voice
    cheers: list[str] = field(default_factory=list)


THEMES: dict[str, Theme] = {
    "space": Theme(
        id="space", label="Space & Rockets", emoji="🚀",
        vessels=[("cargo pod", "supply crate"), ("fuel tank", "cell"), ("supply crate", "ration")],
        activities=["mission", "spacewalk", "launch checklist"],
        tokens=["star", "moon rock", "supply crate"],
        pairs=[("astronauts", "seats"), ("moons", "planets"), ("oxygen tanks", "fuel tanks")],
        cheers=["Liftoff!", "You're in orbit!", "Mission control is impressed!"],
    ),
    "minecraft": Theme(
        id="minecraft", label="Minecraft Blocks", emoji="🎮",
        vessels=[("chest", "block"), ("crafting grid", "slot"), ("stack", "item")],
        activities=["build", "mining trip", "redstone project"],
        tokens=["block", "diamond", "torch"],
        pairs=[("diamonds", "iron ingots"), ("oak planks", "sticks"), ("redstone", "torches")],
        cheers=["Blocks stacked!", "Crafted perfectly!", "That's a diamond answer!"],
    ),
    "videogames": Theme(
        id="videogames", label="Video Games", emoji="🎮",
        # Generic game vocabulary on purpose. A child who loves a specific
        # franchise reads "quest log" as their world, and we ship no one
        # else's trademarks or characters.
        vessels=[("quest log", "objective"), ("inventory", "slot"), ("health bar", "segment"), ("coin pouch", "coin")],
        activities=["level", "boss fight", "side quest"],
        tokens=["coin", "gem", "star"],
        pairs=[("coins collected", "coins in the level"), ("levels cleared", "levels"),
               ("power-ups", "item boxes"), ("hearts remaining", "hearts total")],
        cheers=["Level up!", "New high score!", "Achievement unlocked!"],
    ),
    "basketball": Theme(
        id="basketball", label="Basketball Stats", emoji="🏀",
        vessels=[("water bottle", "gulp"), ("ball rack", "slot"), ("scorebook page", "row")],
        activities=["practice", "shooting drill", "scrimmage"],
        tokens=["ball", "point", "jersey"],
        pairs=[("free throws made", "attempts"), ("three-pointers", "total shots"), ("assists", "passes")],
        cheers=["Nothing but net!", "Buzzer beater!", "That's a triple-double!"],
    ),
    "dinosaurs": Theme(
        id="dinosaurs", label="Dinosaurs", emoji="🦖",
        vessels=[("museum case", "specimen"), ("nest", "egg"), ("fossil crate", "bone")],
        activities=["dig", "fossil hunt", "museum tour"],
        tokens=["fossil", "egg", "bone"],
        pairs=[("herbivores", "carnivores"), ("complete fossils", "fragments"), ("footprints", "trails")],
        cheers=["Roar-some!", "Prehistoric precision!", "You dug that up perfectly!"],
    ),
    "robotics": Theme(
        id="robotics", label="Robotics & Coding", emoji="🤖",
        vessels=[("battery pack", "cell"), ("parts bin", "component"), ("cable spool", "metre")],
        activities=["build", "coding session", "test run"],
        tokens=["bolt", "wire", "sensor"],
        pairs=[("working robots", "kits"), ("lines of code", "functions"), ("motors", "wheels")],
        cheers=["Compiled successfully!", "Zero bugs!", "Systems nominal!"],
    ),
    "soccer": Theme(
        id="soccer", label="Soccer", emoji="⚽",
        vessels=[("water bottle", "gulp"), ("ball bag", "ball"), ("kit box", "shirt")],
        activities=["practice", "match", "training session"],
        tokens=["goal", "ball", "sticker"],
        pairs=[("goals", "shots on target"), ("wins", "matches played"), ("passes completed", "passes")],
        cheers=["GOAL!", "Back of the net!", "What a strike!"],
    ),
}

# Used when a parent has selected nothing, so the page is never bare.
NEUTRAL = Theme(
    id="neutral", label="Everyday", emoji="✏️",
    vessels=[("pizza", "slice"), ("chocolate bar", "piece"), ("ribbon", "equal part")],
    activities=["homework session", "reading time", "walk to school"],
    tokens=["sticker", "marble", "pencil"],
    pairs=[("apples", "oranges"), ("red marbles", "blue marbles"), ("cups of flour", "cups of milk")],
    cheers=["Great job!", "Well done!", "You got it!"],
)


def plural(word: str) -> str:
    """Enough English for the nouns in this file. 'coin pouch' -> 'coin pouches'."""
    w = word.strip()
    if not w:
        return w
    if w.endswith("y") and len(w) > 1 and w[-2] not in "aeiou":
        return w[:-1] + "ies"
    if w.endswith(("ch", "sh", "s", "x", "z")):
        return w + "es"
    return w + "s"


def singular(phrase: str) -> str:
    """Singularise the HEAD noun of a phrase: 'hearts remaining' -> 'heart remaining'.

    Naive last-word stripping produced "there is 1 hearts remaining", because the
    plural sits on the first word in these labels.
    """
    parts = phrase.split()
    if not parts:
        return phrase
    # Singularise the first plural-looking word, wherever it sits:
    # "free throws made" -> "free throw made", "hearts remaining" -> "heart remaining".
    for i, w in enumerate(parts):
        if w.endswith("ies") and len(w) > 3:
            parts[i] = w[:-3] + "y"
        elif w.endswith("es") and w[:-2].endswith(("ch", "sh", "s", "x", "z")):
            parts[i] = w[:-2]
        elif w.endswith("s") and not w.endswith("ss"):
            parts[i] = w[:-1]
        else:
            continue
        break
    return " ".join(parts)


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
