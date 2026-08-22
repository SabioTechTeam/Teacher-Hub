# Teacher-Hub — Project Brief (Hackathon)

**Repo:** https://github.com/SabioTechTeam/Teacher-Hub  
**Subject:** Grades 4–6 Math  
**LLM:** OpenRouter (`OPENROUTER_API_KEY` on the API only, with automatic mock fallback)  

## One-liner
AI tutor that quizzes a student, estimates level, generates a worksheet, grades it, and adapts level.

## Core Loop Status
1. **Onboarding & Math Quiz** 🟡 *(In Progress - `feat/quiz-ui`)*
2. **Level & Gap Diagnosis** 🟡 *(In Progress - `feat/curriculum` + `services/agent/graphs/.../diagnose.py`)*
3. **Generate Worksheet (LLM + Verified Items)** ✅ *(Completed - PR #7 & PR #9)*
4. **Student Answers (Worksheet UI)** ✅ *(Completed - PR #9)*
5. **Grade & Adapt Level / Skill** ✅ *(Completed - PR #9)*
6. **End-to-End Demo Rehearsal** ⏳ *(Next Up - `docs/product/demo-script.md`)*

---

## 🚦 Live Progress & Team Ownership

| # | Role | GitHub Branch | Current Status | What Was Completed / Next Up |
|---|------|---------------|----------------|------------------------------|
| **1** | **Integrator / Shell** | `feat/shell` | 🟡 In Progress | Protected `main` branch; merged PRs #7-#10; Next: Connect Quiz finish $\rightarrow$ Worksheet route |
| **2** | **Quiz UI** | `feat/quiz-ui` | 🟡 In Progress | Onboarding screen & 10-minute diagnostic math questions (`apps/web/app/student/page.tsx`) |
| **3** | **Curriculum + Assess** | `feat/curriculum` | 🟡 In Progress | Grade 4–6 YAML skills & prerequisite graph live; Next: Diagnostic question items & scoring |
| **4** | **Agent + LLM** | `feat/agent` | ✅ **Merged (PR #7)** | OpenRouter LLM generation (`services/agent/llm.py`), mock fallback, system prompts |
| **5** | **Worksheet UI** | `feat/worksheet-ui` | ✅ **Merged (PR #9)** | Interactive `WorksheetFlow.tsx`, deterministic fraction math grader (`mathcheck.py`), prerequisite graph traversal |
| **6** | **Evaluate + Demo** | `feat/evaluate-demo` | 🟡 In Progress | Offline runner `loop_demo.py` live; Next: Rehearse 2-minute pitch via `docs/product/demo-script.md` |

---

## 🛠️ Stack & Architecture
| Layer | Choice | Location |
|-------|--------|----------|
| **Web** | Next.js 14 App Router, Tailwind, TypeScript | `apps/web/` |
| **API** | FastAPI (`/worksheets/generate`, `/worksheets/grade`) | `services/api/` |
| **Agent** | LangGraph Node Loop (Diagnose $\rightarrow$ Strategy $\rightarrow$ Worksheet $\rightarrow$ Grade $\rightarrow$ Adapt) | `services/agent/` |
| **Curriculum** | Prerequisite DAG (`math.yaml`) + Grade 4-6 skills | `curriculum/skills/math/` |
| **Math Engine** | Deterministic exact fraction parser & evaluator | `services/agent/mathcheck.py` |
| **Prompts** | Versioned Markdown templates | `ai/prompts/` |
| **Contracts** | Shared TypeScript interfaces | `packages/types/` |
| **Judge Assets** | Pitch cheat card, Use-cases, Loop docs | `docs/product/` |

---

## 🔒 Shared Data Contracts
Everyone imports the same shapes from `packages/types` (and mirrors in Python schemas):
- `StudentSession` — `studentId`, `gradeLevel`, `gapSkill`, `strategy`
- `QuizResult` — `scores`, `gapSkill`, `gradeLevel`
- `Worksheet` / `WorksheetItem` — `worksheetId`, `items`, `target_skill`, `source`
- `AttemptResult` — `score`, `next_action`, `next_skill`, `mastery`

> **Note:** Answer keys are stripped by the API before reaching the browser (`_strip_keys`) to keep evaluations tamper-proof.

---

## ⚡ How to Run and Test Locally

### 1. Test the Adaptive Math Engine Offline (0 dependencies, no server needed)
```bash
python3 scripts/dev/loop_demo.py
```

### 2. Run the Next.js Frontend
```bash
cd apps/web
npm install
npm run dev
# Visit http://localhost:3000/worksheet or http://localhost:3000/tutor
```

### 3. Run the FastAPI Backend
```bash
uvicorn services.api.app.main:app --reload --port 8000
```

---

## 🌿 Git Workflow Rules
- **No direct pushes to `main`** — Protected branch requiring PRs.
- `main` must remain demoable at all times.
- Work in your assigned `feat/<role>` branch.
- Open PRs early; Person 1 (Integrator) merges after approvals.
- Hourly sync: what merged, what’s blocked, what to cut.

---

## 🎯 Demo Win (2-Minute Script)
1. **Kid A (Struggling)**: Quizzes $\rightarrow$ Diagnosed with *Grade 4 Equivalent Fractions gap* $\rightarrow$ Gets visual fraction worksheet $\rightarrow$ Grades $\rightarrow$ Difficulty remediates to prerequisite.
2. **Kid B (Advanced)**: Starts on Grade 5 Addition $\rightarrow$ Scores 100% $\rightarrow$ Engine accelerates to Grade 6 Ratios.
3. **Judge Pitch**: *"Khan chooses from a static library. Teacher-Hub diagnoses the specific misconception and writes the next problem from a live student model."* (See [`docs/product/JUDGE_CHEAT_CARD.md`](docs/product/JUDGE_CHEAT_CARD.md)).

---

## 👥 Team Roster
| # | Role | GitHub Username | Name |
|---|------|-----------------|------|
| 1 | Integrator / Shell | SabioTechTeam | |
| 2 | Quiz UI | | |
| 3 | Curriculum + Assess | | |
| 4 | Agent + LLM | RickyResQ | |
| 5 | Worksheet UI | alphawolf13 | |
| 6 | Evaluate + Demo | RickyResQ | |
