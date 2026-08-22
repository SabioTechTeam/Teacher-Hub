"""Worksheet generation via OpenRouter with mock fallback."""
from __future__ import annotations

import json, os, re, uuid
from pathlib import Path
from typing import Any, Optional
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[3]
PROMPTS = ROOT / "ai" / "prompts"
CURRICULUM = ROOT / "curriculum" / "skills" / "math"


def _read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return ""


def _load_skill(skill_id: Optional[str]) -> dict[str, Any]:
    if not skill_id:
        skill_id = "math.5.fractions.compare"
    for path in CURRICULUM.rglob("*.yaml"):
        text = path.read_text(encoding="utf-8")
        if f"id: {skill_id}" in text:
            data: dict[str, Any] = {"id": skill_id, "raw": text}
            for line in text.splitlines():
                if ":" in line and not line.strip().startswith("-"):
                    k, v = line.split(":", 1)
                    data[k.strip()] = v.strip().strip('"')
            return data
    return {"id": skill_id, "name": skill_id, "grade": "5"}


def mock_worksheet(skill_id: Optional[str], grade_level: Optional[int], student_id: str) -> dict[str, Any]:
    skill = _load_skill(skill_id)
    sid = skill.get("id", skill_id or "math.5.fractions.compare")
    name = skill.get("name", sid)
    items = [
        {"id": "q1", "prompt": f"({name}) Which is greater: 3/4 or 2/3?", "answer": "3/4"},
        {"id": "q2", "prompt": f"({name}) Write a fraction equivalent to 1/2 with denominator 8.", "answer": "4/8"},
        {"id": "q3", "prompt": f"({name}) True or false: 2/5 < 3/5", "answer": "true"},
    ]
    return {
        "worksheet_id": f"mock-{uuid.uuid4().hex[:8]}",
        "skill_id": sid,
        "grade_level": grade_level or int(str(skill.get("grade", 5)).split()[0] or 5),
        "student_id": student_id,
        "source": "mock",
        "items": items,
    }


def _client():
    key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    base = os.getenv("OPENROUTER_BASE_URL") or os.getenv("OPENAI_BASE_URL") or "https://openrouter.ai/api/v1"
    return OpenAI(api_key=key, base_url=base)


def _extract_json(text):
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", text, re.S)
        if not m:
            raise
        return json.loads(m.group(0))


def generate_worksheet(student_id, skill_id=None, grade_level=None):
    skill = _load_skill(skill_id)
    client = _client()
    if client is None:
        return mock_worksheet(skill_id, grade_level, student_id)

    system = _read(PROMPTS / "teacher" / "system.md") or "You are a Grades 4-6 math teaching agent."
    explain = _read(PROMPTS / "teacher" / "explain.md")
    model = os.getenv("OPENAI_MODEL", "openai/gpt-4o-mini")
    skill_id_v = skill.get("id")
    skill_name = skill.get("name")
    grade_v = grade_level or skill.get("grade")
    skill_raw = skill.get("raw", "")
    user = (
        "Create a short worksheet (exactly 3 items) for this skill.\n"
        "Return ONLY JSON with shape:\n"
        '{"items":[{"id":"q1","prompt":"...","answer":"..."}]}\n\n'
        f"skill_id: {skill_id_v}\n"
        f"skill_name: {skill_name}\n"
        f"grade_level: {grade_v}\n"
        f"skill_yaml:\n{skill_raw}\n\n"
        f"Guidance:\n{explain}\n"
    )
    try:
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0.4,
        )
        content = resp.choices[0].message.content or "{}"
        data = _extract_json(content)
        items = data.get("items") or []
        if not items:
            return mock_worksheet(skill_id, grade_level, student_id)
        norm = []
        for i, it in enumerate(items[:5], start=1):
            norm.append({
                "id": str(it.get("id") or f"q{i}"),
                "prompt": str(it.get("prompt") or ""),
                "answer": str(it.get("answer") or ""),
            })
        return {
            "worksheet_id": f"or-{uuid.uuid4().hex[:8]}",
            "skill_id": skill.get("id"),
            "grade_level": grade_level or int(str(skill.get("grade", 5)).split()[0] or 5),
            "student_id": student_id,
            "source": "openrouter",
            "items": norm,
        }
    except Exception as exc:
        fallback = mock_worksheet(skill_id, grade_level, student_id)
        fallback["source"] = "mock_fallback"
        fallback["error"] = str(exc)[:200]
        return fallback
