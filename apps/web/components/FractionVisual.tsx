"use client";

import type { Visual, VisualBar } from "../lib/types";

/**
 * Concrete models drawn as inline SVG: fraction bars and number lines for
 * grades 4-6, counters, place-value blocks and arrays for grades 1-3.
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

function Dot({ removed }: { removed?: boolean }) {
  return (
    <span aria-hidden="true" style={{
      width: 18, height: 18, borderRadius: "50%", display: "inline-block",
      background: removed ? "#FEE2E2" : FILL,
      border: removed ? "2px dashed #EF4444" : "none",
    }} />
  );
}

export default function FractionVisual({ visual }: { visual?: Visual | null }) {
  if (!visual) return null;

  const wrap: React.CSSProperties = {
    background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
    padding: 14, margin: "12px 0", display: "flex", flexDirection: "column", gap: 10,
  };
  const row: React.CSSProperties = { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" };


  // ---- Grades 1-3 ----
  if (visual.kind === "counters") {
    return (
      <div style={wrap}>
        {visual.groups.map((g, i) => (
          <div key={i} style={row}>
            <Label>{g.label}</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 420 }}>
              {Array.from({ length: Math.min(g.n, 25) }).map((_, j) => (
                <Dot key={j} removed={g.removed} />
              ))}
            </div>
          </div>
        ))}
        <span style={{ fontSize: 11, color: "#94A3B8" }}>
          {visual.groups.map((g) => `${g.n}${g.removed ? " taken away" : ""}`).join(" · ")} — count them
        </span>
      </div>
    );
  }

  if (visual.kind === "place_value") {
    return (
      <div style={wrap}>
        {visual.numbers.map((n, i) => (
          <div key={i} style={row}>
            <Label>{n.label}</Label>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
              {/* tens as rods */}
              {Array.from({ length: n.tens }).map((_, t) => (
                <span key={`t${t}`} aria-hidden="true" style={{
                  width: 12, height: 46, background: FILL, borderRadius: 3,
                  display: "inline-block", border: "1px solid #3730A3",
                }} />
              ))}
              {n.ones > 0 && <span aria-hidden="true" style={{ width: 6 }} />}
              {/* ones as unit cubes */}
              <div style={{ display: "flex", gap: 3, flexWrap: "wrap", maxWidth: 120 }}>
                {Array.from({ length: n.ones }).map((_, o) => (
                  <span key={`o${o}`} aria-hidden="true" style={{
                    width: 12, height: 12, background: SECOND, borderRadius: 2,
                    display: "inline-block", border: "1px solid #B45309",
                  }} />
                ))}
              </div>
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>
              {n.tens} ten{n.tens === 1 ? "" : "s"} and {n.ones} one{n.ones === 1 ? "" : "s"}
            </span>
          </div>
        ))}
        <span style={{ fontSize: 12, color: "#64748B" }}>Tall bars are tens, small squares are ones.</span>
      </div>
    );
  }

  if (visual.kind === "array") {
    const { rows, cols } = visual;
    return (
      <div style={wrap}>
        <div role="img" aria-label={`${rows} rows of ${cols}, arranged as a grid`}
          style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} style={{ display: "flex", gap: 5 }}>
              {Array.from({ length: cols }).map((_, c) => (
                <span key={c} aria-hidden="true" style={{
                  width: 20, height: 20, borderRadius: 4, background: FILL_SOFT,
                  border: `1px solid ${FILL}`, display: "inline-block",
                }} />
              ))}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          {rows} {visual.row_label ? `${visual.row_label}${rows === 1 ? "" : "s"}` : "rows"} of {cols}
          {visual.item_label ? ` ${visual.item_label}${cols === 1 ? "" : "s"}` : ""} — count them all.
        </span>
      </div>
    );
  }

  if (visual.kind === "share") {
    // The pile plus the empty groups. Laying out the answer as a grid would
    // hand the quotient over; the sharing is the work.
    return (
      <div style={wrap}>
        <div style={row}>
          <Label>{visual.total}</Label>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", maxWidth: 460 }}>
            {Array.from({ length: Math.min(visual.total, 40) }).map((_, i) => (
              <span key={i} aria-hidden="true" style={{
                width: 16, height: 16, borderRadius: 4, background: FILL_SOFT,
                border: `1px solid ${FILL}`, display: "inline-block",
              }} />
            ))}
          </div>
        </div>
        <div style={row}>
          <Label>into</Label>
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: Math.min(visual.groups, 12) }).map((_, i) => (
              <span key={i} aria-hidden="true" style={{
                width: 34, height: 26, borderRadius: 5, background: "#fff",
                border: `2px dashed ${EDGE}`, display: "inline-block",
              }} />
            ))}
          </div>
        </div>
        <span style={{ fontSize: 12, color: "#64748B" }}>
          Share {visual.total} {visual.item_label ? `${visual.item_label}s` : "items"} equally
          between {visual.groups} {visual.group_label ? `${visual.group_label}s` : "groups"}.
        </span>
      </div>
    );
  }

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
