# Worksheet loop (the "homework")

Owner: worksheet output + adapt. This is steps 4–6 of the core loop in PROJECT.md.

```
 quiz ──► grade level + gap skill ──► GENERATE WORKSHEET ──► student answers
                    ▲                                              │
                    │                                              ▼
                    └────────── ADAPT (walk skill graph) ◄──── GRADE
```

## Three decisions baked in

**1. The LLM writes items. It does not grade them.**
Every generated item ships with an `answer` and a `check` — a plain arithmetic
expression that must evaluate to exactly that answer. `services/agent/mathcheck.py`
verifies it with `Fraction` before the item is allowed into a worksheet. Items that
fail verification are dropped and replaced from the template bank.

Grading is then exact-value comparison, not an LLM call: free, instant, and it
cannot hallucinate a wrong mark. `3/4`, `0.75`, `6/8` and `1 1/2` vs `3/2` all
grade correctly.

**2. Adapt on the skill graph, not the grade number.**
A grade level holds several skills, so moving 5 → 4 says almost nothing. Instead:

| Score | Decision | Next target |
|-------|----------|-------------|
| ≥ 80% | `advance` | successor skill in `curriculum/prerequisites/math.yaml` |
| 50–79% | `hold` | same skill, new items |
| < 50% | `remediate` | the *weakest* prerequisite by current mastery |

That's what makes "the system finds out why they're stuck" real rather than a claim.

**3. The demo survives a dead API key.**
No `OPENROUTER_API_KEY` → `llm.enabled()` is false → worksheets come from the
verified template bank. Everything downstream is identical. `source` on the
worksheet says `llm` or `mock` so you can see which path ran.

## Contracts
`packages/types/src/index.ts` (TS) and `services/agent/schemas.py` (Python) —
keep them in sync. Key shapes: `Worksheet`, `WorksheetItem`, `AttemptResult`.

Answer keys never reach the browser: `/worksheets/generate` and
`/worksheets/{id}` strip `answer`, `check`, and `explanation`.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | `/worksheets/generate` | `{student_id, skill_id?, grade_level?, item_count?}` → worksheet (no keys) |
| GET | `/worksheets/{id}` | re-fetch a worksheet (no keys) |
| POST | `/worksheets/grade` | `{worksheet_id, answers:[{item_id,response}]}` → `AttemptResult` |
| GET | `/students/{id}/mastery` | current mastery + next target |
| GET | `/curriculum/skills` | skills + prerequisite edges |

State is in-memory (`services/api/app/store.py`). Calling `/worksheets/generate`
with only `student_id` picks up wherever the last attempt left the student — that
is the loop.

## Run it
```bash
# no server, no key — proves the loop
python scripts/dev/loop_demo.py

# API
pip install -r services/api/requirements.txt
uvicorn app.main:app --reload --app-dir services/api

# web
cd apps/web && npm install && npm run dev
# open http://localhost:3000/worksheet
```

## Known gaps (deliberate, hackathon scope)
- In-memory store; restart loses state.
- Template bank covers fractions/ratios only — matches the 5 skills in `curriculum/`.
- No randomized strategy assignment yet, so "which strategy worked" data is
  correlational. Cheap to add later, impossible to backfill.
