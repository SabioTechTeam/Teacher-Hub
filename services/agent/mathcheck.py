"""Answer normalization and item verification.

Two jobs:
  1. normalize() so "1/2", "2/4", "0.5", " 1 / 2 " all grade the same.
  2. verify_item() so a hallucinated answer key never reaches a student.

The LLM must emit a `check` expression (plain arithmetic) alongside each item.
We evaluate it exactly with Fraction and compare to the stated answer. Items
that fail are dropped, not shipped. On a live demo, a worksheet with a wrong
answer key is the worst possible failure.
"""
from __future__ import annotations
import re
from fractions import Fraction
from typing import Optional

_SAFE = re.compile(r"^[0-9\s\.\+\-\*/\(\)]+$")
_MIXED = re.compile(r"^\s*(-?\d+)\s+(\d+)\s*/\s*(\d+)\s*$")


def to_fraction(text: str) -> Optional[Fraction]:
    """Parse '3/4', '1 1/2', '0.75', '5' into an exact Fraction. None if not numeric."""
    if text is None:
        return None
    s = str(text).strip().replace(",", "")
    if not s:
        return None
    m = _MIXED.match(s)
    if m:
        whole, num, den = int(m.group(1)), int(m.group(2)), int(m.group(3))
        if den == 0:
            return None
        sign = -1 if whole < 0 else 1
        return Fraction(abs(whole)) * sign + sign * Fraction(num, den)
    try:
        if "/" in s:
            num, _, den = s.partition("/")
            return Fraction(int(num.strip()), int(den.strip()))
        return Fraction(s)
    except (ValueError, ZeroDivisionError):
        return None


def safe_eval(expr: str) -> Optional[Fraction]:
    """Evaluate a plain arithmetic expression exactly. Rejects anything else."""
    if not expr or not _SAFE.match(expr):
        return None
    try:
        # Fraction division keeps it exact; no floats, no names, no calls.
        tokens = re.sub(r"(\d+\.\d+|\d+)", r"Fraction('\1')", expr)
        return Fraction(eval(tokens, {"__builtins__": {}}, {"Fraction": Fraction}))  # noqa: S307
    except Exception:
        return None


def normalize(text: str) -> str:
    """Canonical string for grading comparison."""
    f = to_fraction(text)
    if f is not None:
        return str(f)  # Fraction normalizes 2/4 -> 1/2, 4/2 -> 2
    return re.sub(r"\s+", " ", str(text or "").strip().lower())


def answers_match(expected: str, got: str) -> bool:
    if got is None or str(got).strip() == "":
        return False
    e, g = to_fraction(expected), to_fraction(got)
    if e is not None and g is not None:
        return e == g
    return normalize(expected) == normalize(got)


def verify_item(item) -> tuple[bool, str]:
    """Return (ok, reason). Verifies the answer key against the check expression."""
    ans = getattr(item, "answer", None)
    if ans is None or str(ans).strip() == "":
        return False, "empty answer"

    choices = getattr(item, "choices", None) or []
    if getattr(item, "type", "") == "multiple_choice":
        if len(choices) < 2:
            return False, "multiple_choice needs >=2 choices"
        if not any(answers_match(ans, c) for c in choices):
            return False, "answer not among choices"

    check = getattr(item, "check", None)
    if check:
        computed = safe_eval(check)
        if computed is None:
            return False, f"unevaluable check: {check!r}"
        stated = to_fraction(ans)
        if stated is None:
            return False, "answer is not numeric but check is"
        if computed != stated:
            return False, f"check {check} = {computed}, answer says {stated}"
        return True, "verified"

    # No check expression: only allow it if the answer at least parses as a number.
    if to_fraction(ans) is None and getattr(item, "type", "") != "multiple_choice":
        return False, "no check expression and non-numeric answer"
    return True, "accepted (unverified)"
