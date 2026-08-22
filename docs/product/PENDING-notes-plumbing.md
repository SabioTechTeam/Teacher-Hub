# PENDING: parent & teacher notes — proper plumbing

**Status:** demo-grade wiring shipped. Not classroom-ready.
**Owner:** unassigned
**Blocks:** any pilot with real families or real teachers

## What ships today

The observation boxes in `/parent/dashboard` and the teacher drilldown on
`/teacher/dashboard` now reach the API (`PUT /students/{id}/notes`) and change
the next worksheet: strategy, item count, and whether hints show up front.
`services/agent/notes.py` derives those knobs from keyword matching and passes
a sanitized one-line summary into the item-writing prompt.

The worksheet shows what changed ("Adjusted from your teacher and family: …"),
so an adjustment made on a child's behalf is never invisible to them.

**One boundary is already firm and should stay firm:** notes influence *how* a
skill is taught, never *what* skill is chosen or how an answer is graded.
Skill routing stays on the prerequisite graph; grading stays deterministic
against a verified answer key. A note cannot move mastery or mark a wrong
answer right. Verified: an all-wrong set still scores 0% and still remediates,
whatever the notes say.

## What is demo-grade and needs replacing

**1. Keyword matching is not comprehension.**
`_SLOW`, `_FAST`, `_VISUAL`, `_STORY` are substring lists. "He is *not* bored"
reads as bored. Real fix: a small structured extraction step with a typed
output schema, evaluated against a labelled set — not string matching, and not
raw text into the prompt either.

**2. The injection filter is a blocklist.**
`_INJECTION` catches the obvious phrasings. Blocklists lose. The durable fix is
to stop putting free text in the prompt at all: extract typed fields
(pace, tone, strategy, avoid-list), validate them against an enum, and pass only
those. Then there is no text channel to attack.

**3. Notes are sensitive and currently go to a third-party model.**
A parent writing "he has been struggling since his dad moved out" is family
information, and today the sanitized line reaches the LLM provider. Before a
pilot: decide whether note text ever leaves our infrastructure, and default to
no. Typed extraction (2) makes that easy — enums travel, prose does not.

**4. No retention, no access control, no audit.**
Notes sit in the in-memory store with everything else. A teacher can currently
read any student id; a parent's note about their child has no separate
confidentiality level from a teacher's professional observation. Needs: per-role
read scoping, a retention window, and a log of which note changed which
worksheet.

**5. No teacher review of parent input.**
A parent's note silently changes instruction. In a real classroom the teacher
of record should see and be able to override that, the same way the strategy
dropdown already overrides inference.

## Related

- `docs/product/worksheet-loop.md` — the loop these notes feed
- The IEP upload path in `/parent/dashboard` raises the same questions with
  higher stakes; both should be settled together.
