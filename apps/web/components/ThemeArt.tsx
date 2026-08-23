"use client";

import type { ThemeStyle } from "../lib/themeStyle";

/**
 * Decorative scene for the worksheet header — one per interest theme.
 *
 * Pure inline SVG, no dependencies, and marked aria-hidden: it carries no
 * information, so a screen reader should skip straight to the heading. The
 * child's theme is already announced in text next to it.
 */
export default function ThemeArt({ theme, height = 68 }: { theme: ThemeStyle; height?: number }) {
  const a = theme.accent;
  const s = theme.edge;

  const scenes: Record<string, JSX.Element> = {
    space: (
      <g>
        <circle cx="24" cy="20" r="3" fill={s} />
        <circle cx="58" cy="12" r="2" fill={s} />
        <circle cx="96" cy="26" r="2.5" fill={s} />
        <path d="M42 56 C42 36 52 26 60 22 C68 26 78 36 78 56 Z" fill={a} />
        <circle cx="60" cy="38" r="6" fill="#fff" />
        <path d="M42 56 L34 62 L46 60 Z M78 56 L86 62 L74 60 Z" fill={s} />
        <path d="M56 58 q4 10 8 0" stroke={a} strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    ),
    dinosaurs: (
      <g>
        <path d="M28 58 q4-22 22-24 q14-2 20 8 q10 2 12 12 l-6 4 q-2-8-10-8 q-6 8-18 8 q-12 0-16 0 Z" fill={a} />
        <circle cx="66" cy="40" r="2.4" fill="#fff" />
        <path d="M34 58 l-4 6 M46 58 l-2 6 M62 54 l4 8" stroke={a} strokeWidth="4" strokeLinecap="round" />
        <path d="M40 36 l4-6 l4 6 M50 32 l4-6 l4 6" fill={s} />
      </g>
    ),
    videogames: (
      <g>
        <rect x="28" y="30" width="64" height="30" rx="14" fill={a} />
        <rect x="38" y="41" width="12" height="4" rx="2" fill="#fff" />
        <rect x="42" y="37" width="4" height="12" rx="2" fill="#fff" />
        <circle cx="74" cy="41" r="3.4" fill="#fff" />
        <circle cx="82" cy="48" r="3.4" fill="#fff" />
        <path d="M52 22 l3 6 6 1 -4.5 4 1 6 -5.5-3 -5.5 3 1-6 -4.5-4 6-1 Z" fill={s} />
      </g>
    ),
    soccer: (
      <g>
        <circle cx="60" cy="42" r="18" fill="#fff" stroke={a} strokeWidth="3" />
        <path d="M60 30 l7 5 -2.7 8h-8.6L53 35 Z" fill={a} />
        <path d="M42 42h-8 M78 42h8" stroke={s} strokeWidth="4" strokeLinecap="round" />
        <rect x="26" y="56" width="68" height="4" rx="2" fill={s} />
      </g>
    ),
    basketball: (
      <g>
        <circle cx="60" cy="42" r="18" fill={a} />
        <path d="M42 42h36 M60 24v36 M46 29c9 8 9 18 0 26 M74 29c-9 8-9 18 0 26"
          stroke="#fff" strokeWidth="2" fill="none" />
        <rect x="26" y="60" width="68" height="4" rx="2" fill={s} />
      </g>
    ),
    robotics: (
      <g>
        <rect x="40" y="28" width="40" height="32" rx="8" fill={a} />
        <circle cx="52" cy="42" r="4" fill="#fff" />
        <circle cx="68" cy="42" r="4" fill="#fff" />
        <rect x="52" y="51" width="16" height="3" rx="1.5" fill="#fff" />
        <path d="M60 28v-8 M60 20a3 3 0 1 1 0-.1" stroke={a} strokeWidth="3" fill="none" />
        <rect x="30" y="38" width="8" height="12" rx="3" fill={s} />
        <rect x="82" y="38" width="8" height="12" rx="3" fill={s} />
      </g>
    ),
    minecraft: (
      <g>
        <rect x="34" y="44" width="18" height="18" fill={a} />
        <rect x="52" y="44" width="18" height="18" fill={s} />
        <rect x="70" y="44" width="18" height="18" fill={a} />
        <rect x="43" y="26" width="18" height="18" fill={s} />
        <rect x="61" y="26" width="18" height="18" fill={a} />
      </g>
    ),
    neutral: (
      <g>
        <rect x="36" y="26" width="48" height="34" rx="6" fill="#fff" stroke={a} strokeWidth="3" />
        <path d="M44 38h32 M44 46h22" stroke={s} strokeWidth="4" strokeLinecap="round" />
        <path d="M84 26 l10-8 6 6 -10 8 Z" fill={a} />
      </g>
    ),
  };

  return (
    <svg viewBox="0 0 120 70" height={height} aria-hidden="true" focusable="false"
      style={{ display: "block", flexShrink: 0 }}>
      {scenes[theme.id] ?? scenes.neutral}
    </svg>
  );
}
