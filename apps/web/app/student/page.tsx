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
 * Presentation only, keyed by the level the API assigns. The thresholds live in
 * curriculum/rubrics — duplicating them here is how the UI and the API ended up
 * disagreeing about what "Meets Standard" means.
 */
const LEVEL_STYLE: Record<number, { color: string; bg: string; action: string }> = {
  4: { color: "#0a7c2f", bg: "#F0FDF4", action: "Accelerate to extension and ratio concepts" },
  3: { color: "#059669", bg: "#ECFDF5", action: "Proceed at standard grade unit pace" },
  2: { color: "#D97706", bg: "#FFFBEB", action: "Targeted re-teaching with visual fraction models" },
  1: { color: "#DC2626", bg: "#FEF2F2", action: "Foundational remediation" },
};

export default function StudentDiagnosticPage() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("demo");
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Gamification. The numbers come from the API (progress.py persists them);
  // only the wording is local.
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const encourage = (streakVal: number) =>
    streakVal >= 3
      ? ["🔥 Unstoppable!", "🚀 You're on fire!", "⭐ Amazing streak!"][streakVal % 3]
      : ["🎉 Great job!", "💪 Well done!", "✅ Correct!", "🌟 You got it!"][streakVal % 4];

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const sid = getSession().studentId || "demo";
      setStudentId(sid);
      const data = await apiPost<StartedQuiz>(
        `/assessments/start?student_id=${encodeURIComponent(sid)}`, {},
      );
      setAssessmentId(data.assessment_id);
      setQuestions(data.questions ?? []);
      setCurrentIdx(0);
      setSelectedOpt(null);
      setResults(null);
      setFeedback(null);
    } catch {
      // No local fallback on purpose: a fabricated grade level is the bug this
      // page was changed to remove. Better a visible error than a fake result.
      setError("Could not reach the API. Start it with: uvicorn services.api.app.main:app --port 8000");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    start();
  }, [start]);

  const q = questions[currentIdx];
  const isLast = currentIdx + 1 === questions.length;

  const finish = async () => {
    if (!assessmentId) return;
    setBusy(true);
    try {
      const res = await apiGet<Results>(
        `/assessments/${assessmentId}/results?student_id=${encodeURIComponent(studentId)}`,
      );
      setResults(res);
      // Hand the diagnosis to the worksheet flow.
      setSession({
        studentId,
        gradeLevel: (res.grade_level ?? undefined) as 4 | 5 | 6 | undefined,
        gapSkill: res.gap_skill ?? undefined,
        strategy: "worked_example",
      });
      setFeedback(null);
      setConfettiTrigger((t) => t + 1);
    } catch {
      setError("Could not reach the API while scoring the quiz.");
    } finally {
      setBusy(false);
    }
  };

  const goOn = async () => {
    if (!isLast) {
      setCurrentIdx(currentIdx + 1);
      setSelectedOpt(null);
      return;
    }
    await finish();
  };

  const handleNext = async () => {
    // A wrong answer pauses on the question; the next click continues.
    if (feedback && !feedback.correct) {
      setFeedback(null);
      await goOn();
      return;
    }
    if (selectedOpt === null || !assessmentId || !q) return;
    setBusy(true);
    setError(null);
    try {
      const graded = await apiPost<Graded>(
        `/assessments/${assessmentId}/answer?student_id=${encodeURIComponent(studentId)}`,
        { question_id: q.id, answer: selectedOpt },
      );
      setPoints(graded.total_points ?? points);
      setStreak(graded.current_streak ?? 0);

      if (!graded.correct) {
        setFeedback({ correct: false, message: "Not quite — keep going, you've got this! 💙" });
        return;
      }
      setConfettiTrigger((t) => t + 1);
      setFeedback({ correct: true, message: encourage(graded.current_streak ?? 1) });

      if (!isLast) {
        setCurrentIdx(currentIdx + 1);
        setSelectedOpt(null);
        return;
      }
      await finish();
    } catch {
      setError("Could not reach the API. Your answer was not recorded.");
    } finally {
      setBusy(false);
    }
  };

  const card = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" };
  const gapRow = results?.skills.find((s) => s.skill_id === results.gap_skill);
  const style = results ? LEVEL_STYLE[results.proficiency_level] ?? LEVEL_STYLE[1] : LEVEL_STYLE[1];

  return (
    <main style={{ maxWidth: 740, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <Link href="/student/dashboard" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <span style={{ fontSize: 13, background: "#EEF2FF", color: "#4338CA", padding: "4px 12px", borderRadius: 12, fontWeight: 600 }}>
          CCSS Math Diagnostic
        </span>
      </header>

      <Confetti trigger={confettiTrigger} />

      {!results && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 16px", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            Points <strong style={{ color: "#4F46E5", fontSize: 16 }}>{points}</strong>
          </span>
          <span style={{ fontSize: 13, color: streak >= 3 ? "#C2410C" : "#64748b", fontWeight: 600 }}>
            {streak > 0 ? `${"🔥".repeat(Math.min(streak, 3))} ${streak} in a row` : "Build a streak!"}
          </span>
        </div>
      )}

      {feedback && !results && (
        <div
          role="status"
          style={{
            background: feedback.correct ? "#F0FDF4" : "#FFF7ED",
            border: `1px solid ${feedback.correct ? "#BBF7D0" : "#FED7AA"}`,
            color: feedback.correct ? "#166534" : "#9A3412",
            borderRadius: 12, padding: "10px 16px", marginBottom: 16,
            fontWeight: 600, fontSize: 14, textAlign: "center",
          }}
        >
          {feedback.message}
        </div>
      )}

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#991B1B", borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 14 }}>
          <strong>Backend unavailable.</strong>
          <div style={{ marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 12 }}>{error}</div>
          <button onClick={start} style={{ marginTop: 12, padding: "8px 16px", background: "#DC2626", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      {!results && !q && !error && (
        <section style={card}>
          <p style={{ color: "#64748b", margin: 0 }}>Loading diagnostic…</p>
        </section>
      )}

      {!results && q && (
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>Skill: <strong>{q.skill_name}</strong>{q.grade ? ` (Gr ${q.grade})` : ""}</span>
          </div>

          <div style={{ height: 6, width: "100%", background: "#f1f5f9", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((currentIdx + 1) / questions.length) * 100}%`, background: "#4F46E5", transition: "width 0.3s ease" }} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 24, lineHeight: 1.4 }}>{q.prompt}</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {q.choices.map((opt, i) => (
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
            disabled={busy || (selectedOpt === null && !(feedback && !feedback.correct))}
            style={{
              width: "100%", padding: "14px 20px",
              background: selectedOpt === null || busy ? "#cbd5e1" : "#4F46E5",
              color: "#fff", border: "none", borderRadius: 12, fontWeight: 700, fontSize: 16,
              cursor: selectedOpt === null || busy ? "not-allowed" : "pointer",
            }}
          >
            {busy
              ? "Saving…"
              : feedback && !feedback.correct
              ? "Continue →"
              : isLast
              ? "Complete Assessment & Evaluate"
              : "Next Question →"}
          </button>
        </section>
      )}

      {results && (
        <section style={{ ...card, padding: "36px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎯</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>Diagnostic Complete</h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
              {results.evaluated_by === "llm"
                ? "Evaluated by the CCSS rubric evaluator against your answer pattern."
                : "Scored against the CCSS rubric (evaluator unavailable — deterministic scoring)."}
            </p>
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

          <div style={{ background: "#EEF2FF", border: "1px solid #E0E7FF", borderRadius: 12, padding: 16, marginBottom: 20, textAlign: "center" }}>
            <span style={{ fontSize: 13, color: "#3730A3" }}>Diagnosed working grade level</span>
            <div style={{ fontSize: 32, fontWeight: 800, color: "#4338CA" }}>
              {results.grade_level ? `Grade ${results.grade_level}` : "—"}
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
                  Identified Skill Gap
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
              <div style={{ fontSize: 20, fontWeight: 800, color: "#166534" }}>No skill gap found</div>
              <p style={{ fontSize: 13, color: "#14532D", margin: "6px 0 0" }}>
                Every tested skill is at or above standard. Ready for extension work.
              </p>
            </div>
          )}

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: 10 }}>Per-skill breakdown</div>
            {results.skills.map((s) => (
              <div key={s.skill_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                <span style={{ flex: 1, fontSize: 14, color: "#334155" }}>
                  {s.skill_name} <span style={{ color: "#94a3b8" }}>(Gr {s.grade})</span>
                </span>
                <div style={{ width: 120, height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.mastery * 100}%`, background: s.mastery >= 0.8 ? "#059669" : s.mastery >= 0.5 ? "#D97706" : "#DC2626" }} />
                </div>
                <span style={{ width: 44, textAlign: "right", fontSize: 13, color: "#64748b" }}>{s.correct}/{s.asked}</span>
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
              Launch Adaptive Worksheet →
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
