"use client";

import type { Visual, VisualBar } from "../lib/types";

/**
 * Fraction bars, number lines and ratio counters, drawn as inline SVG.
 *
 * This is the IEP accommodation the parent hub surfaces — "provide visual
 * fraction bars and number line representations before abstract arithmetic" —
 * made real rather than described. It renders the *operands* of a question,
 * never the answer.
 *
 * Pure SVG, no dependencies, and every figure carries a text alternative so a
 * screen reader gets the same information a sighted student gets.
 */

const FILL = "#4F46E5";
const FILL_SOFT = "#C7D2FE";
const SECOND = "#FBBF24";   // second operand — distinct hue, not a lighter tint,
                            // so the two are told apart without relying on colour alone
const EMPTY = "#F1F5F9";
const EDGE = "#94A3B8";

function Bar({ bar, width = 300, height = 34, color = FILL }: { bar: VisualBar; width?: number; height?: number; color?: string }) {
  const den = Math.max(1, bar.den);
  const seg = width / den;
  const shaded = bar.num ?? 0;
  const unknown = bar.num === null;
  return (
    <svg width={width} height={height} role="img"
      aria-label={unknown ? `A bar split into ${den} equal parts, none shaded yet` : `A bar split into ${den} equal parts with ${shaded} shaded`}>
      {Array.from({ length: den }).map((_, i) => (
        <rect
          key={i}
          x={i * seg} y={0} width={seg} height={height}
          fill={i < shaded ? color : EMPTY}
          stroke={EDGE} strokeWidth={1}
        />
      ))}
      {unknown && (
        <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fontSize={15} fontWeight={700} fill="#64748B">?</text>
      )}
    </svg>
  );
}

function NumberLine({ bars, width = 300 }: { bars: VisualBar[]; width?: number }) {
  // Plot every operand. A compare question that plotted only the first
  // fraction showed half the question and read as if it were the whole.
  const plotted = bars.filter((b) => b.num !== null);
  const ticksFrom = plotted[0] ?? bars[0];
  const den = Math.max(1, ticksFrom?.den ?? 1);
  const y = 22;
  const label = plotted.map((b) => `${b.num} of ${b.den}`).join(" and ");
  return (
    <svg width={width} height={46} role="img"
      aria-label={`A number line from 0 to 1, marked at ${label || "no points yet"}`}>
      <line x1={0} y1={y} x2={width} y2={y} stroke={EDGE} strokeWidth={2} />
      {Array.from({ length: den + 1 }).map((_, i) => (
        <line key={i} x1={(i / den) * width} y1={y - 6} x2={(i / den) * width} y2={y + 6} stroke={EDGE} strokeWidth={1.5} />
      ))}
      {plotted.map((b, i) => (
        <g key={i}>
          <circle cx={((b.num as number) / Math.max(1, b.den)) * width} cy={y} r={6}
                  fill={i === 0 ? FILL : "#F59E0B"} />
          <text x={((b.num as number) / Math.max(1, b.den)) * width} y={y - 11}
                textAnchor="middle" fontSize={10} fontWeight={700}
                fill={i === 0 ? FILL : "#B45309"}>
            {b.num}/{b.den}
          </text>
        </g>
      ))}
      <text x={0} y={44} fontSize={11} fill="#64748B">0</text>
      <text x={width - 6} y={44} fontSize={11} fill="#64748B">1</text>
    </svg>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, color: "#64748B", fontWeight: 600, minWidth: 46 }}>{children}</div>;
}

export default function FractionVisual({ visual }: { visual?: Visual | null }) {
  if (!visual) return null;

  const wrap: React.CSSProperties = {
    background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
    padding: 14, margin: "12px 0", display: "flex", flexDirection: "column", gap: 10,
  };
  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" };

  if (visual.kind === "ratio") {
    return (
      <div style={wrap}>
        {visual.counts.map((c, i) => (
          <div key={i} style={row}>
            <Label>{c.n}</Label>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {Array.from({ length: Math.min(c.n, 20) }).map((_, j) => (
                <span key={j} aria-hidden="true" style={{
                  width: 16, height: 16, borderRadius: 4,
                  background: i === 0 ? FILL : FILL_SOFT, display: "inline-block",
                }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>{c.label}</div>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          {visual.counts.map((c) => `${c.n} ${c.label}`).join(" · ")}
        </span>
      </div>
    );
  }

  const bars = visual.bars ?? [];

  return (
    <div style={wrap}>
      {bars.map((b, i) => (
        <div key={i} style={row}>
          <Label>{b.label ?? ""}</Label>
          <Bar bar={b} color={i === 0 ? FILL : SECOND} />
        </div>
      ))}

      {/* A number line as a second representation — different students read different models. */}
      {visual.kind !== "equivalence" && bars.length > 0 && (
        <div style={row}>
          <Label>on a line</Label>
          <NumberLine bars={bars} />
        </div>
      )}

      {visual.kind === "sum" && (
        <div style={{ fontSize: 12, color: "#64748B" }}>
          Same-size pieces — count how many you have altogether.
        </div>
      )}
      {visual.kind === "compare" && (
        <div style={{ fontSize: 12, color: "#64748B" }}>
          Which bar has more shaded?
        </div>
      )}
      {visual.kind === "equivalence" && (
        <div style={{ fontSize: 12, color: "#64748B" }}>
          Both bars are the same length — how many smaller pieces cover the same amount?
        </div>
      )}
    </div>
  );
}
