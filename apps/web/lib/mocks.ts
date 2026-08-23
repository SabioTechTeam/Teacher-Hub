/**
 * mocks.ts — in-browser mock layer for NEXT_PUBLIC_USE_MOCKS=true
 * Types are inlined here so this file has zero external dependencies.
 */

// ---------------------------------------------------------------------------
// Shared types (mirrors packages/types/src/index.ts)
// ---------------------------------------------------------------------------
export type GradeBand = 1 | 2 | 3 | 4 | 5 | 6;
export type SkillId   = string;

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

export interface WorksheetItem { id: string; prompt: string; answer: string; }
export interface Worksheet     { id: string; skillId: SkillId; items: WorksheetItem[]; }
export interface AttemptResult { worksheetId: string; score: number; nextGradeLevel: GradeBand; }

export interface StudentRecord {
  id: string;
  name: string;
  gradeLevel: GradeBand;
  mastery: Record<SkillId, number>;
  gapSkill: SkillId;
  strategy: string;
  sessionsCompleted: number;
}

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------
const STUDENTS: Record<string, StudentRecord> = {
  "stu-001": { id: "stu-001", name: "Aiden Torres",   gradeLevel: 4, mastery: { "math.4.fractions.parts": 0.85, "math.4.fractions.equivalent": 0.60, "math.5.fractions.compare": 0.30, "math.5.fractions.add-like": 0.10, "math.6.ratios.intro": 0.0 },  gapSkill: "math.4.fractions.equivalent", strategy: "visual", sessionsCompleted: 3  },
  "stu-002": { id: "stu-002", name: "Maya Patel",     gradeLevel: 5, mastery: { "math.4.fractions.parts": 0.95, "math.4.fractions.equivalent": 0.88, "math.5.fractions.compare": 0.72, "math.5.fractions.add-like": 0.45, "math.6.ratios.intro": 0.15 }, gapSkill: "math.5.fractions.add-like",   strategy: "steps",  sessionsCompleted: 7  },
  "stu-003": { id: "stu-003", name: "Liam Nguyen",    gradeLevel: 5, mastery: { "math.4.fractions.parts": 0.70, "math.4.fractions.equivalent": 0.50, "math.5.fractions.compare": 0.20, "math.5.fractions.add-like": 0.0,  "math.6.ratios.intro": 0.0 },  gapSkill: "math.4.fractions.equivalent", strategy: "story",  sessionsCompleted: 2  },
  "stu-004": { id: "stu-004", name: "Sofia Chen",     gradeLevel: 6, mastery: { "math.4.fractions.parts": 0.98, "math.4.fractions.equivalent": 0.95, "math.5.fractions.compare": 0.90, "math.5.fractions.add-like": 0.82, "math.6.ratios.intro": 0.55 }, gapSkill: "math.6.ratios.intro",         strategy: "steps",  sessionsCompleted: 12 },
  "stu-005": { id: "stu-005", name: "Ethan Williams", gradeLevel: 4, mastery: { "math.4.fractions.parts": 0.40, "math.4.fractions.equivalent": 0.20, "math.5.fractions.compare": 0.0,  "math.5.fractions.add-like": 0.0,  "math.6.ratios.intro": 0.0 },  gapSkill: "math.4.fractions.parts",      strategy: "visual", sessionsCompleted: 1  },
};

