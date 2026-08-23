"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, setSession } from "@/lib/session";
import Confetti from "./Confetti";
import { apiGet, apiPost } from "@/lib/api";

/** Questions come from the API with the answer key withheld. */
interface Question {
  id: string;
  skill_id: string;
  skill_name: string;
  grade: number | null;
  prompt: string;
  choices: string[];
}

interface SkillRow {
  skill_id: string;
  skill_name: string;
  grade: number | null;
  standard: string | null;
  standard_description: string | null;
  has_prerequisite: boolean;
  correct: number;
  asked: number;
  mastery: number;
  error_type: string | null;
  feedback: string | null;
}

interface Graded {
  correct: boolean;
  total_points: number;
  current_streak: number;
}

interface StartedQuiz {
  assessment_id: string;
  questions: Question[];
}

interface Results {
  score: number;
  answered: number;
  total_questions: number;
  grade_level: number | null;
  gap_skill: string | null;
  mastered: boolean;
  complete: boolean;
  proficiency_level: 1 | 2 | 3 | 4;
  proficiency_label: string;
  summary: string;
  evaluated_by: "llm" | "deterministic";
  skills: SkillRow[];
}

/**
 * Presentation styling keyed by CCSS proficiency level.
 */
const LEVEL_STYLE: Record<number, { color: string; bg: string; action: string }> = {
  4: { color: "#0a7c2f", bg: "#F0FDF4", action: "Accelerate to higher-grade extension tasks & algebraic reasoning" },
  3: { color: "#059669", bg: "#ECFDF5", action: "Proceed with grade-level practice and standard unit pace" },
  2: { color: "#D97706", bg: "#FFFBEB", action: "Targeted scaffolding with visual models & step-by-step guidance" },
  1: { color: "#DC2626", bg: "#FEF2F2", action: "Foundational prerequisite intervention" },
};

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6];
const TARGET_ADAPTIVE_QUESTIONS = 6;

