// Shared contracts for Teacher-Hub. UI, API, and agent all speak these shapes.
export type GradeBand = 4 | 5 | 6;
export type SkillId = string;

export interface StudentSession {
  studentId: string;
  gradeLevel?: GradeBand;
  gapSkill?: SkillId;
  strategy?: string;
}

export interface QuizQuestion {
  id: string;
  skillId: SkillId;
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface QuizResult {
  scores: Record<string, number>;
  gapSkill: SkillId;
  gradeLevel: GradeBand;
}

// ---------- Worksheet (the "homework") ----------
export type ItemType = "numeric" | "fraction" | "multiple_choice";

export interface WorksheetItem {
  id: string;
  skillId: SkillId;
  type: ItemType;
  prompt: string;
  choices?: string[];
  /** Canonical answer key. Grading is deterministic against this. */
  answer: string;
  difficulty: number; // 0..1
  hint?: string;
  explanation?: string;
  /** Arithmetic expression proving the answer. Verified server-side before the item ships. */
  check?: string;
}

export interface Worksheet {
  id: string;
  studentId: string;
  gradeLevel: GradeBand;
  targetSkill: SkillId;
  skillName: string;
  standards: string[];
  strategy: string;
  items: WorksheetItem[];
  generatedAt: string;
  source: "llm" | "mock";
}

// ---------- Grading + adapt ----------
export interface ItemAttempt {
  itemId: string;
  response: string;
}

export interface ItemGrade {
  itemId: string;
  skillId: SkillId;
  correct: boolean;
  expected: string;
  got: string;
  explanation?: string;
}

export type AdaptDecision = "advance" | "hold" | "remediate";

export interface AttemptResult {
  worksheetId: string;
  studentId: string;
  score: number; // 0..1
  grades: ItemGrade[];
  masteryBefore: Record<SkillId, number>;
  masteryAfter: Record<SkillId, number>;
  decision: AdaptDecision;
  nextTargetSkill: SkillId;
  nextGradeLevel: GradeBand;
  rationale: string;
}
