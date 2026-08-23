/** Local mirror of packages/types for the web app. Keep in sync. */
export type Item = {
  id: string;
  skill_id: string;
  type: string;
  prompt: string;
  choices?: string[] | null;
  difficulty?: number;
  hint?: string;
};

export type Worksheet = {
  id: string;
  student_id: string;
  grade_level: 1 | 2 | 3 | 4 | 5 | 6;
  target_skill: string;
  skill_name: string;
  standards: string[];
  strategy: string;
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
