/** Local mirror of packages/types for the web app. Keep in sync. */
export type VisualBar = { num: number | null; den: number; label?: string };

/** Scaffold the UI draws before the abstract arithmetic.
 *  Never contains the answer — see _strip_keys in services/api. */
export type Visual =
  | { kind: "shaded_whole" | "equivalence" | "compare" | "sum"; bars: VisualBar[] }
  | { kind: "ratio"; counts: { n: number; label: string }[] }
  // Grades 1-3
  | { kind: "counters"; groups: { n: number; label: string; removed?: boolean }[] }
  | { kind: "place_value"; numbers: { tens: number; ones: number; label: string }[] }
  | { kind: "array"; rows: number; cols: number; row_label?: string; item_label?: string }
  | { kind: "share"; total: number; groups: number; group_label?: string; item_label?: string };

export type Item = {
  id: string;
  skill_id: string;
  type: string;
  prompt: string;
  choices?: string[] | null;
  difficulty?: number;
  hint?: string;
  visual?: Visual | null;
  theme?: string | null;
  /** "whole" | "fraction" — drives the answer input placeholder. */
  answer_format?: string | null;
};

export type Worksheet = {
  id: string;
  student_id: string;
  grade_level: 1 | 2 | 3 | 4 | 5 | 6;
  target_skill: string;
  skill_name: string;
  standards: string[];
  strategy: string;
  themes?: string[];
  source: "llm" | "mock";
  /** Human-readable provenance: what parent/teacher notes changed here. */
  guidance_applied?: string[];
  hints_up_front?: boolean;
  generated_at: string;
  items: Item[];
};

export type Grade = {
  item_id: string;
  skill_id: string;
  correct: boolean;
  expected: string;
  got: string;
  explanation?: string;
};

export type Result = {
  worksheet_id: string;
  student_id: string;
  score: number;
  grades: Grade[];
  decision: "advance" | "hold" | "remediate";
  next_target_skill: string;
  next_grade_level: 1 | 2 | 3 | 4 | 5 | 6;
  rationale: string;
  mastery_after: Record<string, number>;
};
