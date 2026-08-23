"""SQLite persistence for UnStuck -- every table lives in schema ``unstuck``.

Database file: data/unstuck.db   (override with env UNSTUCK_DB)
Reset + reseed: env UNSTUCK_RESET=1

On first boot init_db() applies schema.sql and seeds ONCE from the static JSON
sources (data/mock/*.json + curriculum/math-curriculum-4-6.json).  After that
the service layer talks SQL only -- request paths never read JSON files.
"""
from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone

_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_REPO_ROOT = os.path.abspath(os.path.join(_THIS_DIR, "..", "..", ".."))
DB_PATH = os.getenv("UNSTUCK_DB", os.path.join(_REPO_ROOT, "data", "unstuck.db"))
_SCHEMA = os.path.join(_THIS_DIR, "schema.sql")

_LOCK = threading.RLock()
_CONN: sqlite3.Connection | None = None


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


def query_all(sql: str, params: tuple = ()) -> list[dict]:
    with _LOCK:
        cur = connect().execute(sql, params)
        rows = [dict(r) for r in cur.fetchall()]
        cur.close()
        return rows


def query_one(sql: str, params: tuple = ()) -> dict | None:
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
    """Monotonic ids like asmt-101 (replaces seed.next_id)."""
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


def init_db(force_reset: bool | None = None) -> dict:
    """Apply schema, seed once from JSON when empty. Returns counts for logs."""
    reset = force_reset if force_reset is not None \
        else os.getenv("UNSTUCK_RESET", "") in ("1", "true", "yes")
    if reset:
        for suffix in ("", "-wal", "-shm"):
            try:
                os.remove(DB_PATH + suffix)
            except FileNotFoundError:
                pass
    conn = connect()
    with _LOCK:
        conn.executescript(open(_SCHEMA, encoding="utf-8").read())
        seeded = False
        n = query_one("SELECT COUNT(*) AS c FROM unstuck.students")["c"]
        if n == 0:
            from . import seed_sqlite
            seed_sqlite.seed(conn)
            conn.commit()
            seeded = True
        c = lambda t: query_one(f"SELECT COUNT(*) AS c FROM unstuck.{t}")["c"]
        return {
            "db": DB_PATH,
            "seeded_from_json": seeded,
            "students": c("students"),
            "questions": c("questions"),
            "skills": c("skills"),
            "edges": c("skill_edges"),
            "worksheets": c("worksheets"),
            "attempts": c("attempts"),
        }


def question_get(qid: str) -> dict | None:
    """Full question row including the answer key, choices decoded."""
    row = query_one(
        "SELECT id, skill_id, prompt, choices, correct_index"
        " FROM unstuck.questions WHERE id = ?", (qid,))
    if row is None:
        return None
    row["choices"] = json.loads(row["choices"] or "[]")
    return row


def questions_for_quiz() -> list[dict]:
    """Every question ordered by curriculum position (grade, then difficulty)."""
    rows = query_all(
        "SELECT q.id, q.skill_id, q.prompt, q.choices, q.correct_index"
        " FROM unstuck.questions q JOIN unstuck.skills s ON s.id = q.skill_id"
        " ORDER BY s.grade, s.difficulty, q.id")
    for r in rows:
        r["choices"] = json.loads(r["choices"] or "[]")
    return rows
