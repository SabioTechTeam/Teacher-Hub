# 🎯 UnStuck — Open-Source AI Adaptive Math Tutoring & Teacher Copilot OS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat&logo=python)](https://python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Curriculum](https://img.shields.io/badge/Curriculum-Common%20Core%20(CCSS%20Gr%201--6)-6366F1)](https://www.thecorestandards.org/Math/)

> **UnStuck is an open-source, AI-powered adaptive learning operating system for K-6 mathematics.**  
> It unites students, teachers, and parents in a single closed-loop ecosystem that diagnoses exact prerequisite knowledge gaps, writes personalized practice from a live student model, and deterministically verifies mastery without hallucinations.

---

## 🌍 The Problem We Are Solving

Elementary and middle school mathematics is **strictly cumulative**. Every concept is a building block: you cannot compare unlike fractions in Grade 5 without understanding equivalent fractions from Grade 4, which in turn requires mastering multiplication and equal grouping from Grade 2 and 3.

Yet traditional classrooms and legacy ed-tech suffer from three systemic failures:

1. **The Invisible Gap Trap**: When a 5th grader fails fraction addition, static software just gives them *more* 5th-grade fraction problems. The child gets frustrated, shuts down, and decides *"I'm just bad at math."* In reality, their true gap is a 3rd-grade prerequisite that went unnoticed.
2. **Teacher Overload & Assessment Latency**: Teachers manage 25–35 diverse learners with wide-ranging IEPs and skill levels. By the time quarterly benchmark test results arrive, weeks of foundational learning opportunities have already been lost.
3. **The Parent Disconnect**: Parents see homework struggles and report card drops at home, but have no way to bridge IEP accommodations or real-world child interests (like *Minecraft, Space, or Sports*) into classroom math instruction.

---

## 💡 The UnStuck Solution

**UnStuck transforms math education from static question drills into an intelligent, adaptive dialogue.**

```
                      ┌────────────────────────────────────────┐
                      │    1. Diagnostic Intake (Age/Grade)    │
                      │    Computer Adaptive Testing (CAT)     │
                      └───────────────────┬────────────────────┘
                                          │
                                          ▼
                      ┌────────────────────────────────────────┐
                      │   2. Prerequisite Graph Localization   │
                      │   Pinpoints root gap across Gr 1–6     │
                      └───────────────────┬────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
     ┌────────────────────────────┐                ┌────────────────────────────┐
     │ 3A. Teacher & Parent Input │                │  3B. LLM Adaptive Writer   │
     │ IEP rules, homework photos,│                │ Grounded in CCSS rubrics   │
     │ hobbies (Minecraft/Space)  │───────────────▶│ + Visual scaffolding       │
     └────────────────────────────┘                └─────────────┬──────────────┘
                                                                 │
                                                                 ▼
                                                   ┌────────────────────────────┐
                                                   │  4. Deterministic Grader   │
                                                   │  Symbolic math validation  │
                                                   └─────────────┬──────────────┘
                                                                 │
                                          ┌──────────────────────┴──────────────────────┐
                                          ▼                                             ▼
                               [ Mastered ≥ 80% ]                             [ Struggling < 50% ]
                               Walks UP the Graph                             Walks DOWN to Prereq
```

### 🔑 Core Capabilities
- **Computer Adaptive Testing (CAT) Placement (Grades 1–6)**: Dynamically levels up on correct answers and evaluates down on consecutive misses to pinpoint working grade level in under 6 questions.
- **CCSS Prerequisite Knowledge Graph**: Directed graph of Common Core standards across Grades 1 through 6 that enforces foundational mastery before advancing.
- **Tri-Stakeholder Unified Interface**: A single portal where **Students** learn with gamified feedback, **Teachers** track classroom heatmaps and submit intervention notes, and **Parents** upload IEPs and homework photos.
- **Zero-Hallucination Deterministic Math Checking**: AI writes the context and explanations, but answers are verified using deterministic mathematical engines (`mathcheck.py`).

