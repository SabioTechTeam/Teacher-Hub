"use client";

import { useEffect, useState } from "react";

const COLORS = ["#4F46E5", "#059669", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  rotate: number;
}

/** Lightweight dependency-free confetti burst (pure CSS animation). */
export default function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    const batch: Piece[] = Array.from({ length: 80 }, (_, id) => ({
      id: trigger * 1000 + id,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 1.8 + Math.random() * 1.4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: 6 + Math.random() * 8,
      rotate: Math.random() * 360,
    }));
    setPieces(batch);
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, [trigger]);

  if (!visible) return null;

  return (
    <>
      <style>{`
        @keyframes th-confetti-fall {
          0%   { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          overflow: "hidden",
          zIndex: 9999,
        }}
      >
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              position: "absolute",
              top: 0,
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.5,
              background: p.color,
              borderRadius: 2,
              transform: `rotate(${p.rotate}deg)`,
              animation: `th-confetti-fall ${p.duration}s ease-in ${p.delay}s forwards`,
            }}
          />
        ))}
      </div>
    </>
  );
}
