"use client";

import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STUDENT = "demo";

type Item = { id: string; prompt: string; type: string; choices?: string[]; hint?: string };
type Worksheet = {
  id: string; skillName: string; skill_name?: string; grade_level: number;
  target_skill: string; strategy: string; source: string; items: Item[]; standards: string[];
};
type Grade = { item_id: string; correct: boolean; expected: string; got: string; explanation?: string };
type Result = {
  score: number; decision: "advance" | "hold" | "remediate";
  next_target_skill: string; next_grade_level: number; rationale: string;
  grades: Grade[]; mastery_after: Record<string, number>;
};

const DECISION_COLOR: Record<string, string> = {
  advance: "#0a7c2f",
  hold: "#8a6d00",
  remediate: "#a33",
};

export default function WorksheetPage() {
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function generate() {
    setBusy(true); setErr(null); setResult(null); setAnswers({});
    try {
      const r = await fetch(`${API}/worksheets/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: STUDENT }),
      });
      if (!r.ok) throw new Error(await r.text());
      setWs(await r.json());
    } catch (e: any) { setErr(String(e.message || e)); }
    setBusy(false);
  }

  async function submit() {
    if (!ws) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`${API}/worksheets/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          worksheet_id: ws.id,
          answers: ws.items.map((i) => ({ item_id: i.id, response: answers[i.id] ?? "" })),
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setResult(await r.json());
    } catch (e: any) { setErr(String(e.message || e)); }
    setBusy(false);
  }

  const gradeFor = (id: string) => result?.grades.find((g) => g.item_id === id);

  return (
    <main style={{ padding: 24, maxWidth: 760, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 4 }}>Worksheet</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Quiz → level → <strong>worksheet</strong> → grade → adapt
      </p>

      {!ws && (
        <button onClick={generate} disabled={busy} style={btn}>
          {busy ? "Generating…" : "Get my worksheet"}
        </button>
      )}
      {err && <p style={{ color: "#a33" }}>Error: {err}</p>}

      {ws && (
        <>
          <div style={card}>
            <strong>{ws.skill_name || ws.skillName}</strong> · Grade {ws.grade_level}
            <div style={{ color: "#666", fontSize: 13 }}>
              {ws.standards?.join(", ")} · strategy: {ws.strategy} · items from: {ws.source}
            </div>
          </div>

          <ol style={{ paddingLeft: 20 }}>
            {ws.items.map((it) => {
              const g = gradeFor(it.id);
              return (
                <li key={it.id} style={{ margin: "16px 0" }}>
                  <div>{it.prompt}</div>
                  <input
                    value={answers[it.id] ?? ""}
                    onChange={(e) => setAnswers({ ...answers, [it.id]: e.target.value })}
                    disabled={!!result}
                    placeholder="e.g. 3/4"
                    style={{
                      marginTop: 6, padding: "6px 8px", width: 140, fontSize: 15,
                      border: `1px solid ${g ? (g.correct ? "#0a7c2f" : "#a33") : "#ccc"}`,
                      borderRadius: 6,
                    }}
                  />
                  {g && (
                    <span style={{ marginLeft: 10, color: g.correct ? "#0a7c2f" : "#a33" }}>
                      {g.correct ? "correct" : `answer: ${g.expected}`}
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
          <div style={{ fontSize: 22, fontWeight: 600 }}>{Math.round(result.score * 100)}%</div>
          <div style={{ color: DECISION_COLOR[result.decision], fontWeight: 600, textTransform: "uppercase", fontSize: 13 }}>
            {result.decision}
          </div>
          <p style={{ marginBottom: 8 }}>{result.rationale}</p>
          <button onClick={generate} disabled={busy} style={btn}>
            Next worksheet →
          </button>
        </div>
      )}
    </main>
  );
}

const btn: React.CSSProperties = {
  padding: "10px 16px", fontSize: 15, borderRadius: 8,
  border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer",
};
const card: React.CSSProperties = {
  border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "16px 0", background: "#fafafa",
};
