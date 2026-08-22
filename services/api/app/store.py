"""In-memory session store. Hackathon scope: one process, no DB.

Swap for Postgres later -- the shapes already match the long-term data model
(student_skill_mastery, worksheets, attempts).
"""
from __future__ import annotations
from threading import Lock
from typing import Any, Optional


class Store:
    def __init__(self) -> None:
        self._lock = Lock()
        self.worksheets: dict[str, dict[str, Any]] = {}
        self.students: dict[str, dict[str, Any]] = {}
        self.attempts: list[dict[str, Any]] = []

    def student(self, student_id: str) -> dict[str, Any]:
        with self._lock:
            return self.students.setdefault(
                student_id,
                {
                    "student_id": student_id,
                    "grade_level": None,
                    "target_skill": None,
                    "mastery": {},
                    "history": [],
                },
            )

    def save_worksheet(self, ws: dict[str, Any]) -> None:
        with self._lock:
            self.worksheets[ws["id"]] = ws

    def get_worksheet(self, worksheet_id: str) -> Optional[dict[str, Any]]:
        return self.worksheets.get(worksheet_id)

    def record_attempt(self, result: dict[str, Any]) -> None:
        with self._lock:
            self.attempts.append(result)
            s = self.students.setdefault(result["student_id"], {"history": []})
            s["mastery"] = result["mastery_after"]
            s["target_skill"] = result["next_target_skill"]
            s["grade_level"] = result["next_grade_level"]
            s.setdefault("history", []).append(
                {
                    "worksheet_id": result["worksheet_id"],
                    "score": result["score"],
                    "decision": result["decision"],
                    "next_target_skill": result["next_target_skill"],
                }
            )


STORE = Store()
