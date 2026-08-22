/**
 * Student session in localStorage. Role 1 owns this object; this is a minimal
 * safe implementation so the worksheet flow works before the shell lands.
 * Shape matches StudentSession in packages/types.
 */
export type StudentSession = {
  studentId: string;
  gradeLevel?: 4 | 5 | 6;
  gapSkill?: string;
  strategy?: string;
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
