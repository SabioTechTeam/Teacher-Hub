"use client";

/**
 * Role 5: worksheet UI + answer form.
 *
 * Runs three ways, in this order of preference:
 *   1. NEXT_PUBLIC_USE_MOCKS=true  -> local mock payload, no API, no LLM
 *   2. live API                    -> services/api /worksheets/generate + /grade
 *   3. API unreachable             -> auto-falls back to mocks with a banner
 *
 * (3) is deliberate: the demo must never show a dead screen.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, setSession } from "../lib/session";
import { mockGrade, mockWorksheet } from "../lib/mockWorksheet";
import type { Grade, Result, Worksheet } from "../lib/types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

const DECISION_COLOR: Record<string, string> = {
  advance: "#0a7c2f",
  hold: "#8a6d00",
  remediate: "#a33",
};

export default function WorksheetFlow() {
  const router = useRouter();
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mocked, setMocked] = useState(USE_MOCKS);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []); // localStorage is client-only

  async function generate() {
    setBusy(true);
    setNote(null);
    setResult(null);
    setAnswers({});
    const s = getSession();

    if (mocked) {
      setWs(mockWorksheet(s.studentId, s.gapSkill || "math.5.fractions.compare"));
      setBusy(false);
      return;
    }
    try {
      const r = await fetch(`${API}/worksheets/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: s.studentId, skill_id: s.gapSkill ?? null }),
      });
      if (!r.ok) throw new Error(await r.text());
      setWs(await r.json());
    } catch {
      setMocked(true);
      setNote("API unreachable — running on mock items.");
      setWs(mockWorksheet(s.studentId, s.gapSkill || "math.5.fractions.compare"));
    }
    setBusy(false);
  }

  async function submit() {
    if (!ws) return;
    setBusy(true);
    setNote(null);

    let res: Result;
    if (mocked) {
      res = mockGrade(ws, answers);
    } else {
      try {
        const payload = {
          worksheet_id: ws.id,
          answers: Object.entries(answers).map(([item_id, response]) => ({
            item_id,
            response,
          })),
        };
        const r = await fetch(`${API}/worksheets/grade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(await r.text());
        res = await r.json();
      } catch {
        res = mockGrade(ws, answers);
        setNote("Grade call failed — evaluated with local rules.");
      }
    }

    setResult(res);
    setBusy(false);

    // Write back into student session so next generation follows the adaptive path
    const prev = getSession();
    setSession({
      studentId: prev.studentId,
      gradeLevel: (res.next_grade_level as any) ?? prev.gradeLevel,
      gapSkill: res.next_target_skill ?? prev.gapSkill,
      strategy: prev.strategy,
    });
  }

  if (!ready) {
    return (
      <main style={wrap}>
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {/* Top Navigation Connector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
        <button
          onClick={() => router.push("/student/dashboard")}
          style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}
        >
          ← Back to Student Dashboard
        </button>
        <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
          Teacher-Hub Adaptive Tutor
        </span>
      </div>

      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          {ws ? ws.skill_name : "Practice Worksheet"}
        </h1>
        {ws && (
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            Grade {ws.grade_level} · {ws.items.length} items
          </p>
        )}
      </header>

      {note && (
        <div style={{ ...card, borderColor: "#e0b000", background: "#fffdf0" }}>{note}</div>
      )}

      {!ws && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <p style={{ color: "#666", marginBottom: 16 }}>
            Ready to practice? Your AI tutor has customized a problem set for you.
          </p>
          <button onClick={generate} disabled={busy} style={btn}>
            {busy ? "Generating…" : "Generate worksheet"}
          </button>
        </div>
      )}

      {ws && (
        <>
          <ol style={{ paddingLeft: 20, margin: "16px 0" }}>
            {ws.items.map((it) => {
              const g: Grade | undefined = result?.grades.find((x) => x.item_id === it.id);
              return (
                <li key={it.id} style={{ marginBottom: 18 }}>
                  <div style={{ fontWeight: 500 }}>{it.prompt}</div>
                  <input
                    type="text"
                    value={answers[it.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [it.id]: e.target.value })}
                    disabled={Boolean(result)}
                    placeholder="e.g. 3/4"
                    aria-label={it.prompt}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !result) submit();
                    }}
                    style={{
                      marginTop: 6,
                      padding: "8px 12px",
                      width: 160,
                      fontSize: 15,
                      borderRadius: 8,
                      border: `1px solid ${g ? (g.correct ? "#0a7c2f" : "#a33") : "#ccc"}`,
                    }}
                  />
                  {g && (
                    <span style={{ marginLeft: 12, fontWeight: 600, color: g.correct ? "#0a7c2f" : "#a33" }}>
                      {g.correct ? "✓ Correct" : `✗ Answer: ${g.expected}`}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {!result && (
            <button onClick={submit} disabled={busy} style={btn}>
              {busy ? "Grading…" : "Turn it in"}
            </button>
          )}
        </>
      )}

      {result && (
        <div style={{ ...card, borderColor: DECISION_COLOR[result.decision] }}>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{Math.round(result.score * 100)}%</div>
          <div
            style={{
              color: DECISION_COLOR[result.decision],
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {result.decision.toUpperCase()}
          </div>
          <p style={{ margin: "10px 0 16px", color: "#333", fontSize: 15 }}>{result.rationale}</p>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={generate} disabled={busy} style={btn}>
              Next worksheet →
            </button>
            <button
              onClick={() => router.push("/student/dashboard")}
              style={{
                padding: "10px 16px",
                fontSize: 15,
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#ffffff",
                color: "#333",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Done / Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

const wrap: React.CSSProperties = { padding: "28px 24px", maxWidth: 760, margin: "0 auto", fontFamily: "system-ui, sans-serif" };
const btn: React.CSSProperties = {
  padding: "10px 20px",
  fontSize: 15,
  borderRadius: 8,
  border: "none",
  background: "#4F46E5",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 600,
};
const card: React.CSSProperties = {
  border: "2px solid #ddd",
  borderRadius: 12,
  padding: 18,
  margin: "20px 0",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
