# Teacher-Hub — Project Brief (Hackathon)

**Repo:** https://github.com/SabioTechTeam/Teacher-Hub  
**Subject:** Grades 4–6 Math  
**LLM:** OpenRouter (`OPENROUTER_API_KEY` on the API only, with automatic mock fallback)  
**Main App URL:** `http://localhost:3000` (One single entrance for all flows)  

## One-liner
AI tutor that quizzes a student, estimates level, generates a worksheet, grades it, and adapts level.

## Core Loop Status
1. **Onboarding & Math Quiz** ✅ *(Completed - `apps/web/app/student/page.tsx`)*
2. **Level & Gap Diagnosis** ✅ *(Completed - 5-Question Stepper with Auto Gap Detection)*
3. **Generate Worksheet (LLM + Verified Items)** ✅ *(Completed - PR #7 & PR #9)*
4. **Student Answers (Worksheet UI)** ✅ *(Completed - PR #9 & PR #12)*
5. **Grade & Adapt Level / Skill** ✅ *(Completed - PR #9)*
6. **End-to-End Demo Rehearsal** ⏳ *(Next Up - `docs/product/demo-script.md`)*

---

## 🚦 Live Progress & Team Ownership

| # | Role | GitHub Branch | Current Status | What Was Completed / Next Up |
|---|------|---------------|----------------|------------------------------|
| **1** | **Integrator / Shell** | `feat/shell` | ✅ **Merged (PR #12)** | Master login shell (`/`), Student & Teacher dashboards, seed fixture loader (`seed.py`) |
| **2** | **Quiz UI** | `feat/quiz-ui` | ✅ **Merged (PR #13)** | 5-question math diagnostic quiz with automated gap detection (`apps/web/app/student/page.tsx`) |
| **3** | **Curriculum + Assess** | `feat/curriculum` | 🟡 In Progress | Grade 4–6 YAML skills & prerequisite graph live (`math.yaml`); Next: Richer question banks |
| **4** | **Agent + LLM** | `feat/agent` | ✅ **Merged (PR #7)** | OpenRouter LLM generation (`services/agent/llm.py`), mock fallback, system prompts |
| **5** | **Worksheet UI** | `feat/worksheet-ui` | ✅ **Merged (PR #9)** | Interactive `WorksheetFlow.tsx`, deterministic fraction math grader (`mathcheck.py`), prerequisite graph traversal |
| **6** | **Evaluate + Demo** | `feat/evaluate-demo` | 🟡 In Progress | Offline runner `loop_demo.py` live; Next: 2-minute pitch rehearsal via `docs/product/demo-script.md` |

---

## 🌐 Single-URL Navigation Flow (Master Shell)

All users and judges interact through **one single link**: `http://localhost:3000`.

```
                              ┌──────────────────────────────────┐
                              │     MASTER ENTRY (ONE LINK)      │
                              │     http://localhost:3000        │
                              │     (Login / Role Switcher)      │
                              └────────────────┬─────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      │                                                 │
                      ▼                                                 ▼
          [ Student Dashboard ]                               [ Teacher Dashboard ]
          • Hi, Aiden 👋                                      • Class Overview & Heatmaps
          • Overall Mastery (60%)                             • At-Risk Student Alerts
          • Recommended Skill: Equivalent Fractions           • "Live Tutor Demo ⚡" button
          • "Start Worksheet →" OR "Math Quiz 📝"             • "Sign out" (returns to Login)
                      │                        ▲
                      │                        │
         ┌────────────┴───────────┐            │
         ▼                        ▼            │ (Click "Done / Back to Dashboard")
   [ 10-Min Quiz ]          [ Adaptive Tutor ]─┘
   • 5-question test        • Live / Mock worksheet
   • Diagnoses gap skill    • Grades math answers
   • Auto-starts worksheet  • Adapts level up or down
```

---

## 📋 System Connectors

| Connector # | Route / Component Link | Status | Flow Description |
|:---|:---|:---|:---|
| **C-01** | `Root (/)` $\rightarrow$ `LoginClient` | ✅ **Live** | Navigating to `http://localhost:3000` loads the Master Login Shell. |
| **C-02** | `LoginClient` $\rightarrow$ `Dashboards` | ✅ **Live** | Select Student $\rightarrow$ `/student/dashboard`; Select Teacher $\rightarrow$ `/teacher/dashboard`. |
| **C-03** | `Student Dashboard` $\rightarrow$ `Adaptive Tutor` | ✅ **Live** | "Start worksheet →" preloads recommended gap skill into `localStorage` session and routes to `/tutor`. |
| **C-04** | `Student Dashboard` $\rightarrow$ `Diagnostic Quiz` | ✅ **Live** | "Take Math Quiz 📝" routes to 5-question diagnostic test at `/student`. |
| **C-05** | `Diagnostic Quiz` $\rightarrow$ `Adaptive Tutor` | ✅ **Live** | Answering incorrectly diagnoses prerequisite gap (e.g. *Equivalent Fractions*) and routes to `/tutor`. |
| **C-06** | `Adaptive Tutor` $\rightarrow$ `Student Dashboard` | ✅ **Live** | "← Back to Student Dashboard" and "Done / Back to Dashboard" buttons restore dashboard view. |
| **C-07** | `Teacher Dashboard` $\rightarrow$ `Live Tutor Demo` | ✅ **Live** | "Live Tutor Demo ⚡" button in nav allows teachers to preview student practice. |
| **C-08** | `API (port 8000)` $\rightarrow$ `Next.js (port 3000)` | ✅ **Live** | Frontend fetches `/worksheets/generate` & `/worksheets/grade` with automatic mock fallback. |

---

## ⚡ How to Run and Test Locally

### 1. Run the Full Local Stack
```bash
# Terminal 1: FastAPI Backend
source .venv/bin/activate
uvicorn services.api.app.main:app --reload --port 8000

# Terminal 2: Next.js Frontend
cd apps/web
npm install
npm run dev
# Open in browser: http://localhost:3000
```

### 2. Run the Offline Math Adaptive Engine Test
```bash
python3 scripts/dev/loop_demo.py
```

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