const QUESTIONS: QuizQuestion[] = [
  { id: "q-parts-01",   skillId: "math.4.fractions.parts",      prompt: "A pizza is cut into 4 equal slices. You eat 1 slice. What fraction did you eat?",                        choices: ["1/2","1/4","2/4","3/4"], correctIndex: 1 },
  { id: "q-parts-02",   skillId: "math.4.fractions.parts",      prompt: "Which picture shows 3/8 of a shape shaded?",                                                               choices: ["8 parts, 5 shaded","8 parts, 3 shaded","3 parts, 1 shaded","8 parts, 8 shaded"], correctIndex: 1 },
  { id: "q-parts-03",   skillId: "math.4.fractions.parts",      prompt: "What is the denominator in 5/6?",                                                                          choices: ["5","6","1","11"], correctIndex: 1 },
  { id: "q-equiv-01",   skillId: "math.4.fractions.equivalent", prompt: "Which fraction is equivalent to 1/2?",                                                                     choices: ["2/6","3/6","4/6","2/8"], correctIndex: 1 },
  { id: "q-equiv-02",   skillId: "math.4.fractions.equivalent", prompt: "Fill in the blank: 2/3 = __/9",                                                                            choices: ["3","4","5","6"], correctIndex: 3 },
  { id: "q-equiv-03",   skillId: "math.4.fractions.equivalent", prompt: "Are 4/8 and 1/2 equivalent fractions?",                                                                    choices: ["Yes, 4÷4=1 and 8÷4=2","No, they are different","Yes, only on a number line","No, numerators differ"], correctIndex: 0 },
  { id: "q-compare-01", skillId: "math.5.fractions.compare",    prompt: "Which fraction is greater: 3/4 or 2/3?",                                                                   choices: ["2/3","3/4","They are equal","Cannot be determined"], correctIndex: 1 },
  { id: "q-compare-02", skillId: "math.5.fractions.compare",    prompt: "Order from least to greatest: 1/2, 3/8, 5/6",                                                             choices: ["1/2, 3/8, 5/6","3/8, 5/6, 1/2","3/8, 1/2, 5/6","5/6, 1/2, 3/8"], correctIndex: 2 },
  { id: "q-compare-03", skillId: "math.5.fractions.compare",    prompt: "Compare: 5/8 ___ 7/12",                                                                                    choices: ["5/8 < 7/12","5/8 > 7/12","5/8 = 7/12","Cannot compare"], correctIndex: 1 },
  { id: "q-addlike-01", skillId: "math.5.fractions.add-like",   prompt: "What is 2/7 + 3/7?",                                                                                       choices: ["5/14","5/7","6/7","1/7"], correctIndex: 1 },
  { id: "q-addlike-02", skillId: "math.5.fractions.add-like",   prompt: "Maria ate 1/5 of a cake Monday and 2/5 Tuesday. Total?",                                                   choices: ["2/10","3/5","3/10","1/2"], correctIndex: 1 },
  { id: "q-addlike-03", skillId: "math.5.fractions.add-like",   prompt: "What is 4/9 + 4/9?",                                                                                       choices: ["8/18","8/9","1","4/9"], correctIndex: 1 },
  { id: "q-ratios-01",  skillId: "math.6.ratios.intro",         prompt: "3 red marbles, 5 blue marbles. Ratio of red to blue?",                                                     choices: ["5:3","3:8","3:5","8:3"], correctIndex: 2 },
  { id: "q-ratios-02",  skillId: "math.6.ratios.intro",         prompt: "Recipe: 2 cups flour per 1 cup sugar. With 6 cups flour, how much sugar?",                                 choices: ["2","3","4","6"], correctIndex: 1 },
  { id: "q-ratios-03",  skillId: "math.6.ratios.intro",         prompt: "Which ratio is equivalent to 4:6?",                                                                        choices: ["1:2","2:3","3:4","6:4"], correctIndex: 1 },
];

const QUESTIONS_BY_SKILL = QUESTIONS.reduce<Record<SkillId, QuizQuestion[]>>((acc, q) => {
  (acc[q.skillId] ??= []).push(q);
  return acc;
}, {});

type ExtWorksheet = Worksheet & { strategy: string; title: string };