export default function StudentDiagnosticPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("demo");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  // Onboarding intake state (Age & School Grade)
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [selectedAge, setSelectedAge] = useState<number>(9);
  const [selectedSchoolGrade, setSelectedSchoolGrade] = useState<number>(4);

  // Question pool and adaptive CAT state
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [currentGrade, setCurrentGrade] = useState<number>(4);
  const [consecutiveMisses, setConsecutiveMisses] = useState<number>(0);
  const [answeredCount, setAnsweredCount] = useState<number>(0);

  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gamification state
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [levelTransitionMessage, setLevelTransitionMessage] = useState<string | null>(null);

  // Helper to pick the next unused question for a given grade level
  const pickNextQuestion = useCallback(
    (targetGrade: number, pool: Question[], usedIds: string[]): Question | null => {
      // 1. Exact match
      const exactMatches = pool.filter((q) => q.grade === targetGrade && !usedIds.includes(q.id));
      if (exactMatches.length > 0) {
        return exactMatches[Math.floor(Math.random() * exactMatches.length)];
      }

      // 2. Nearest available grade
      const remaining = pool.filter((q) => !usedIds.includes(q.id));
      if (remaining.length === 0) return null;

      remaining.sort((a, b) => {
        const diffA = Math.abs((a.grade ?? targetGrade) - targetGrade);
        const diffB = Math.abs((b.grade ?? targetGrade) - targetGrade);
        return diffA - diffB;
      });
      return remaining[0];
    },
    []
  );

  const loadPool = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const sid = getSession().studentId || "demo";
      setStudentId(sid);
      const data = await apiPost<StartedQuiz>(
        `/assessments/start?student_id=${encodeURIComponent(sid)}`, {}
      );
      setAssessmentId(data.assessment_id);
      const pool = data.questions ?? [];
      setQuestionPool(pool);
    } catch {
      setError("Could not reach the API. Start it with: uvicorn services.api.app.main:app --port 8000");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    loadPool();
  }, [loadPool]);

  // Launch the quiz starting from the student's selected grade level
  const handleStartPlacementQuiz = () => {
    const firstQ = pickNextQuestion(selectedSchoolGrade, questionPool, []);
    if (firstQ) {
      setActiveQuestion(firstQ);
      setUsedQuestionIds([firstQ.id]);
      setCurrentGrade(firstQ.grade ?? selectedSchoolGrade);
    }
    setConsecutiveMisses(0);
    setAnsweredCount(0);
    setSelectedOpt(null);
    setResults(null);
    setLevelTransitionMessage(null);
    setHasOnboarded(true);
  };

  const finish = async (currentAsmtId: string) => {
    setBusy(true);
    try {
      const res = await apiGet<Results>(
        `/assessments/${currentAsmtId}/results?student_id=${encodeURIComponent(studentId)}`
      );
      setResults(res);
      setSession({
        studentId,
        gradeLevel: (res.grade_level ?? selectedSchoolGrade) as 1 | 2 | 3 | 4 | 5 | 6,
        gapSkill: res.gap_skill ?? undefined,
        strategy: "worked_example",
      });
      setLevelTransitionMessage(null);
      setConfettiTrigger((t) => t + 1);
    } catch {
      setError("Could not reach the API while scoring the quiz.");
    } finally {
      setBusy(false);
    }
  };

  const handleNext = async () => {
    if (selectedOpt === null || !assessmentId || !activeQuestion || busy) return;
    setBusy(true);
    setError(null);

    try {
      // 1. Grade question
      const graded = await apiPost<Graded>(
        `/assessments/${assessmentId}/answer?student_id=${encodeURIComponent(studentId)}`,
        { question_id: activeQuestion.id, answer: selectedOpt }
      );
      setPoints(graded.total_points ?? points);
      setStreak(graded.current_streak ?? 0);

      const nextAnsweredCount = answeredCount + 1;
      setAnsweredCount(nextAnsweredCount);

      const isQuizComplete = nextAnsweredCount >= TARGET_ADAPTIVE_QUESTIONS;

      let nextGrade = currentGrade;
      let nextMissCount = consecutiveMisses;

      if (graded.correct) {
        // --- CORRECT ANSWER ---
        // Step UP a grade level!
        setConfettiTrigger((t) => t + 1);
        nextMissCount = 0;
        setConsecutiveMisses(0);

        if (currentGrade < 6) {
          nextGrade = currentGrade + 1;
          setLevelTransitionMessage(`🌟 Great job! Leveling UP to Grade ${nextGrade} challenge`);
        } else {
          nextGrade = 6;
          setLevelTransitionMessage(`🔥 Perfect! Mastering Grade 6 concepts`);
        }
      } else {
        // --- WRONG ANSWER ---
        // No "try again" blocking screen. Take it as wrong immediately.
        nextMissCount = consecutiveMisses + 1;
        setConsecutiveMisses(nextMissCount);

        if (nextMissCount === 1) {
          // First wrong: Serve another question of the SAME grade level
          nextGrade = currentGrade;
          setLevelTransitionMessage(`Giving another Grade ${currentGrade} question to check mastery`);
        } else {
          // Second consecutive wrong at this grade: Drop DOWN a grade level
          nextGrade = Math.max(1, currentGrade - 1);
          setConsecutiveMisses(0);
          setLevelTransitionMessage(`Adjusting level down to Grade ${nextGrade} to benchmark foundation`);
        }
      }

      if (isQuizComplete) {
        await finish(assessmentId);
        return;
      }

      // 2. Pick next adaptive question
      const nextQ = pickNextQuestion(nextGrade, questionPool, [...usedQuestionIds, activeQuestion.id]);
      if (!nextQ) {
        await finish(assessmentId);
        return;
      }

      setCurrentGrade(nextGrade);
      setActiveQuestion(nextQ);
      setUsedQuestionIds((prev) => [...prev, nextQ.id]);
      setSelectedOpt(null);
    } catch {
      setError("Could not reach the API. Your answer was not recorded.");
    } finally {
      setBusy(false);
    }
  };

  const card = {
    background: "#fff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
  };

  const gapRow = results?.skills.find((s) => s.skill_id === results.gap_skill);
  const style = results ? LEVEL_STYLE[results.proficiency_level] ?? LEVEL_STYLE[1] : LEVEL_STYLE[1];
  const isLast = answeredCount + 1 >= TARGET_ADAPTIVE_QUESTIONS;

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <Link href="/student/dashboard" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, background: "#EEF2FF", color: "#4338CA", padding: "4px 12px", borderRadius: 12, fontWeight: 700 }}>
            📐 UnStuck Grade 1–6 Diagnostic Placement
          </span>
        </div>
      </header>

      <Confetti trigger={confettiTrigger} />

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 14 }}>
          <strong>Backend unavailable.</strong>
          <div style={{ marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{error}</div>
          <button onClick={loadPool} style={{ marginTop: 12, padding: "8px 16px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      {/* ── STEP 0: ONBOARDING INTAKE (AGE & CURRENT SCHOOL GRADE) ── */}
      {!hasOnboarded && !error && (
        <section style={card}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>👋</div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1E293B", margin: "0 0 6px" }}>
              Welcome to UnStuck Math!
            </h1>
            <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>
              Let's customize your diagnostic placement quiz so it starts at the right level.
            </p>
          </div>

          {/* Age Selection */}
          <div style={{ marginBottom: 26 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
              🎂 1. How old are you?
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[6, 7, 8, 9, 10, 11, 12, 13].map((age) => (
                <button
                  key={age}
                  type="button"
                  onClick={() => setSelectedAge(age)}
                  style={{
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: selectedAge === age ? "2px solid #4F46E5" : "1px solid #CBD5E1",
                    background: selectedAge === age ? "#EEF2FF" : "#ffffff",
                    color: selectedAge === age ? "#4338CA" : "#475569",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {age === 13 ? "13+" : `${age} yrs`}
                </button>
              ))}
            </div>
          </div>

          {/* School Grade Level Selection */}
          <div style={{ marginBottom: 32 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 700, color: "#334155", marginBottom: 10 }}>
              🎒 2. What grade are you currently in school?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { gr: 1, label: "Grade 1", sub: "Addition & place value within 20" },
                { gr: 2, label: "Grade 2", sub: "2-digit math & regrouping" },
                { gr: 3, label: "Grade 3", sub: "Multiplication & unit fractions" },
                { gr: 4, label: "Grade 4", sub: "Fractions & multi-digit math" },
                { gr: 5, label: "Grade 5", sub: "Unlike fractions & decimals" },
                { gr: 6, label: "Grade 6", sub: "Ratios, rates & equations" },
              ].map((item) => (
                <button
                  key={item.gr}
                  type="button"
                  onClick={() => setSelectedSchoolGrade(item.gr)}
                  style={{
                    padding: "14px 12px",
                    textAlign: "center",
                    borderRadius: 12,
                    border: selectedSchoolGrade === item.gr ? "2px solid #4F46E5" : "1px solid #CBD5E1",
                    background: selectedSchoolGrade === item.gr ? "#EEF2FF" : "#ffffff",
                    color: selectedSchoolGrade === item.gr ? "#4338CA" : "#334155",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: selectedSchoolGrade === item.gr ? "#6366F1" : "#64748B", marginTop: 4 }}>
                    {item.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start CTA */}
          <button
            type="button"
            onClick={handleStartPlacementQuiz}
            disabled={questionPool.length === 0}
            style={{
              width: "100%",
              padding: "16px 24px",
              background: "#4F46E5",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 16,
              cursor: questionPool.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.3)",
            }}
          >
            Start My Math Placement Quiz at Grade {selectedSchoolGrade} 🎯
          </button>
        </section>
      )}

      {/* ── STEP 1: ACTIVE ADAPTIVE QUIZ ── */}
      {hasOnboarded && !results && (
        <>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 16px", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
              Points <strong style={{ color: "#4F46E5", fontSize: 16 }}>{points}</strong>
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, background: "#E0E7FF", color: "#3730A3", padding: "3px 8px", borderRadius: 6, fontWeight: 700 }}>
                Current Question Level: Grade {currentGrade}
              </span>
              <span style={{ fontSize: 13, color: streak >= 3 ? "#C2410C" : "#64748b", fontWeight: 600 }}>
                {streak > 0 ? `${"🔥".repeat(Math.min(streak, 3))} ${streak} streak` : ""}
              </span>
            </div>
          </div>

          {levelTransitionMessage && (
            <div
              role="status"
              style={{
                background: levelTransitionMessage.includes("UP") || levelTransitionMessage.includes("Correct") ? "#F0FDF4" : "#FFFBEB",
                border: `1px solid ${levelTransitionMessage.includes("UP") || levelTransitionMessage.includes("Correct") ? "#BBF7D0" : "#FDE68A"}`,
                color: levelTransitionMessage.includes("UP") || levelTransitionMessage.includes("Correct") ? "#166534" : "#92400E",
                borderRadius: 12, padding: "8px 16px", marginBottom: 16,
                fontWeight: 600, fontSize: 13, textAlign: "center",
              }}
            >
              {levelTransitionMessage}
            </div>
          )}

          {activeQuestion && (
            <section style={card}>
              {/* Header info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                <span style={{ fontWeight: 600 }}>Adaptive Question {answeredCount + 1} of {TARGET_ADAPTIVE_QUESTIONS}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ background: "#4F46E5", color: "#ffffff", padding: "2px 8px", borderRadius: 6, fontWeight: 800, fontSize: 12 }}>
                    Grade {activeQuestion.grade} Benchmark
                  </span>
                  <span style={{ color: "#334155", fontWeight: 600 }}>{activeQuestion.skill_name}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ height: 6, width: "100%", background: "#f1f5f9", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((answeredCount + 1) / TARGET_ADAPTIVE_QUESTIONS) * 100}%`, background: "#4F46E5", transition: "width 0.3s ease" }} />
              </div>

              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 24, lineHeight: 1.4 }}>
                {activeQuestion.prompt}
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
                {activeQuestion.choices.map((opt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedOpt(i)}
                    style={{
                      padding: "14px 18px", textAlign: "left", borderRadius: 12, fontSize: 15,
                      fontWeight: selectedOpt === i ? 600 : 400,
                      border: selectedOpt === i ? "2px solid #4F46E5" : "1px solid #cbd5e1",
                      background: selectedOpt === i ? "#EEF2FF" : "#fff",
                      color: selectedOpt === i ? "#3730A3" : "#334155",
                      cursor: "pointer", transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{ display: "inline-block", width: 24, fontWeight: 700, color: selectedOpt === i ? "#4F46E5" : "#94a3b8" }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNext}
                disabled={busy || selectedOpt === null}
                style={{
                  width: "100%", padding: "14px 20px",
                  background: selectedOpt === null || busy ? "#cbd5e1" : "#4F46E5",
                  color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16,
                  cursor: selectedOpt === null || busy ? "not-allowed" : "pointer",
                }}
              >
                {busy
                  ? "Evaluating Answer…"
                  : isLast
                  ? "Submit & Calculate Grade Placement 🚀"
                  : "Submit & Continue →"}
              </button>
            </section>
          )}
        </>
      )}

      {/* ── STEP 2: PLACEMENT RESULTS SCREEN ── */}
      {results && (
        <section style={{ ...card, padding: "36px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎯</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>Grade Level Placement Complete</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
              {results.evaluated_by === "llm"
                ? "Evaluated across Grade 1–6 standards by the CCSS rubric evaluator."
                : "Scored against Grade 1–6 CCSS curriculum standards (deterministic placement)."}
            </p>
          </div>

          {/* Grade Level Spectrum Banner */}
          <div style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE", borderRadius: 16, padding: "20px 24px", marginBottom: 24, textAlign: "center" }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#4338CA", letterSpacing: "0.05em", marginBottom: 6 }}>
              Diagnosed Working Grade Level
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#312E81", marginBottom: 14 }}>
              {results.grade_level ? `Grade ${results.grade_level} Math` : `Grade ${selectedSchoolGrade} Math`}
            </div>

            {/* Visual spectrum 1 to 6 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, margin: "0 auto", maxWidth: 460 }}>
              {GRADE_LEVELS.map((g) => {
                const isSelected = results.grade_level === g;
                const isPast = (results.grade_level ?? selectedSchoolGrade) > g;
                return (
                  <div key={g} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 14,
                        fontWeight: 800,
                        background: isSelected ? "#4F46E5" : isPast ? "#059669" : "#E2E8F0",
                        color: isSelected || isPast ? "#ffffff" : "#64748B",
                        border: isSelected ? "3px solid #C7D2FE" : "none",
                        boxShadow: isSelected ? "0 0 0 3px rgba(79, 70, 229, 0.2)" : "none",
                        transition: "all 0.2s ease",
                      }}
                    >
                      {g}
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, marginTop: 4, color: isSelected ? "#4F46E5" : isPast ? "#059669" : "#94A3B8" }}>
                      {isSelected ? "★ Placed" : isPast ? "✓ Passed" : `Gr ${g}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Overall Score</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>
                {results.skills.reduce((n, s) => n + s.correct, 0)}/{results.answered}{" "}
                <span style={{ fontSize: 18, color: "#64748B" }}>({Math.round(results.score * 100)}%)</span>
              </div>
            </div>
            <div style={{ background: style.bg, border: `1px solid ${style.color}40`, borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: style.color, textTransform: "uppercase" }}>CCSS Rubric Level</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: style.color, marginTop: 6 }}>
                Level {results.proficiency_level}: {results.proficiency_label}
              </div>
            </div>
          </div>

          {results.summary && (
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderLeft: "4px solid #4F46E5", borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                Evaluator summary
              </div>
              <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.5, margin: 0 }}>{results.summary}</p>
            </div>
          )}

          {gapRow ? (
            <div style={{ background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 14, padding: 22, marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#C2410C", letterSpacing: "0.05em" }}>
                  Target Prerequisite Gap Skill
                </span>
                {gapRow.standard && (
                  <span style={{ fontSize: 12, background: "#FFEDD5", color: "#9A3412", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                    CCSS {gapRow.standard}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#9A3412", marginTop: 2 }}>
                {gapRow.skill_name}{gapRow.grade ? ` (Grade ${gapRow.grade})` : ""} — {gapRow.correct}/{gapRow.asked} correct
              </div>
              {gapRow.standard_description && (
                <p style={{ fontSize: 13, color: "#7C2D12", lineHeight: 1.4, margin: "6px 0 0" }}>
                  <strong>Standard:</strong> {gapRow.standard_description}
                </p>
              )}
              <p style={{ fontSize: 13, color: "#9A3412", lineHeight: 1.4, margin: "8px 0 0", borderTop: "1px dashed #FDBA74", paddingTop: 8 }}>
                <strong>Prescribed strategy:</strong> {style.action}
                {results.proficiency_level === 1 && gapRow.has_prerequisite
                  ? " on the prerequisite skill first"
                  : " on this skill"}.
              </p>
            </div>
          ) : (
            <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 14, padding: 22, marginBottom: 20 }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>Grade 1–6 Track Mastered 🎉</div>
              <p style={{ fontSize: 13, color: "#14532D", margin: "6px 0 0" }}>
                Every tested skill across Grades 1 through 6 is at or above standard. Ready for accelerated Grade 6+ math tasks.
              </p>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>
              Grade 1–6 CCSS Skill Breakdown
            </div>
            {results.skills.map((s) => (
              <div key={s.skill_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ flex: 1, fontSize: 14, color: "#334155" }}>
                  {s.skill_name} <span style={{ color: "#6366F1", fontWeight: 600 }}>(Grade {s.grade})</span>
                </span>
                <div style={{ width: 120, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.mastery * 100}%`, background: s.mastery >= 0.8 ? "#059669" : s.mastery >= 0.5 ? "#D97706" : "#DC2626" }} />
                </div>
                <span style={{ width: 44, textAlign: "right", fontSize: 13, color: "#64748b", fontWeight: 600 }}>{s.correct}/{s.asked}</span>
              </div>
            ))}
            {results.skills.some((s) => s.feedback) && (
              <div style={{ marginTop: 14 }}>
                {results.skills.filter((s) => s.feedback).map((s) => (
                  <p key={`fb-${s.skill_id}`} style={{ fontSize: 12, color: "#475569", lineHeight: 1.5, margin: "0 0 6px" }}>
                    {s.error_type && (
                      <span style={{ background: "#EEF2FF", color: "#4338CA", padding: "1px 6px", borderRadius: 5, fontWeight: 700, marginRight: 6, textTransform: "uppercase", fontSize: 10 }}>
                        {s.error_type}
                      </span>
                    )}
                    <strong>{s.skill_name}:</strong> {s.feedback}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push("/tutor")}
              style={{ padding: "14px 28px", background: "#059669", color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16, cursor: "pointer", boxShadow: "0 4px 12px rgba(5,150,105,0.3)" }}
            >
              Launch Grade {results.grade_level || selectedSchoolGrade} Practice Worksheet →
            </button>
            <Link href="/student/dashboard" style={{ padding: "14px 20px", background: "#f1f5f9", color: "#334155", borderRadius: 12, fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
              Back to Dashboard
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
