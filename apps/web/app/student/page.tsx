"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setSession } from "@/lib/session";

interface DiagnosticQuestion {
  id: string;
  skillId: string;
  skillName: string;
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
    grade: 4,
    prompt: "A pie is cut into 8 equal slices. If you eat 3 slices, what fraction of the pie did you eat?",
    options: ["3/8", "5/8", "3/5", "8/3"],
    correctIndex: 0,
  },
  {
    id: "dq-2",
    skillId: "math.4.fractions.equivalent",
    skillName: "Equivalent Fractions",
    grade: 4,
    prompt: "Which fraction is equivalent to 2/3?",
    options: ["4/9", "6/9", "3/4", "4/5"],
    correctIndex: 1,
  },
  {
    id: "dq-3",
    skillId: "math.5.fractions.compare",
    skillName: "Compare Fractions",
    grade: 5,
    prompt: "Which fraction is larger: 3/4 or 2/3?",
    options: ["2/3", "3/4", "They are equal", "Cannot be determined"],
    correctIndex: 1,
  },
  {
    id: "dq-4",
    skillId: "math.5.fractions.add-like",
    skillName: "Add Fractions (Like Denominators)",
    grade: 5,
    prompt: "What is 2/7 + 3/7?",
    options: ["5/14", "5/7", "6/7", "5/49"],
    correctIndex: 1,
  },
  {
    id: "dq-5",
    skillId: "math.6.ratios.intro",
    skillName: "Ratio Concepts",
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
  const [diagnosedGap, setDiagnosedGap] = useState<{ id: string; name: string; grade: number } | null>(null);

  const q = DIAGNOSTIC_QUESTIONS[currentIdx];

  const handleNext = () => {
    if (selectedOpt === null) return;
    const newAnswers = { ...answers, [q.id]: selectedOpt };
    setAnswers(newAnswers);
    setSelectedOpt(null);

    if (currentIdx + 1 < DIAGNOSTIC_QUESTIONS.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Calculate gap skill (first failed question or hardest unmastered)
      let gap = DIAGNOSTIC_QUESTIONS[1]; // default equivalent
      for (const item of DIAGNOSTIC_QUESTIONS) {
        if (newAnswers[item.id] !== item.correctIndex) {
          gap = item;
          break;
        }
      }
      setDiagnosedGap({ id: gap.skillId, name: gap.skillName, grade: gap.grade });
      setSession({
        studentId: "stu-001",
        gradeLevel: gap.grade,
        gapSkill: gap.skillId,
        strategy: "worked_example",
      });
      setFinished(true);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32, fontFamily: "system-ui, sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, borderBottom: "1px solid #e2e8f0", paddingBottom: 16 }}>
        <Link href="/student/dashboard" style={{ color: "#4F46E5", textDecoration: "none", fontWeight: 600, fontSize: 14 }}>
          ← Back to Dashboard
        </Link>
        <span style={{ fontSize: 13, background: "#EEF2FF", color: "#4338CA", padding: "4px 10px", borderRadius: 12, fontWeight: 600 }}>
          10-Minute Math Diagnostic
        </span>
      </header>

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
            disabled={selectedOpt === null}
            style={{
              width: "100%",
              padding: "14px 20px",
              background: selectedOpt === null ? "#cbd5e1" : "#4F46E5",
              color: "#ffffff",
              border: "none",
              borderRadius: 12,
              fontWeight: 700,
              fontSize: 16,
              cursor: selectedOpt === null ? "not-allowed" : "pointer",
            }}
          >
            {currentIdx + 1 === DIAGNOSTIC_QUESTIONS.length ? "Complete Assessment & Diagnose Gap" : "Next Question →"}
          </button>
        </section>
      ) : (
        <section style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 36, textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🎯</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>
            Diagnostic Assessment Complete!
          </h2>
          <p style={{ color: "#64748b", fontSize: 15, marginBottom: 24, maxWidth: 480, margin: "0 auto 24px" }}>
            The AI Teaching Engine diagnosed your prerequisite learning state:
          </p>

          <div style={{ background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: 12, padding: 20, marginBottom: 28, textAlign: "left" }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "#C2410C", letterSpacing: "0.05em" }}>
              Identified Skill Gap
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#9A3412", marginTop: 4 }}>
              {diagnosedGap?.name} (Grade {diagnosedGap?.grade})
            </div>
            <p style={{ fontSize: 13, color: "#7C2D12", marginTop: 6, lineHeight: 1.4 }}>
              We've generated a tailored practice set with step-by-step scaffolds and visual models to unstick this skill.
            </p>
          </div>

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