const WORKSHEETS: Record<string, ExtWorksheet> = {
  "ws-parts-visual":   { id: "ws-parts-visual",   skillId: "math.4.fractions.parts",      strategy: "visual", title: "Parts of a Whole — Picture It",               items: [{ id: "ws-parts-visual-01",   prompt: "A chocolate bar has 6 pieces. Color 2. Write the fraction colored.", answer: "2/6" }, { id: "ws-parts-visual-02", prompt: "Circle divided into 8 slices, 3 shaded. Fraction shaded?", answer: "3/8" }, { id: "ws-parts-visual-03", prompt: "Divide rectangle into 4 parts, shade 1. Fraction shaded?", answer: "1/4" }, { id: "ws-parts-visual-04", prompt: "Strip cut into 5 sections, 4 are red. Fraction red?", answer: "4/5" }] },
  "ws-parts-story":    { id: "ws-parts-story",    skillId: "math.4.fractions.parts",      strategy: "story",  title: "Parts of a Whole — Story Problems",            items: [{ id: "ws-parts-story-01",   prompt: "Zara cut a pie into 8 slices, gave 3 away. Fraction given away?", answer: "3/8" }, { id: "ws-parts-story-02", prompt: "Class of 10 students, 4 wear blue shirts. Fraction in blue?", answer: "4/10" }, { id: "ws-parts-story-03", prompt: "Garden with 6 sections, tomatoes in 2. Fraction with tomatoes?", answer: "2/6" }, { id: "ws-parts-story-04", prompt: "Box of 12 crayons, 7 broken. Fraction broken?", answer: "7/12" }] },
  "ws-equiv-visual":   { id: "ws-equiv-visual",   skillId: "math.4.fractions.equivalent", strategy: "visual", title: "Equivalent Fractions — See the Match",         items: [{ id: "ws-equiv-visual-01",   prompt: "Bar A: 2 parts, 1 shaded. Bar B: 4 parts. How many shaded to match?", answer: "2" }, { id: "ws-equiv-visual-02", prompt: "Fill in: 1/3 = __/9", answer: "3" }, { id: "ws-equiv-visual-03", prompt: "Which are equivalent to 2/4? (1/2, 3/6, 4/6, 4/8)", answer: "1/2, 3/6, 4/8" }, { id: "ws-equiv-visual-04", prompt: "Fill in: 3/4 = __/12", answer: "9" }] },
  "ws-equiv-steps":    { id: "ws-equiv-steps",    skillId: "math.4.fractions.equivalent", strategy: "steps",  title: "Equivalent Fractions — Step by Step",          items: [{ id: "ws-equiv-steps-01",   prompt: "Multiply 1/2 top and bottom by 3. New fraction?", answer: "3/6" }, { id: "ws-equiv-steps-02", prompt: "Is 4/10 equivalent to 2/5? Divide by same number.", answer: "Yes, 4÷2=2 and 10÷2=5" }, { id: "ws-equiv-steps-03", prompt: "Find missing: 5/6 = 10/__", answer: "12" }, { id: "ws-equiv-steps-04", prompt: "Simplify 6/8 to lowest terms.", answer: "3/4" }] },
  "ws-compare-visual": { id: "ws-compare-visual", skillId: "math.5.fractions.compare",    strategy: "visual", title: "Compare Fractions — Number Line",               items: [{ id: "ws-compare-visual-01", prompt: "Plot 1/4 and 3/4 on a number line. Which is greater?", answer: "3/4" }, { id: "ws-compare-visual-02", prompt: "Is 3/8 greater or less than 1/2?", answer: "3/8 < 1/2" }, { id: "ws-compare-visual-03", prompt: "2/3 vs 3/5 — which is greater?", answer: "2/3" }, { id: "ws-compare-visual-04", prompt: "Order from least: 1/2, 2/5, 7/10", answer: "2/5, 1/2, 7/10" }] },
  "ws-compare-steps":  { id: "ws-compare-steps",  skillId: "math.5.fractions.compare",    strategy: "steps",  title: "Compare Fractions — Common Denominator",       items: [{ id: "ws-compare-steps-01",  prompt: "Compare 3/4 and 5/8 using common denominator.", answer: "3/4 > 5/8" }, { id: "ws-compare-steps-02", prompt: "Cross multiply 2/3 vs 3/4. Which is larger?", answer: "3/4 is greater (2×4=8, 3×3=9, so 9>8 means 3/4 > 2/3)" }, { id: "ws-compare-steps-03", prompt: "Which is smaller: 7/12 or 5/8?", answer: "7/12" }, { id: "ws-compare-steps-04", prompt: "Order greatest to least: 3/5, 7/10, 1/2", answer: "7/10, 3/5, 1/2" }] },
  "ws-addlike-steps":  { id: "ws-addlike-steps",  skillId: "math.5.fractions.add-like",   strategy: "steps",  title: "Add Fractions — Like Denominators",            items: [{ id: "ws-addlike-steps-01",  prompt: "3/8 + 2/8 = ?", answer: "5/8" }, { id: "ws-addlike-steps-02", prompt: "5/9 + 1/9 = ? Simplify.", answer: "6/9 = 2/3" }, { id: "ws-addlike-steps-03", prompt: "Jayla walked 2/6 + 3/6 miles. Total?", answer: "5/6" }, { id: "ws-addlike-steps-04", prompt: "4/7 + 6/7 as a mixed number?", answer: "1 and 3/7" }] },
  "ws-addlike-story":  { id: "ws-addlike-story",  skillId: "math.5.fractions.add-like",   strategy: "story",  title: "Add Fractions — Real-World Problems",          items: [{ id: "ws-addlike-story-01",  prompt: "Theo: 2/8 homework before dinner, 5/8 after. Total done?", answer: "7/8" }, { id: "ws-addlike-story-02", prompt: "Tank filled 3/10 morning + 4/10 afternoon. How full?", answer: "7/10" }, { id: "ws-addlike-story-03", prompt: "Friends ate 3/12 + 4/12 pizza. Fraction and slices?", answer: "7/12, which is 7 slices" }, { id: "ws-addlike-story-04", prompt: "Priya read 5/11 + 4/11. Did she finish?", answer: "9/11 — she did not finish the book" }] },
  "ws-ratios-steps":   { id: "ws-ratios-steps",   skillId: "math.6.ratios.intro",         strategy: "steps",  title: "Ratio Concepts — Step by Step",                items: [{ id: "ws-ratios-steps-01",   prompt: "3 bananas to 2 cups milk. Write ratio 3 ways.", answer: "3:2 / 3 to 2 / 3/2" }, { id: "ws-ratios-steps-02", prompt: "12 boys, 15 girls. Simplify ratio.", answer: "4:5" }, { id: "ws-ratios-steps-03", prompt: "Cats:dogs = 2:5, 10 dogs. How many cats?", answer: "4 cats" }, { id: "ws-ratios-steps-04", prompt: "Are 3:4 and 9:12 equivalent?", answer: "Yes — 9:12 simplifies to 3:4 (divide by 3)" }] },
  "ws-ratios-story":   { id: "ws-ratios-story",   skillId: "math.6.ratios.intro",         strategy: "story",  title: "Ratio Concepts — Real-World Stories",          items: [{ id: "ws-ratios-story-01",   prompt: "2 apples per 3 oranges. 8 apples → how many oranges?", answer: "12 oranges" }, { id: "ws-ratios-story-02", prompt: "Car: 150 miles in 3 hours. Speed? Miles in 5 hours?", answer: "50:1 (50 miles per hour); 250 miles in 5 hours" }, { id: "ws-ratios-story-03", prompt: "Almonds:cashews = 3:2, 30 nuts total. How many almonds?", answer: "18 almonds" }, { id: "ws-ratios-story-04", prompt: "Lemonade: 1 lemon : 4 water. With 3 cups lemon?", answer: "12 cups of water" }] },
};

