/**
 * Mock payloads so the worksheet flow is clickable with NO API and NO LLM.
 * Enabled by NEXT_PUBLIC_USE_MOCKS=true (see .env.example).
 *
 * Shapes are byte-for-byte what services/api returns, so swapping to the real
 * API is a flag flip, not a rewrite. Answer keys live here ONLY in mock mode —
 * the real API strips them before anything reaches the browser.
 */
import type { Worksheet, Result } from "./types";

const SKILLS: Record<string, { name: string; grade: 1 | 2 | 3 | 4 | 5 | 6; standards: string[]; next: string; prev: string }> = {
  "math.1.addsub.within20": { name: "Addition & Subtraction within 20", grade: 1, standards: ["1.OA.C.6"], next: "math.2.placevalue.twodigit", prev: "math.1.addsub.within20" },
  "math.2.placevalue.twodigit": { name: "Two-Digit Operations & Place Value", grade: 2, standards: ["2.NBT.B.5"], next: "math.3.mult.intro", prev: "math.1.addsub.within20" },
  "math.3.mult.intro": { name: "Multiplication & Division Fundamentals", grade: 3, standards: ["3.OA.A.1"], next: "math.4.fractions.parts", prev: "math.2.placevalue.twodigit" },
  "math.4.fractions.parts": { name: "Parts of a Whole", grade: 4, standards: ["4.NF.A.1"], next: "math.4.fractions.equivalent", prev: "math.3.mult.intro" },
  "math.4.fractions.equivalent": { name: "Equivalent Fractions", grade: 4, standards: ["4.NF.A.1"], next: "math.5.fractions.compare", prev: "math.4.fractions.parts" },
  "math.5.fractions.compare": { name: "Compare Fractions", grade: 5, standards: ["5.NF.A.1"], next: "math.5.fractions.add-like", prev: "math.4.fractions.equivalent" },
  "math.5.fractions.add-like": { name: "Add Fractions (Like Denominators)", grade: 5, standards: ["5.NF.A.1"], next: "math.6.ratios.intro", prev: "math.5.fractions.compare" },
  "math.6.ratios.intro": { name: "Ratio Concepts", grade: 6, standards: ["6.RP.A.1"], next: "math.6.ratios.intro", prev: "math.5.fractions.compare" },
};

const BANK: Record<string, { prompt: string; answer: string }[]> = {
  "math.1.addsub.within20": [
    { prompt: "What is 7 + 8?", answer: "15" },
    { prompt: "What is 14 - 6?", answer: "8" },
    { prompt: "What is 9 + 5?", answer: "14" },
    { prompt: "What is 16 - 9?", answer: "7" },
    { prompt: "What is 8 + 4?", answer: "12" },
    { prompt: "What is 13 - 5?", answer: "8" },
  ],
  "math.2.placevalue.twodigit": [
    { prompt: "What is 36 + 28?", answer: "64" },
    { prompt: "What is 52 - 19?", answer: "33" },
    { prompt: "What is 45 + 37?", answer: "82" },
    { prompt: "What is 71 - 34?", answer: "37" },
    { prompt: "What is 29 + 43?", answer: "72" },
    { prompt: "What is 80 - 45?", answer: "35" },
  ],
  "math.3.mult.intro": [
    { prompt: "What is 6 × 8?", answer: "48" },
    { prompt: "What is 35 ÷ 5?", answer: "7" },
    { prompt: "What is 7 × 9?", answer: "63" },
    { prompt: "What is 42 ÷ 6?", answer: "7" },
    { prompt: "What is 8 × 4?", answer: "32" },
    { prompt: "What is 54 ÷ 9?", answer: "6" },
  ],
  "math.4.fractions.parts": [
    { prompt: "A pizza is cut into 8 equal slices. You eat 3. What fraction did you eat?", answer: "3/8" },
    { prompt: "A chocolate bar has 5 equal pieces. You take 2. What fraction did you take?", answer: "2/5" },
    { prompt: "A ribbon is cut into 6 equal parts. You use 1. What fraction did you use?", answer: "1/6" },
    { prompt: "A cake is cut into 4 equal slices. You eat 3. What fraction did you eat?", answer: "3/4" },
    { prompt: "A pie has 10 equal slices. You take 7. What fraction did you take?", answer: "7/10" },
    { prompt: "A sandwich is cut into 3 equal parts. You eat 2. What fraction did you eat?", answer: "2/3" },
  ],
  "math.4.fractions.equivalent": [
    { prompt: "Fill in the blank: 1/2 = ___/8", answer: "4" },
    { prompt: "Fill in the blank: 2/3 = ___/9", answer: "6" },
    { prompt: "Fill in the blank: 3/4 = ___/12", answer: "9" },
    { prompt: "Fill in the blank: 1/5 = ___/20", answer: "4" },
    { prompt: "Fill in the blank: 5/6 = ___/18", answer: "15" },
    { prompt: "Fill in the blank: 2/7 = ___/21", answer: "6" },
  ],
  "math.5.fractions.compare": [
    { prompt: "Which is larger, 1/3 or 1/2? Answer with the larger fraction.", answer: "1/2" },
    { prompt: "Which is larger, 3/4 or 2/3? Answer with the larger fraction.", answer: "3/4" },
    { prompt: "Which is larger, 5/8 or 1/2? Answer with the larger fraction.", answer: "5/8" },
    { prompt: "Which is larger, 2/5 or 3/10? Answer with the larger fraction.", answer: "2/5" },
    { prompt: "Which is larger, 4/9 or 1/2? Answer with the larger fraction.", answer: "1/2" },
    { prompt: "Which is larger, 7/8 or 5/6? Answer with the larger fraction.", answer: "7/8" },
  ],
  "math.5.fractions.add-like": [
    { prompt: "2/7 + 3/7 = ?", answer: "5/7" },
    { prompt: "1/5 + 3/5 = ?", answer: "4/5" },
    { prompt: "3/8 + 4/8 = ?", answer: "7/8" },
    { prompt: "5/9 + 2/9 = ?", answer: "7/9" },
    { prompt: "2/6 + 3/6 = ?", answer: "5/6" },
    { prompt: "4/11 + 5/11 = ?", answer: "9/11" },
  ],
  "math.6.ratios.intro": [
    { prompt: "A recipe uses 3 cups of flour for 4 cups of milk. Write the ratio as a fraction.", answer: "3/4" },
    { prompt: "There are 2 cats for every 5 dogs. Write the ratio of cats to dogs as a fraction.", answer: "2/5" },
    { prompt: "A team wins 6 games and plays 9. Write wins to games as a fraction.", answer: "2/3" },
    { prompt: "5 red marbles, 8 blue marbles. Write red to blue as a fraction.", answer: "5/8" },
    { prompt: "A map shows 4 cm for 7 km. Write the ratio as a fraction.", answer: "4/7" },
    { prompt: "3 pencils cost the same as 2 pens. Write pencils to pens as a fraction.", answer: "3/2" },
  ],
};

