/**
 * Student session in localStorage.
 * Grade levels 1 through 6 supported.
 */
export type StudentSession = {
  studentId: string;
  gradeLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  gapSkill?: string;
  strategy?: string;
  /** Interest theme ids chosen by the parent in /parent/dashboard.
   *  Drives the word-problem context of generated worksheets. */
  interests?: string[];
};

const KEY = "teacherhub.session";

export function getSession(): StudentSession {
  const fallback: StudentSession = { studentId: "demo" };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.studentId === "string" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function setSession(patch: Partial<StudentSession>): StudentSession {
  const next = { ...getSession(), ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode / storage disabled — flow still works, just not remembered */
  }
  return next;
}