// ---------------------------------------------------------------------------
// Counter for ephemeral IDs
// ---------------------------------------------------------------------------
let _counter = 100;
const nextId = (prefix: string) => `${prefix}-mock-${++_counter}`;

// ---------------------------------------------------------------------------
// Exported mock functions
// ---------------------------------------------------------------------------

export async function mockGetStudents(): Promise<StudentRecord[]> {
  return Object.values(STUDENTS);
}

export async function mockGetStudent(studentId: string): Promise<StudentRecord> {
  const s = STUDENTS[studentId];
  if (!s) throw new Error(`Student '${studentId}' not found`);
  return s;
}

export async function mockGetMastery(studentId: string) {
  const s = STUDENTS[studentId];
  if (!s) throw new Error(`Student '${studentId}' not found`);
  return { studentId, mastery: { ...s.mastery } };
}

export async function mockStartAssessment(studentId = "demo") {
  const student = STUDENTS[studentId];
  const gapSkill = student?.gapSkill ?? "math.5.fractions.compare";
  const qs: QuizQuestion[] = [...(QUESTIONS_BY_SKILL[gapSkill] ?? [])];
  for (const sq of Object.values(QUESTIONS_BY_SKILL)) {
    for (const q of sq) {
      if (!qs.find((e) => e.id === q.id)) qs.push(q);
      if (qs.length >= 9) break;
    }
    if (qs.length >= 9) break;
  }
  return { assessmentId: nextId("asmt"), studentId, questions: qs.slice(0, 9) };
}

