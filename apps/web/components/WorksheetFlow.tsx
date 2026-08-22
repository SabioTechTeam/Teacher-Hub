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
        const r = await fetch(`${API}/worksheets/grade`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            worksheet_id: ws.id,
            answers: ws.items.map((i) => ({ item_id: i.id, response: answers[i.id] ?? "" })),
          }),
        });
        if (!r.ok) throw new Error(await r.text());
        res = await r.json();
      } catch {
        setMocked(true);
        setNote("API unreachable — graded locally on mocks.");
        res = mockGrade(ws, answers);
      }
    }
    // The loop: hand the next target back to the session so the next
    // worksheet picks up where this one left off.
    setSession({ gapSkill: res.next_target_skill, gradeLevel: res.next_grade_level });
    setResult(res);
    setBusy(false);
  }

  const gradeFor = (id: string): Grade | undefined =>
    result?.grades.find((g) => g.item_id === id);

  if (!ready) return <main style={wrap}><p>Loading…</p></main>;

  return (
    <main style={wrap}>
      <h1 style={{ marginBottom: 4 }}>Worksheet</h1>
      <p style={{ color: "#666", marginTop: 0, fontSize: 14 }}>
        quiz → level → <strong>worksheet</strong> → grade → adapt
        {mocked && <span style={pill}>mock data</span>}
      </p>

      {note && <p style={{ color: "#8a6d00", fontSize: 14 }}>{note}</p>}

      {!ws && (
        <button onClick={generate} disabled={busy} style={btn}>
          {busy ? "Generating…" : "Get my worksheet"}
        </button>
      )}

      {ws && (
        <>
          <div style={card}>
            <strong>{ws.skill_name}</strong> · Grade {ws.grade_level}
            <div style={{ color: "#666", fontSize: 13 }}>
              {ws.standards?.join(", ")} · strategy: {ws.strategy} · items: {ws.source}
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
                    aria-label={it.prompt}
                    onKeyDown={(e) => { if (e.key === "Enter" && !result) submit(); }}
                    style={{
                      marginTop: 6, padding: "6px 8px", width: 140, fontSize: 15, borderRadius: 6,
                      border: `1px solid ${g ? (g.correct ? "#0a7c2f" : "#a33") : "#ccc"}`,
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
          <div style={{ fontSize: 26, fontWeight: 600 }}>{Math.round(result.score * 100)}%</div>
          <div style={{ color: DECISION_COLOR[result.decision], fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
            {result.decision.toUpperCase()}
          </div>
          <p style={{ marginBottom: 10 }}>{result.rationale}</p>
          <button onClick={generate} disabled={busy} style={btn}>Next worksheet →</button>
        </div>
      )}
    </main>
  );
}

const wrap: React.CSSProperties = { padding: 24, maxWidth: 760, fontFamily: "system-ui" };
const btn: React.CSSProperties = {
  padding: "10px 16px", fontSize: 15, borderRadius: 8,
  border: "1px solid #333", background: "#111", color: "#fff", cursor: "pointer",
};
const card: React.CSSProperties = {
  border: "1px solid #ddd", borderRadius: 10, padding: 14, margin: "16px 0", background: "#fafafa",
};
const pill: React.CSSProperties = {
  marginLeft: 8, padding: "2px 8px", borderRadius: 999,
  background: "#eee", color: "#555", fontSize: 12,
};
