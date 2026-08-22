# Teacher-Hub — Project Brief (Hackathon)

**Repo:** https://github.com/SabioTechTeam/Teacher-Hub
**Subject:** Grades 4–6 Math
**LLM:** OpenRouter (`OPENROUTER_API_KEY` on the API only)

## One-liner
AI tutor that quizzes a student, estimates level, generates a worksheet, grades it, and adapts level.

## Core loop (build this)
1. Onboarding
2. Math quiz
3. LLM + curriculum standards/skills → grade level + gap skill
4. Generate worksheet (homework)
5. Student answers
6. Grade → update level → next worksheet easier/harder

## Not in scope for this hackathon
- Full K–12 OS, parent app, Neo4j, Kafka, mobile
- Permanently labeling learning styles (track strategies that work instead)
- Committing API keys to git

## Stack
| Layer | Choice |
|-------|--------|
| Web | Next.js (`apps/web`) |
| API | FastAPI (`services/api`) |
| Agent | Stubs in `services/agent` (diagnose → worksheet → evaluate) |
| Curriculum | YAML in `curriculum/skills/math/` |
| Prompts | `ai/prompts/` |
| Types | `packages/types` |
| Secrets | Local `.env` from `.env.example` — never commit |

## OpenRouter key
- Needed only on the machine (or deploy) running **services/api**.
- Frontend never gets the key.
- Best: one shared API; others set `NEXT_PUBLIC_API_URL` to it.
- Hackathon key expires in ~7 days; share out-of-band, not in the repo.

## Team of 6 — ownership
| # | Role | Owns | Branch idea |
|---|------|------|-------------|
| 1 | Integrator / shell | Repo glue, routing, Profile/session, merges | `feat/shell` |
| 2 | Quiz UI | Onboarding + math quiz screens | `feat/quiz-ui` |
| 3 | Curriculum + assess | YAML skills, diagnose path, gap/level | `feat/curriculum` |
| 4 | Agent + LLM | Agent graph, prompts, OpenRouter wiring | `feat/agent` |
| 5 | Worksheet UI | Worksheet render + answer entry | `feat/worksheet-ui` |
| 6 | Evaluate + demo | Grade loop, level update, demo script/QA | `feat/evaluate-demo` |

## Shared contracts
Everyone imports the same shapes from `packages/types` (and mirrors in Python schemas):
- `StudentSession` — studentId, gradeLevel, gapSkill, strategy
- `QuizResult` — scores, gapSkill, gradeLevel
- `Worksheet` / `WorksheetItem`
- `AttemptResult` — score, nextGradeLevel

UI talks to API only. API calls agent + OpenRouter. No prompts in the frontend.

## Git workflow
- `main` must stay demoable
- Work on `feat/...` branches; open PRs; Person 1 merges
- Small PRs often; no force-push to main
- Hourly sync: what merged, what’s blocked, what to cut

## Integration order
1. Shell + mocks
2. Quiz UI writes session
3. Curriculum/diagnose sets level + gap
4. Worksheet UI on mock payload
5. Agent/OpenRouter behind API
6. Evaluate + adapt level + demo rehearsal

## Demo win (2 minutes)
Kid A quizzes → gets a level/gap → worksheet → answers → level adjusts.
Optional: second kid shows a different gap/strategy.

## Cut line (T−2h)
Protect: quiz → level/gap → worksheet → grade.
Cut first: extra skills, fancy UI, speech-to-text, teacher dashboard.

## Fill in names
| # | GitHub | Name |
|---|--------|------|
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | RickyResQ (example) | |

## Links
- Repo: https://github.com/SabioTechTeam/Teacher-Hub
- Architecture notes may live under `docs/` as we add them