---

## 🏗️ System Architecture & Workflows

UnStuck is architected as a lightweight, production-grade microservices stack centered around a single unified web experience (`http://localhost:3000`):

```
                                  ┌─────────────────────────────┐
                                  │      UNIFIED WEB SHELL      │
                                  │    Next.js 14 / TypeScript  │
                                  │    (http://localhost:3000)  │
                                  └──────────────┬──────────────┘
                                                 │ REST / JSON
                                                 ▼
                                  ┌─────────────────────────────┐
                                  │       FASTAPI BACKEND       │
                                  │         Python 3.11         │
                                  │    (http://localhost:8000)  │
                                  └──────────────┬──────────────┘
                                                 │
                  ┌──────────────────────────────┼──────────────────────────────┐
                  ▼                              ▼                              ▼
     ┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
     │      Agent Engine       │   │     Student Model       │   │    Curriculum Assets    │
     │ • OpenRouter LLM        │   │ • Prerequisite Traversal│   │ • CCSS Rubrics (Gr 1–6) │
     │ • Notes Parser          │   │ • EMA Mastery Updating  │   │ • YAML Skill Manifests  │
     │ • Math Validation       │   │ • CAT Adaptive Stepper  │   │ • JSON Mock Fixtures    │
     └─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

## 👥 Portals & Key Workflows

### 🎓 1. Student Adaptive Learning Experience (`/student`, `/tutor`)
- **Interactive Intake**: Students select their age and enrolled grade before starting.
- **Visual, Emoji-Supported Early Math**: Grades 1 and 2 feature concrete visual models (🍎 apples, 🍪 cookies, ⭐ stars, 🐸 frogs) so young elementary learners feel supported.
- **Gamification & Growth Mindset**: Real-time streak multipliers, points, and celebratory confetti encourage persistence without shaming incorrect answers.
- **Transparent Customization**: Practice worksheets display transparent adaptation notes (*"✏️ Adjusted from your teacher and family"*).

### 📚 2. Teacher Copilot Dashboard (`/teacher/dashboard`)
- **Live Classroom Heatmap**: Real-time distribution of student mastery across CCSS domains.
- **At-Risk Alerts**: Automated notifications for students falling below 40% on foundational prerequisites.
- **Student Profile Drilldown**: Interactive drawer with complete skill breakdown bars, recent attempt logs, and linked IEP accommodations.
- **Pedagogical Strategy Override**: Teachers can adjust instructional methods (*Visual Fraction Strips, Worked Examples Scaffold, Story Context, Step-by-Step Rules*) with 1-click sync to the student model.

### 👨‍👩‍👧 3. Parent Learning Hub (`/parent/dashboard`)
- **IEP / 504 Accommodation Parsing**: Extract and apply classroom accommodation rules from uploaded documents.
- **Homework Error Photo Diagnosis**: Analyze photos of paper worksheets to isolate misconception patterns.
- **Child Interest Personalization**: Tag child interests (*Minecraft, Space, Basketball, Animals*) to generate word problems that ignite enthusiasm.
- **Home Observations Sync**: Parents can log behavioral or learning notes (e.g. *"Frustrated after 10 mins; needs visual models"*), automatically adjusting worksheet pacing and hint generosity.

---

## 🛠️ Technology Stack & Design Decisions

| Component | Choice | Rationale |
|---|---|---|
| **Frontend UI** | **Next.js 14 (App Router)** | Instant page transitions, server-side static rendering, and unified client routing. |
| **Styling** | **Modular Vanilla CSS** | Clean design system tokens, zero bloated runtime CSS dependencies, high customizability. |
| **Backend API** | **FastAPI & Pydantic** | Type-safe REST endpoints, sub-millisecond response times, and automated interactive OpenAPI documentation. |
| **LLM & AI** | **OpenRouter (Claude 3.5 / GPT-4o)** | State-of-the-art pedagogical prompting with automated mock fallback for offline resilience. |
| **Curriculum Standard** | **Common Core (CCSSM Grades 1–6)** | 82+ grounded standards and 4-tier rubric criteria (*Below Standard, Approaching, Meets, Exceeds*). |
| **Answer Validation** | **Deterministic Python Solver** | Strict separation of AI pedagogy and mathematical truth — prevents grading hallucinations. |

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/SabioTechTeam/Teacher-Hub.git
cd Teacher-Hub
```

