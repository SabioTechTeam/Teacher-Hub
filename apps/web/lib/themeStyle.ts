/**
 * Per-theme colour and art, so a worksheet feels like it belongs to one child.
 *
 * Design rule this file exists to enforce: the decoration lives in the CHROME
 * (header, badges, card edges, celebration), never behind the numbers. Busy
 * backgrounds under the maths cost comprehension for exactly the students who
 * need the most support — attention difficulties, and anyone reading in a
 * second language. Every text/background pair below is checked for contrast.
 */

export type ThemeStyle = {
  id: string;
  label: string;
  emoji: string;
  accent: string;   // strong — headings, badges, focus rings
  soft: string;     // tint — card washes, chips
  edge: string;     // borders
  ink: string;      // text ON soft
  cheer: string[];  // in-theme praise
};

export const THEME_STYLES: Record<string, ThemeStyle> = {
  videogames: {
    id: "videogames", label: "Video Games", emoji: "🎮",
    accent: "#7C3AED", soft: "#F5F3FF", edge: "#DDD6FE", ink: "#4C1D95",
    cheer: ["Level up!", "Achievement unlocked!", "New high score!"],
  },
  space: {
    id: "space", label: "Space & Rockets", emoji: "🚀",
    accent: "#2563EB", soft: "#EFF6FF", edge: "#BFDBFE", ink: "#1E3A8A",
    cheer: ["Liftoff!", "You're in orbit!", "Mission control is impressed!"],
  },
  dinosaurs: {
    id: "dinosaurs", label: "Dinosaurs", emoji: "🦖",
    accent: "#15803D", soft: "#F0FDF4", edge: "#BBF7D0", ink: "#14532D",
    cheer: ["Roar-some!", "Prehistoric precision!", "You dug that up!"],
  },
  soccer: {
    id: "soccer", label: "Soccer", emoji: "⚽",
    accent: "#0F766E", soft: "#F0FDFA", edge: "#99F6E4", ink: "#134E4A",
    cheer: ["GOAL!", "Back of the net!", "What a strike!"],
  },
  basketball: {
    id: "basketball", label: "Basketball", emoji: "🏀",
    accent: "#C2410C", soft: "#FFF7ED", edge: "#FED7AA", ink: "#7C2D12",
    cheer: ["Nothing but net!", "Buzzer beater!", "Swish!"],
  },
  robotics: {
    id: "robotics", label: "Robotics & Coding", emoji: "🤖",
    accent: "#0369A1", soft: "#F0F9FF", edge: "#BAE6FD", ink: "#0C4A6E",
    cheer: ["Compiled successfully!", "Zero bugs!", "Systems nominal!"],
  },
  minecraft: {
    id: "minecraft", label: "Building Blocks", emoji: "🧱",
    accent: "#B45309", soft: "#FFFBEB", edge: "#FDE68A", ink: "#78350F",
    cheer: ["Blocks stacked!", "Crafted perfectly!", "Solid build!"],
  },
  neutral: {
    id: "neutral", label: "Everyday", emoji: "✏️",
    accent: "#4F46E5", soft: "#EEF2FF", edge: "#C7D2FE", ink: "#3730A3",
    cheer: ["Great job!", "Well done!", "You got it!"],
  },
};

export function styleFor(themes?: string[] | null): ThemeStyle {
  const first = (themes ?? []).find((t) => t in THEME_STYLES);
  return THEME_STYLES[first ?? "neutral"];
}
