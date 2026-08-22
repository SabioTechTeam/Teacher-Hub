"""Simple mastery update stub."""
from typing import Dict

def update_mastery(mastery: Dict[str, float], skill_id: str, correct: bool, lr: float = 0.2) -> Dict[str, float]:
    cur = mastery.get(skill_id, 0.5)
    target = 1.0 if correct else 0.0
    mastery[skill_id] = cur + lr * (target - cur)
    return mastery
