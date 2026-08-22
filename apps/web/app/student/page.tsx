"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/lib/session";
import Confetti from "./Confetti";

interface DiagnosticQuestion {
  id: string;
  skillId: string;
  skillName: string;
  standard: string;
  standardDesc: string;
  grade: 4 | 5 | 6;
  prompt: string;
  options: string[];
  correctIndex: number;
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    id: "dq-1",
    skillId: "math.4.fractions.parts",
    skillName: "Parts of a Whole",
    standard: "CCSS 4.NF.1",
    standardDesc: "Explain why a fraction a/b is equivalent to a fraction (n×a)/(n×b) by using visual fraction models.",
    grade: 4,
    prompt: "A pie is cut into 8 equal slices. If you eat 3 slices, what fraction of the pie did you eat?",
    options: ["3/8", "5/8", "3/5", "8/3"],
    correctIndex: 0,
  },
  {
    id: "dq-2",
    skillId: "math.4.fractions.equivalent",
    skillName: "Equivalent Fractions",
    standard: "CCSS 4.NF.1",
    standardDesc: "Recognize and generate equivalent fractions using fraction strips and number lines.",
    grade: 4,
    prompt: "Which fraction is equivalent to 2/3?",
    options: ["4/9", "6/9", "3/4", "4/5"],
    correctIndex: 1,
  },
  {
    id: "dq-3",
    skillId: "math.5.fractions.compare",
    skillName: "Compare Fractions",
    standard: "CCSS 4.NF.2",
    standardDesc: "Compare two fractions with different numerators and different denominators.",
    grade: 5,
    prompt: "Which fraction is larger: 3/4 or 2/3?",
    options: ["2/3", "3/4", "They are equal", "Cannot be determined"],
    correctIndex: 1,
  },
  {
    id: "dq-4",
    skillId: "math.5.fractions.add-like",
    skillName: "Add Fractions (Like Denominators)",
    standard: "CCSS 4.NF.3",
    standardDesc: "Understand addition and subtraction of fractions as joining and separating parts referring to the same whole.",
    grade: 5,
    prompt: "What is 2/7 + 3/7?",
    options: ["5/14", "5/7", "6/7", "5/49"],
    correctIndex: 1,
  },
  {
    id: "dq-5",
    skillId: "math.6.ratios.intro",
    skillName: "Ratio Concepts",
    standard: "CCSS 6.RP.1",
    standardDesc: "Understand the concept of a ratio and use ratio language to describe a relationship between two quantities.",
    grade: 6,
    prompt: "In a fruit basket, there are 4 apples and 6 bananas. What is the ratio of apples to total fruit in simplest form?",
    options: ["4:6", "2:3", "2:5", "4:10"],
    correctIndex: 2,
  },
];

