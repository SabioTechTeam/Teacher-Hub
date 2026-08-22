"""Thin OpenRouter client. One place to swap providers.

Returns None whenever the key is missing or the call fails, so every caller
must have a non-LLM fallback. The demo has to survive a dead API key.
"""
from __future__ import annotations
import json
import os
from typing import Any, Optional


def enabled() -> bool:
    return bool(os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY"))


def complete_json(system: str, user: str, *, timeout: float = 30.0) -> Optional[dict[str, Any]]:
    key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not key:
        return None
    base = os.getenv("OPENAI_BASE_URL") or os.getenv(
        "OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"
    )
    model = os.getenv("OPENAI_MODEL", "openai/gpt-4o-mini")
    try:
        import httpx

        r = httpx.post(
            f"{base.rstrip('/')}/chat/completions",
            headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
            json={
                "model": model,
                "temperature": 0.4,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
            timeout=timeout,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        return json.loads(content)
    except Exception as exc:  # noqa: BLE001 - demo must not crash on LLM failure
        print(f"[llm] falling back, call failed: {exc}")
        return None