const keys = new Map<string, Record<string, string>>();

export function mockWorksheet(studentId: string, skillId: string): Worksheet {
  const skill = SKILLS[skillId] ? skillId : "math.5.fractions.compare";
  const meta = SKILLS[skill];
  const id = `w-mock-${Math.random().toString(36).slice(2, 10)}`;
  const items = BANK[skill].map((q, n) => ({
    id: `${id}-i${n}`,
    skill_id: skill,
    type: "fraction",
    prompt: q.prompt,
    difficulty: 0.4,
    hint: "Work it out one step at a time.",
  }));
  keys.set(id, Object.fromEntries(BANK[skill].map((q, n) => [`${id}-i${n}`, q.answer])));
  return {
    id,
    student_id: studentId,
    grade_level: meta.grade,
    target_skill: skill,
    skill_name: meta.name,
    standards: meta.standards,
    strategy: "worked_example",
    source: "mock",
    generated_at: new Date().toISOString(),
    items,
  };
}

/** Fraction-aware comparison so 3/4, 0.75 and 6/8 all match. Mirrors mathcheck.py. */
function toNumber(s: string): number | null {
  const t = (s ?? "").trim();
  if (!t) return null;
  const mixed = t.match(/^(-?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const w = Number(mixed[1]), n = Number(mixed[2]), d = Number(mixed[3]);
    if (!d) return null;
    return w < 0 ? w - n / d : w + n / d;
  }
  const frac = t.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d ? Number(frac[1]) / d : null;
  }
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function matches(expected: string, got: string): boolean {
  const e = toNumber(expected), g = toNumber(got);
  if (e !== null && g !== null) return Math.abs(e - g) < 1e-9;
  return expected.trim().toLowerCase() === (got ?? "").trim().toLowerCase();
}

export function mockGrade(ws: Worksheet, answers: Record<string, string>): Result {
  const key = keys.get(ws.id) ?? {};
  const grades = ws.items.map((it) => {
    const expected = key[it.id] ?? "";
    return {
      item_id: it.id,
      skill_id: it.skill_id,
      correct: matches(expected, answers[it.id] ?? ""),
      expected,
      got: answers[it.id] ?? "",
    };
  });
  const score = grades.length ? grades.filter((g) => g.correct).length / grades.length : 0;
  const meta = SKILLS[ws.target_skill];

  let decision: Result["decision"] = "hold";
  let nextSkill = ws.target_skill;
  let rationale = `Scored ${Math.round(score * 100)}% on ${meta.name}. Staying on this skill for another set.`;
  if (score >= 0.8 && meta.next !== ws.target_skill) {
    decision = "advance";
    nextSkill = meta.next;
    rationale = `Scored ${Math.round(score * 100)}% on ${meta.name}. Moving up to ${SKILLS[meta.next].name} (grade ${SKILLS[meta.next].grade}).`;
  } else if (score < 0.5 && meta.prev !== ws.target_skill) {
    decision = "remediate";
    nextSkill = meta.prev;
    rationale = `Scored ${Math.round(score * 100)}% on ${meta.name}. Dropping to prerequisite ${SKILLS[meta.prev].name} (grade ${SKILLS[meta.prev].grade}).`;
  }

  return {
    worksheet_id: ws.id,
    student_id: ws.student_id,
    score,
    grades,
    decision,
    next_target_skill: nextSkill,
    next_grade_level: SKILLS[nextSkill].grade,
    rationale,
    mastery_after: { [ws.target_skill]: Number((0.5 + 0.25 * (score - 0.5)).toFixed(4)) },
  };
}
