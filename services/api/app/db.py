"""SQLite persistence for UnStuck -- every table lives in schema ``unstuck``.

Database file: data/unstuck.db   (override with env UNSTUCK_DB)
Reset + reseed: env UNSTUCK_RESET=1
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Optional

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, "..", "..", ".."))
DB_PATH = os.getenv("UNSTUCK_DB", os.path.join(_REPO_ROOT, "data", "unstuck.db"))
_SCHEMA = os.path.join(_THIS_DIR, "schema.sql")

_LOCK = threading.RLock()
_CONN: Optional[sqlite3.Connection] = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def connect() -> sqlite3.Connection:
    """Shared thread-safe connection; the DB file is ATTACHed as `unstuck`."""
    global _CONN
    with _LOCK:
        if _CONN is None:
            os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
            _CONN = sqlite3.connect(":memory:", check_same_thread=False)
            _CONN.row_factory = sqlite3.Row
            _CONN.execute("ATTACH DATABASE ? AS unstuck", (DB_PATH,))
            _CONN.execute("PRAGMA foreign_keys=ON")
        return _CONN


def query_all(sql: str, params: tuple = ()) -> list[dict[str, Any]]:
    with _LOCK:
        cur = connect().execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        return rows


def query_one(sql: str, params: tuple = ()) -> Optional[dict[str, Any]]:
    rows = query_all(sql, params)
    return rows[0] if rows else None


def execute(sql: str, params: tuple = ()) -> int:
    """Run one statement, commit, return affected rowcount."""
    with _LOCK:
        cur = connect().execute(sql, params)
        connect().commit()
        return cur.rowcount


@contextmanager
def tx():
    """Multi-statement transaction: commit on success, rollback on error."""
    with _LOCK:
        try:
            yield connect()
            connect().commit()
        except Exception:
            connect().rollback()
            raise


def next_id(prefix: str) -> str:
    """Monotonic ids like asmt-101."""
    with tx() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO unstuck.sequences(prefix, value) VALUES(?, 100)",
            (prefix,),
        )
        conn.execute(
            "UPDATE unstuck.sequences SET value = value + 1 WHERE prefix = ?",
            (prefix,),
        )
        row = conn.execute(
            "SELECT value FROM unstuck.sequences WHERE prefix = ?", (prefix,)
        ).fetchone()
    return f"{prefix}-{row['value']:03d}"


def questions_for_quiz() -> list[dict[str, Any]]:
    """Return all questions in curriculum order across Grades 1 to 6."""
    rows = query_all(
        "SELECT q.id, q.skill_id, q.prompt, q.choices, q.correct_index, s.grade, s.name as skill_name "
        "FROM unstuck.questions q "
        "LEFT JOIN unstuck.skills s ON q.skill_id = s.id "
        "ORDER BY s.grade ASC, s.difficulty ASC, q.id ASC"
    )
    for r in rows:
        if isinstance(r.get("choices"), str):
            try:
                r["choices"] = json.loads(r["choices"])
            except json.JSONDecodeError:
                pass
    return rows


def init_db(force_reset: Optional[bool] = None) -> dict[str, Any]:
    """Apply schema, seed once from JSON/YAML when empty. Returns counts for logs."""
    global _CONN
    reset = (
        force_reset
        if force_reset is not None
        else os.getenv("UNSTUCK_RESET", "") in ("1", "true", "yes")
    )
    with _LOCK:
        if reset and os.path.exists(DB_PATH):
            if _CONN is not None:
                try:
                    _CONN.close()
                except Exception:
                    pass
                _CONN = None
            for suffix in ("", "-wal", "-shm"):
                p = DB_PATH + suffix
                if os.path.exists(p):
                    try:
                        os.remove(p)
                    except OSError:
                        pass

        conn = connect()
        with open(_SCHEMA, encoding="utf-8") as fh:
            conn.executescript(fh.read())

        row = conn.execute("SELECT COUNT(*) AS c FROM unstuck.skills").fetchone()
        empty = row["c"] == 0
        if empty:
            from . import seed_sqlite
            seed_sqlite.seed(conn)
            conn.commit()

        counts = {
            t: conn.execute(f"SELECT COUNT(*) AS c FROM unstuck.{t}").fetchone()["c"]
            for t in (
                "skills",
                "students",
                "questions",
                "assessments",
                "worksheets",
                "attempts",
            )
        }
        return {"seeded": empty or reset, "counts": counts}
