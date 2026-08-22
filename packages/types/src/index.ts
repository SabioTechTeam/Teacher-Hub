export type GradeBand = 4 | 5 | 6;
export type SkillId = string;
export interface StudentSession { studentId: string; gradeLevel?: GradeBand; gapSkill?: SkillId; strategy?: string; }
export interface QuizQuestion { id: string; skillId: SkillId; prompt: string; choices: string[]; correctIndex: number; }
export interface QuizResult { scores: Record<string, number>; gapSkill: SkillId; gradeLevel: GradeBand; }
export interface WorksheetItem { id: string; prompt: string; answer: string; }
export interface Worksheet { id: string; skillId: SkillId; items: WorksheetItem[]; }
export interface AttemptResult { worksheetId: string; score: number; nextGradeLevel: GradeBand; }