export async function mockGetAssessmentResults(assessmentId: string, studentId = "demo"): Promise<QuizResult> {
  const SEEDED: Record<string, QuizResult> = {
    "asmt-001": { scores: { "math.4.fractions.parts": 0.85, "math.4.fractions.equivalent": 0.60, "math.5.fractions.compare": 0.30 }, gapSkill: "math.4.fractions.equivalent", gradeLevel: 4 },
    "asmt-002": { scores: { "math.4.fractions.parts": 0.95, "math.4.fractions.equivalent": 0.88, "math.5.fractions.compare": 0.72, "math.5.fractions.add-like": 0.45 }, gapSkill: "math.5.fractions.add-like", gradeLevel: 5 },
    "asmt-003": { scores: { "math.4.fractions.parts": 0.70, "math.4.fractions.equivalent": 0.50, "math.5.fractions.compare": 0.20 }, gapSkill: "math.4.fractions.equivalent", gradeLevel: 5 },
    "asmt-004": { scores: { "math.4.fractions.parts": 0.98, "math.4.fractions.equivalent": 0.95, "math.5.fractions.compare": 0.90, "math.5.fractions.add-like": 0.82, "math.6.ratios.intro": 0.55 }, gapSkill: "math.6.ratios.intro", gradeLevel: 6 },
  };
  if (SEEDED[assessmentId]) return SEEDED[assessmentId];
  const s = STUDENTS[studentId];
  return { scores: s?.mastery ?? {}, gapSkill: (s?.gapSkill ?? "math.5.fractions.compare") as SkillId, gradeLevel: (s?.gradeLevel ?? 5) as GradeBand };
}

export async function mockGenerateWorksheet(studentId: string, skillId?: SkillId, strategy?: string): Promise<ExtWorksheet> {
  const s = STUDENTS[studentId];
  const sk = skillId ?? s?.gapSkill ?? "math.5.fractions.compare";
  const st = strategy ?? s?.strategy ?? "visual";
  return (
    Object.values(WORKSHEETS).find((w) => w.skillId === sk && w.strategy === st) ??
    Object.values(WORKSHEETS).find((w) => w.skillId === sk) ??
    Object.values(WORKSHEETS)[0]
  );
}

export async function mockGradeWorksheet(worksheetId: string, studentId: string, answers: { itemId: string; answer: string }[]): Promise<AttemptResult & { score: number; correct: number; total: number }> {
  const ws = WORKSHEETS[worksheetId];
  if (!ws) throw new Error(`Worksheet '${worksheetId}' not found`);
  const map = Object.fromEntries(ws.items.map((i) => [i.id, i.answer]));
  let correct = 0;
  for (const a of answers) if (map[a.itemId]?.trim().toLowerCase() === a.answer.trim().toLowerCase()) correct++;
  const total = ws.items.length;
  const score = total ? Math.round((correct / total) * 100) / 100 : 0;
  const s = STUDENTS[studentId];
  const cur = s?.gradeLevel ?? 5;
  const nextGradeLevel = (score >= 0.8 && cur < 6 ? cur + 1 : cur) as GradeBand;
  if (s) { const c = s.mastery[ws.skillId] ?? 0.5; s.mastery[ws.skillId] = Math.round((c + 0.2 * ((score >= 0.5 ? 1 : 0) - c)) * 10000) / 10000; }
  return { worksheetId, score, correct, total, nextGradeLevel };
}

export async function mockGetQuestions(skillId?: SkillId): Promise<QuizQuestion[]> {
  return skillId ? QUESTIONS.filter((q) => q.skillId === skillId) : [...QUESTIONS];
}

export async function mockGetHistory(studentId: string) {
  const HISTORY: Record<string, unknown[]> = {
    "stu-001": [{ date: "2026-08-18", attemptIds: ["att-001"], masterySnapshot: { "math.4.fractions.parts": 0.60, "math.4.fractions.equivalent": 0.50 } }, { date: "2026-08-19", attemptIds: ["att-002"], masterySnapshot: { "math.4.fractions.parts": 0.68 } }, { date: "2026-08-20", assessmentId: "asmt-001", attemptIds: ["att-003"], masterySnapshot: { "math.4.fractions.parts": 0.85 } }],
    "stu-002": [{ date: "2026-08-15", attemptIds: ["att-004"] }, { date: "2026-08-17", attemptIds: ["att-005"] }, { date: "2026-08-19", attemptIds: ["att-006"] }, { date: "2026-08-21", assessmentId: "asmt-002", attemptIds: [] }],
    "stu-003": [{ date: "2026-08-21", assessmentId: "asmt-003", attemptIds: ["att-007"] }],
    "stu-004": [{ date: "2026-08-20", attemptIds: ["att-008"] }, { date: "2026-08-21", attemptIds: ["att-009"] }, { date: "2026-08-22", assessmentId: "asmt-004", attemptIds: [] }],
    "stu-005": [{ date: "2026-08-22", assessmentId: "asmt-005", attemptIds: ["att-010"] }],
  };
  return { studentId, sessions: HISTORY[studentId] ?? [] };
}
