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
import Confetti from "../app/student/Confetti";
import FractionVisual from "./FractionVisual";
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

const THEME_LABEL: Record<string, string> = {
  space: "🚀 Space & Rockets",
  minecraft: "🧱 Building Blocks",
  videogames: "🎮 Video Games",
  basketball: "🏀 Basketball Stats",
  dinosaurs: "🦖 Dinosaurs",
  robotics: "🤖 Robotics & Coding",
  soccer: "⚽ Soccer",
  neutral: "✏️ Everyday",
};

const CHEERS = ["Nice one!", "You got it!", "Sharp!", "That's it!", "Brilliant!"];

/** Badges are earned on the worksheet, not handed out for showing up. */
function earnedBadges(result: Result, usedHints: number) {
  const out: { icon: string; label: string }[] = [];
  if (result.score === 1) out.push({ icon: "🏆", label: "Perfect set" });
  if (result.score === 1 && usedHints === 0) out.push({ icon: "🧠", label: "No hints needed" });
  if (result.score >= 0.8 && result.decision === "advance") out.push({ icon: "🚀", label: "Level up" });
  if (result.score > 0 && result.score < 0.8) out.push({ icon: "💪", label: "Kept going" });
  return out;
}

export default function WorksheetFlow() {
  const router = useRouter();
  const [ws, setWs] = useState<Worksheet | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [mocked, setMocked] = useState(USE_MOCKS);
  const [ready, setReady] = useState(false);
  const [hints, setHints] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [cheer, setCheer] = useState<string | null>(null);

  useEffect(() => setReady(true), []); // localStorage is client-only

  const answered = ws ? ws.items.filter((i) => (answers[i.id] ?? "").trim() !== "").length : 0;
  const total = ws?.items.length ?? 0;
  const hintsUsed = Object.values(hints).filter(Boolean).length;

  /** Light acknowledgement as the student works. Not marking -- just momentum. */
  function noteAttempt(itemId: string, value: string) {
    setAnswers({ ...answers, [itemId]: value });
    if (value.trim() !== "" && !touched[itemId]) {
      setTouched({ ...touched, [itemId]: true });
      setCheer(CHEERS[Math.floor(Date.now() / 700) % CHEERS.length]);
      window.setTimeout(() => setCheer(null), 1200);
    }
  }

  async function generate() {
    setBusy(true);
    setNote(null);
    setResult(null);
    setAnswers({});
    setHints({});
    setTouched({});
    setCheer(null);
    const s = getSession();
    const interests = s.interests ?? [];

    if (mocked) {
      setWs(mockWorksheet(s.studentId, s.gapSkill || "math.5.fractions.compare", interests));
      setBusy(false);
      return;
    }
    try {
      const r = await fetch(`${API}/worksheets/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_id: s.studentId,
          skill_id: s.gapSkill ?? null,
          // Interest themes the parent picked in /parent/dashboard.
          themes: interests.length ? interests : null,
        }),
      });
      if (!r.ok) throw new Error(await r.text());
      setWs(await r.json());
    } catch {
      setMocked(true);
      setNote("API unreachable — running on mock items.");
      setWs(mockWorksheet(s.studentId, s.gapSkill || "math.5.fractions.compare", interests));
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
      <Confetti trigger={confettiTrigger} />

      {/* Top Navigation Connector */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #eee", paddingBottom: 12 }}>
        <button
          onClick={() => router.push("/student/dashboard")}
          style={{ background: "none", border: "none", color: "#4F46E5", fontWeight: 600, fontSize: 14, cursor: "pointer", padding: 0 }}
        >
          ← Back to Student Dashboard
        </button>
        <span style={{ fontSize: 13, color: "#888", fontWeight: 500 }}>
          UnStuck Adaptive Tutor
        </span>
      </div>

      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          {ws ? ws.skill_name : "Practice Worksheet"}
        </h1>
        {ws && (
          <p style={{ margin: "4px 0 0", color: "#666", fontSize: 14 }}>
            Grade {ws.grade_level} · {ws.items.length} items
            {(ws.themes ?? []).length > 0 && (
              <span style={{ color: "#4338CA" }}>
                {" · written for "}
                {(ws.themes ?? []).map((t) => THEME_LABEL[t] ?? t).join(" · ")}
              </span>
            )}
          </p>
        )}
        {ws && (ws.guidance_applied ?? []).length > 0 && (
          /* An adjustment made on a child's behalf should never be invisible. */
          <p style={{ margin: "8px 0 0", fontSize: 13, color: "#3730A3", background: "#EEF2FF",
                      border: "1px solid #C7D2FE", borderRadius: 8, padding: "8px 12px" }}>
            ✏️ Adjusted from your teacher and family: {(ws.guidance_applied ?? []).join(" · ")}
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
          {!result && (
            <div style={{ margin: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#475569", marginBottom: 6 }}>
                <span>{answered} of {total} answered</span>
                <span style={{ color: cheer ? "#059669" : "transparent", fontWeight: 700, transition: "color .2s" }}>
                  {cheer ?? "·"}
                </span>
              </div>
              <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${total ? (answered / total) * 100 : 0}%`, background: "#4F46E5", transition: "width .3s ease" }} />
              </div>
            </div>
          )}

          <ol style={{ paddingLeft: 20, margin: "16px 0" }}>
            {ws.items.map((it) => {
              const g: Grade | undefined = result?.grades.find((x) => x.item_id === it.id);
              return (
                <li key={it.id} style={{ marginBottom: 24 }}>
                  <div style={{ fontWeight: 500, lineHeight: 1.5 }}>{it.prompt}</div>

                  {/* Visual model before the abstract arithmetic — the IEP
                      accommodation surfaced in the parent hub, made real. */}
                  <FractionVisual visual={it.visual} />

                  <input
                    type="text"
                    value={answers[it.id] ?? ""}
                    onChange={(e) => noteAttempt(it.id, e.target.value)}
                    disabled={Boolean(result)}
                    placeholder={it.answer_format === "whole" ? "e.g. 12" : "e.g. 3/4"}
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
                  {!result && it.hint && (
                    <button
                      type="button"
                      onClick={() => setHints({ ...hints, [it.id]: !hints[it.id] })}
                      style={ghostBtn}
                    >
                      {hints[it.id] ? "Hide hint" : "Need a hint?"}
                    </button>
                  )}
                  {!result && hints[it.id] && it.hint && (
                    <div style={{ marginTop: 8, fontSize: 13, color: "#7C2D12", background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 12px" }}>
                      💡 {it.hint}
                    </div>
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
          <p style={{ margin: "10px 0 12px", color: "#333", fontSize: 15 }}>{result.rationale}</p>

          {earnedBadges(result, hintsUsed).length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "0 0 16px" }}>
              {earnedBadges(result, hintsUsed).map((b) => (
                <span key={b.label} style={{
                  background: "#EEF2FF", color: "#3730A3", border: "1px solid #C7D2FE",
                  borderRadius: 999, padding: "6px 12px", fontSize: 13, fontWeight: 600,
                }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </div>
          )}
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
const ghostBtn: React.CSSProperties = {
  marginLeft: 12, padding: "6px 12px", fontSize: 13, borderRadius: 8,
  border: "1px solid #cbd5e1", background: "#fff", color: "#475569",
  cursor: "pointer", fontWeight: 600,
};
const card: React.CSSProperties = {
  border: "2px solid #ddd",
  borderRadius: 12,
  padding: 18,
  margin: "20px 0",
  background: "#ffffff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
