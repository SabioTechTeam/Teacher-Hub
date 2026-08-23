"""Student/worksheet/attempt persistence -- backed by SQLite (schema unstuck).

Keeps the exact interface the routes already use (STORE.student,
save_worksheet, get_worksheet, record_attempt) so main.py needed no changes
when the in-memory dicts were replaced by SQL.
"""
from __future__ import annotations

import json
from typing import Any, Optional

from . import db

_HISTORY_LIMIT = 20

_WRITABLE = ("name", "grade_level", "target_skill", "gap_skill",
             "strategy", "sessions_completed", "points", "level",
             "current_streak", "best_streak", "badges", "notes")


class Store:
    # ---- students -----------------------------------------------------------
    def _ensure(self, student_id: str) -> dict:
        row = db.query_one(
            "SELECT * FROM unstuck.students WHERE id = ?", (student_id,))
        if row is None:
            db.execute(
                "INSERT INTO unstuck.students(id, created_at, updated_at)"
                " VALUES(?,?,?)", (student_id, db._now(), db._now()))
            row = db.query_one(
                "SELECT * FROM unstuck.students WHERE id = ?", (student_id,))
        return row

    def student(self, student_id: str) -> dict[str, Any]:
        """Full adaptive profile: identity + mastery + history + notes."""
        row = self._ensure(student_id)
        mastery = {
            r["skill_id"]: r["value"]
            for r in db.query_all(
                "SELECT skill_id, value FROM unstuck.mastery WHERE student_id = ?",
                (student_id,))
        }
        history = [
            {"worksheet_id": r["worksheet_id"], "score": r["score"],
             "decision": r["decision"], "next_target_skill": r["next_target_skill"]}
            for r in db.query_all(
                "SELECT worksheet_id, score, decision, next_target_skill"
                " FROM unstuck.attempts WHERE student_id = ?"
                " ORDER BY created_at DESC, id DESC LIMIT ?",
                (student_id, _HISTORY_LIMIT))
        ]
        return {
            "student_id": row["id"],
            "name": row["name"],
            "grade_level": row["grade_level"],
            "target_skill": row["target_skill"],
            "gap_skill": row["gap_skill"],
            "strategy": row["strategy"],
            "sessions_completed": row["sessions_completed"],
            "points": row["points"],
            "level": row["level"],
            "mastery": mastery,
            "history": list(reversed(history)),
            "notes": json.loads(row["notes"] or "{}"),
        }

    def update_student(self, student_id: str, **fields: Any) -> None:
        """Persist scalar columns (target_skill, grade_level, notes, ...)."""
        self._ensure(student_id)
        cols, params = [], []
        for key, val in fields.items():
            if key not in _WRITABLE:
                continue
            if key in ("badges", "notes") and not isinstance(val, str):
                val = json.dumps(val)
            cols.append(f"{key} = ?")
            params.append(val)
        if not cols:
            return
        cols.append("updated_at = ?")
        params.append(db._now())
        params.append(student_id)
        db.execute(
            f"UPDATE unstuck.students SET {', '.join(cols)} WHERE id = ?",
            tuple(params))

    # ---- worksheets -----------------------------------------------------------
    def save_worksheet(self, ws: dict[str, Any]) -> None:
        with db.tx() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO unstuck.worksheets"
                "(id, student_id, target_skill, grade_level, strategy, created_at)"
                " VALUES(?,?,?,?,?,?)",
                (ws["id"], ws.get("student_id"), ws.get("target_skill"),
                 ws.get("grade_level"), ws.get("strategy", ""), db._now()))
            conn.execute(
                "DELETE FROM unstuck.worksheet_items WHERE worksheet_id = ?",
                (ws["id"],))
            conn.executemany(
                "INSERT INTO unstuck.worksheet_items(worksheet_id, position, item)"
                " VALUES(?,?,?)",
                [(ws["id"], i, json.dumps(it))
                 for i, it in enumerate(ws.get("items") or [])])

    def get_worksheet(self, worksheet_id: str) -> Optional[dict[str, Any]]:
        row = db.query_one(
            "SELECT * FROM unstuck.worksheets WHERE id = ?", (worksheet_id,))
        if row is None:
            return None
        items = [
            json.loads(r["item"])
            for r in db.query_all(
                "SELECT item FROM unstuck.worksheet_items"
                " WHERE worksheet_id = ? ORDER BY position", (worksheet_id,))
        ]
        return {
            "id": row["id"],
            "student_id": row["student_id"],
            "target_skill": row["target_skill"],
            "grade_level": row["grade_level"],
            "strategy": row["strategy"],
            "items": items,
        }

    # ---- attempts ---------------------------------------------------------------
    def record_attempt(self, result: dict[str, Any]) -> None:
        """Store one graded attempt, then fold its effects into the student."""
        att_id = result.get("attempt_id") or db.next_id("attempt")
        with db.tx() as conn:
            conn.execute(
                "INSERT OR REPLACE INTO unstuck.attempts"
                "(id, worksheet_id, student_id, score, decision,"
                " next_target_skill, next_grade_level, payload, created_at)"
                " VALUES(?,?,?,?,?,?,?,?,?)",
                (att_id, result.get("worksheet_id"), result.get("student_id"),
                 result.get("score"), result.get("decision"),
                 result.get("next_target_skill"), result.get("next_grade_level"),
                 json.dumps(result), db._now()))
            sid = result.get("student_id")
            self._ensure(sid)
            conn.execute(
                "UPDATE unstuck.students SET target_skill = ?, grade_level = ?,"
                " updated_at = ? WHERE id = ?",
                (result.get("next_target_skill"),
                 result.get("next_grade_level"), db._now(), sid))
            for skill, value in (result.get("mastery_after") or {}).items():
                conn.execute(
                    "INSERT OR REPLACE INTO unstuck.mastery"
                    "(student_id, skill_id, value, updated_at) VALUES(?,?,?,?)",
                    (sid, skill, float(value), db._now()))


STORE = Store()