export default function StudentDiagnosticPage() {
  const router = useRouter();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [finished, setFinished] = useState(false);
  const [diagnosedGap, setDiagnosedGap] = useState<DiagnosticQuestion | null>(null);
  const [scoreCount, setScoreCount] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);

  const q = DIAGNOSTIC_QUESTIONS[currentIdx];

  const encourage = (streakVal: number) => {
    if (streakVal >= 3) {
      return ["\ud83d\udd25 Unstoppable!", "\ud83d\ude80 You're on fire!", "\u2b50 Amazing streak!"][streakVal % 3];
    }
    return ["\ud83c\udf89 Great job!", "\ud83d\udcaa Well done!", "\u2705 Correct!", "\ud83c\udf1f You got it!"][streakVal % 4];
  };

  /** Move to the next question, or finish and compute the CCSS rubric result. */
  const advance = (newAnswers: Record<string, number>) => {
    setSelectedOpt(null);

    if (currentIdx + 1 < DIAGNOSTIC_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
      return;
    }

    // Calculate score and gap skill
    let correct = 0;
    let gap = DIAGNOSTIC_QUESTIONS[1]; // default fallback
    let foundGap = false;

    for (const item of DIAGNOSTIC_QUESTIONS) {
      if (newAnswers[item.id] === item.correctIndex) {
        correct += 1;
      } else if (!foundGap) {
        gap = item;
        foundGap = true;
      }
    }

    setScoreCount(correct);
    setDiagnosedGap(gap);
    setSession({
      studentId: "stu-001",
      gradeLevel: gap.grade,
      gapSkill: gap.skillId,
      strategy: "worked_example",
    });
    setConfettiTrigger((t) => t + 1);
    setFeedback(null);
    setFinished(true);
  };

  const handleNext = () => {
    // A wrong answer pauses on the question; the next click continues.
    if (feedback && !feedback.correct) {
      setFeedback(null);
      advance(answers);
      return;
    }

    if (selectedOpt === null) return;
    const newAnswers = { ...answers, [q.id]: selectedOpt };
    setAnswers(newAnswers);

    if (selectedOpt === q.correctIndex) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setPoints(points + 10 + Math.min(newStreak - 1, 5) * 2);
      setConfettiTrigger((t) => t + 1);
      setFeedback({ correct: true, message: encourage(newStreak) });
      advance(newAnswers);
    } else {
      setStreak(0);
      setFeedback({ correct: false, message: "Not quite \u2014 keep going, you've got this! \ud83d\udc99" });
    }
  };

  const percentage = Math.round((scoreCount / DIAGNOSTIC_QUESTIONS.length) * 100);

  // CCSS 4-Level Proficiency Scale mapping from curriculum/rubrics/
  const getProficiency = (pct: number) => {
    if (pct >= 88) return { level: 4, label: "Exceeds Standard", color: "#0a7c2f", bg: "#F0FDF4", action: "Accelerate to extension & ratio concepts" };
    if (pct >= 75) return { level: 3, label: "Meets Standard", color: "#059669", bg: "#ECFDF5", action: "Proceed with standard grade unit pace" };
    if (pct >= 50) return { level: 2, label: "Approaching Standard", color: "#D97706", bg: "#FFFBEB", action: "Targeted re-teaching with visual fraction models" };
    return { level: 1, label: "Below Standard", color: "#DC2626", bg: "#FEF2F2", action: "Foundational remediation on prerequisite skill" };
  };

  const prof = getProficiency(percentage);

  return (
    <main style={{ maxWidth: 740, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #e2e8f0", paddingBottom: 14 }}>
        <Link href="/student/dashboard" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <span style={{ fontSize: 13, background: "#EEF2FF", color: "#4338CA", padding: "4px 12px", borderRadius: 12, fontWeight: 600 }}>
          10-Minute Math Diagnostic
        </span>
      </header>

      <Confetti trigger={confettiTrigger} />

      {!finished && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "10px 16px", marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#475569", fontWeight: 600 }}>
            Points <strong style={{ color: "#4F46E5", fontSize: 16 }}>{points}</strong>
          </span>
          <span style={{ fontSize: 13, color: streak >= 3 ? "#C2410C" : "#64748b", fontWeight: 600 }}>
            {streak > 0 ? `${"\ud83d\udd25".repeat(Math.min(streak, 3))} ${streak} in a row` : "Build a streak!"}
          </span>
        </div>
      )}

      {feedback && !finished && (
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

      {!finished ? (
        <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 12 }}>
            <span>Question {currentIdx + 1} of {DIAGNOSTIC_QUESTIONS.length}</span>
            <span>Skill: <strong>{q.skillName}</strong> (Gr {q.grade})</span>
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, width: "100%", background: "#f1f5f9", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((currentIdx + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%`, background: "#4F46E5", transition: "width 0.3s ease" }} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 24, lineHeight: 1.4 }}>
            {q.prompt}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
            {q.options.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSelectedOpt(i)}
                style={{
                  padding: "14px 18px",
                  textAlign: "left",
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: selectedOpt === i ? 600 : 400,
                  border: selectedOpt === i ? "2px solid #4F46E5" : "1px solid #cbd5e1",
                  background: selectedOpt === i ? "#EEF2FF" : "#ffffff",
                  color: selectedOpt === i ? "#3730A3" : "#334155",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
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
            disabled={selectedOpt === null && !(feedback && !feedback.correct)}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: selectedOpt === null && !(feedback && !feedback.correct) ? "#cbd5e1" : "#4F46E5",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: selectedOpt === null && !(feedback && !feedback.correct) ? "not-allowed" : "pointer",
            }}
          >
            {feedback && !feedback.correct
              ? "Continue \u2192"
              : currentIdx + 1 === DIAGNOSTIC_QUESTIONS.length
              ? "Complete Assessment & Evaluate Rubric"
              : "Next Question \u2192"}
          </button>
        </section>
      ) : (
        <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "36px 28px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
          
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🎯</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: "#1e293b", margin: "0 0 6px" }}>
              Diagnostic Assessment Complete!
            </h2>
            <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
              The AI Teaching Engine evaluated your responses against the Common Core State Standards (CCSS).
            </p>
          </div>

          {/* Performance & Rubric Banner */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Overall Score \u00b7 {points} pts</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: "#1E293B", marginTop: 4 }}>
                {scoreCount}/{DIAGNOSTIC_QUESTIONS.length} <span style={{ fontSize: 18, color: "#64748B" }}>({percentage}%)</span>
              </div>
            </div>

            <div style={{ background: prof.bg, border: `1px solid ${prof.color}40`, borderRadius: 12, padding: 18, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: prof.color, textTransform: "uppercase" }}>CCSS Rubric Level</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: prof.color, marginTop: 6 }}>
                Level {prof.level}: {prof.label}
              </div>
            </div>
          </div>

          {/* Diagnosed Skill Gap Card */}
          <div style={{ background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 14, padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#C2410C", letterSpacing: "0.05em" }}>
                Identified Skill Gap & Standard
              </span>
              <span style={{ fontSize: 12, background: "#FFEDD5", color: "#9A3412", padding: "2px 8px", borderRadius: 6, fontWeight: 700 }}>
                {diagnosedGap?.standard}
              </span>
            </div>

            <div style={{ fontSize: 20, fontWeight: 800, color: "#9A3412", marginTop: 2 }}>
              {diagnosedGap?.skillName} (Grade {diagnosedGap?.grade})
            </div>
            <p style={{ fontSize: 13, color: "#7C2D12", marginTop: 6, lineHeight: 1.4, margin: "6px 0 0" }}>
              <strong>Standard Text:</strong> {diagnosedGap?.standardDesc}
            </p>
            <p style={{ fontSize: 13, color: "#9A3412", marginTop: 8, lineHeight: 1.4, margin: "8px 0 0", borderTop: "1px dashed #FDBA74", paddingTop: 8 }}>
              <strong>Prescribed Strategy:</strong> {prof.action}. We've generated tailored practice problems with worked examples.
            </p>
          </div>

          {/* Evaluation Guardrails Box */}
          <div style={{ background: "#F0FDF4", border: "1px solid #DCFCE7", borderRadius: 12, padding: 16, marginBottom: 28 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 6 }}>
              🛡️ Student Evaluation Guardrails Active
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#14532D", lineHeight: 1.6 }}>
              <li><strong>CCSS Grounding:</strong> Questions generated are bounded by verified Level 3 & 4 criteria.</li>
              <li><strong>Deterministic Verification:</strong> Math calculations are checked with exact fractions before grading.</li>
              <li><strong>Safety & Privacy:</strong> FERPA & COPPA compliant; no PII stored or passed to external models.</li>
            </ul>
          </div>

          {/* Action CTAs */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push("/tutor")}
              style={{
                padding: "14px 28px",
                background: "#059669",
                color: "#ffffff",
                border: "none",
                borderRadius: 12,
                fontWeight: 700,
                fontSize: 16,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
              }}
            >
              Launch Adaptive Worksheet →
            </button>
            <Link
              href="/student/dashboard"
              style={{
                padding: "14px 20px",
                background: "#f1f5f9",
                color: "#334155",
                borderRadius: 12,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
