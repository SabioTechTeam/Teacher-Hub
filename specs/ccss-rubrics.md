# CCSS rubrics

`curriculum/rubrics/grade{4,5,6}_ccss_math_rubric.json` — 82 standards across five
domains per grade. Each standard carries a description, `max_points`, and 1-4
level criteria. `ai/prompts/assessment/quiz_evaluator.md` is the matching
evaluator system prompt.

## What uses them

**Worksheet grounding.** `curriculum.grounding(skill_id)` returns a prompt
fragment with the mapped standard's description plus its level-3 ("meets") and
level-4 ("exceeds") criteria. `generate_worksheet._prompt()` uses it in place of
the bare `Standards: 4.NF.A.1` line, which carried no meaning for the model.
Unmapped skills fall back to the old bare-id line, so this can only add signal.

**Proficiency labels.** `curriculum.proficiency(mastery, grade)` maps a mastery
fraction to the rubric's own 1-4 scale and label. Level 3 "Meets Standard" is
pinned to the same 0.8 that `update_student.ADVANCE_AT` uses, so the label and the
routing cannot disagree. Surfaced on `AttemptResult` as `proficiency_level` /
`proficiency_label` for the UI to render instead of a raw float.

The join works because skill YAML writes cluster letters (`4.NF.A.1`) and the
rubrics do not (`4.NF.1`); `standard_for()` strips them. It searches the skill's
own grade first, then the other grades — a skill labelled grade 5 may legitimately
cite a grade-4 standard, which two of ours do.

## Bugs this surfaced (fixed here)

**`_repo_root()` found the wrong directory.** It probed for a directory named
`curriculum`, and `services/agent/curriculum/` — the Python package — matched
before the repo's data directory. So `load_curriculum()` never read
`curriculum/skills/*.yaml`; it silently fell back to `_FALLBACK_SKILLS` every
time, meaning curriculum edits had no effect on anything. Now probes
`curriculum/skills`.

**Every LLM item was being dropped.** The model returns `difficulty: "easy"` where
`WorksheetItem.difficulty` is a float, so `float()` raised and each item was
rejected as malformed. The live path therefore never shipped model-written items —
it always served templates while reporting `source` correctly but going unnoticed.
Difficulty words are now coerced and the system prompt says it must be a number.

## Known, not fixed

**`check` does not fit comparison items.** For "which is larger, 2/3 or 3/4?" the
model emits `check: "2/3 < 3/4"`, and `mathcheck.safe_eval` only evaluates
arithmetic, so every item is rejected and the skill falls back to templates.
Arithmetic skills are unaffected — `math.5.fractions.add-like` generates with
`source=llm` and verified keys. Fixing this means changing what `check` means for
non-arithmetic item types, which is core to the answer-key safety path.

**`math.4.fractions.parts` has no correct standard here.** "Parts of a Whole" is
CCSS 3.NF.1, and only grades 4-6 rubrics exist, so it shares 4.NF.1 with
`math.4.fractions.equivalent` and both get identical grounding. Either add a
grade-3 rubric or accept the overlap.

## Curriculum mappings corrected

| skill | was | now | why |
|---|---|---|---|
| `math.5.fractions.compare` | 5.NF.A.1 | **4.NF.A.2** | 5.NF.1 is adding unlike denominators, not comparing |
| `math.5.fractions.add-like` | 5.NF.A.1 | **4.NF.B.3** | 5.NF.1 is *unlike* denominators; this skill is *like* |

These are role 3's files. Both were feeding the wrong standard text straight into
the generation prompt, which is why they are corrected here rather than filed.