### 2. Launch the FastAPI Backend
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r services/api/requirements.txt

# Start backend server on port 8000
uvicorn services.api.app.main:app --reload --port 8000
```
*API interactive documentation will be live at [http://localhost:8000/docs](http://localhost:8000/docs).*

### 3. Launch the Web Application
```bash
# In a new terminal window
cd apps/web
npm install
npm run dev
```
*Open [http://localhost:3000](http://localhost:3000) in your browser to access the master login shell.*

### 4. Run the Offline Verification Suite
UnStuck includes a complete offline test suite that validates the adaptive math loop and diagnostic evaluation without requiring external network connections or API keys:
```bash
# Test the Grade 1–6 CAT diagnostic evaluation
python3 scripts/dev/diagnostic_demo.py

# Test the end-to-end adaptive worksheet learning loop
python3 scripts/dev/loop_demo.py
```

---

## 🤝 Open Source Vision & Contributing

We believe every child deserves access to a patient, world-class, adaptive 1-on-1 tutor, and every teacher deserves copilot tools that save hours of grading and assessment time.

We are preparing to open-source **UnStuck** and invite educators, developers, curriculum designers, and researchers to join us in shaping the future of education!

### 🗺️ Open-Source Roadmap:
- [ ] **Full Multi-Subject Curriculum Diagnostic Suite (K–8)**:
  - 📖 **Reading & ELA (CCSS.ELA-LITERACY)**: Lexile-leveled passage comprehension, phonics & phonemic awareness, vocabulary acquisition, and reading fluency tracking.
  - ✍️ **Writing & Composition**: Grammar mechanics, sentence structure, opinion/argumentative writing, and paragraph rubrics with formative constructive feedback.
  - 📐 **Mathematics Extension**: Expanding our core Grades 1–6 engine into Grades 7–8 Pre-Algebra, Algebra 1, and Geometry prerequisite graphs.
  - 🔬 **Science & Inquiry (NGSS)**: Next Generation Science Standards diagnostic assessments covering Physical, Life, Earth & Space sciences with evidence-based reasoning tasks.
- [ ] **Multilingual ESL/ELL Support**: Native translations and bilingual dual-language scaffolding in Spanish, French, Mandarin, and Arabic.
- [ ] **Voice-Enabled Audio Tutoring**: Natural speech-to-speech multimodal dialogue for early elementary (K-2) and accessibility/auditory learners.
- [ ] **Direct LMS & School Syncing**: One-click roster and gradebook sync for Google Classroom, Canvas, Schoology, and Clever.
- [ ] **Offline Edge Deployment**: On-device quantized models (e.g. Llama 3 / Gemma) running 100% locally for low-connectivity or zero-internet rural schools.

### How to Contribute:
1. **Fork** the repository and create your feature branch: `git checkout -b feat/amazing-feature`.
2. **Validate locally**: Ensure `npm run build` and `python3 scripts/dev/diagnostic_demo.py` pass cleanly.
3. **Submit a Pull Request**: Open a PR with a clear summary of pedagogical rationale and test results.

---

## 📜 License & Compliance

- **License**: MIT License — free for educational and non-commercial use.
- **Privacy & Safety**: Built with **FERPA & COPPA** privacy principles. No student personally identifiable information (PII) is exposed to external model prompts.

---

<p align="center">
  <b>Built with ❤️ by the SabioTech Team for educators, parents, and students everywhere.</b>
</p>
