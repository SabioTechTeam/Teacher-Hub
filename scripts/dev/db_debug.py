#!/usr/bin/env python3
"""Debug helper: apply app/schema.sql statement-by-statement against a fresh
in-memory connection with data/unstuck.db attached as `unstuck`, printing the
exact statement that fails (if any)."""
import os
import sqlite3

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PATH = os.path.join(ROOT, "data", "unstuck.db")

print("sqlite version:", sqlite3.sqlite_version)
for suf in ("", "-wal", "-shm"):
    try:
        os.remove(PATH + suf)
    except FileNotFoundError:
        pass

conn = sqlite3.connect(":memory:")
try:
    conn.execute("ATTACH DATABASE ? AS unstuck", (PATH,))
    print("ATTACH ok ->", conn.execute("PRAGMA database_list").fetchall())
except Exception as e:
    print("ATTACH FAILED:", type(e).__name__, e)
    raise SystemExit(1)

with open(os.path.join(ROOT, "services", "api", "app", "schema.sql"),
          encoding="utf-8") as fh:
    script = fh.read()

stmts = [s.strip() for s in script.split(";") if s.strip()]
print("statements:", len(stmts))
for i, s in enumerate(stmts):
    try:
        conn.execute(s)
    except Exception as e:
        print(f"--- FAIL stmt {i}: {type(e).__name__}: {e}")
        print(s[:400])
        break
else:
    print("ALL STATEMENTS OK")
    tables = conn.execute(
        "SELECT name FROM unstuck.sqlite_master WHERE type='table'").fetchall()
    print("tables:", [r[0] for r in tables])
