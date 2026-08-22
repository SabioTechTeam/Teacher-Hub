/**
 * api.ts — HTTP client with mock-mode switch.
 * Set NEXT_PUBLIC_USE_MOCKS=true to bypass the network entirely.
 */
import {
  mockGetStudents, mockGetStudent, mockGetMastery, mockStartAssessment,
  mockGetAssessmentResults, mockGenerateWorksheet, mockGradeWorksheet,
  mockGetQuestions, mockGetHistory,
  type StudentRecord, type QuizQuestion, type QuizResult,
  type SkillId,
} from "./mocks";

const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function getStudents(): Promise<StudentRecord[]> {
  return USE_MOCKS ? mockGetStudents() : get("/students");
}

export async function getStudent(studentId: string): Promise<StudentRecord> {
  return USE_MOCKS ? mockGetStudent(studentId) : get(`/students/${studentId}`);
}

export async function getMastery(studentId: string) {
  return USE_MOCKS ? mockGetMastery(studentId) : get(`/students/${studentId}/mastery`);
}

export async function getHistory(studentId: string) {
  return USE_MOCKS ? mockGetHistory(studentId) : get(`/students/${studentId}/history`);
}

export async function startAssessment(studentId = "demo") {
  return USE_MOCKS ? mockStartAssessment(studentId) : post(`/assessments/start?student_id=${encodeURIComponent(studentId)}`, {});
}

export async function submitAnswer(assessmentId: string, questionId: string, answer: unknown) {
  if (USE_MOCKS) return { assessmentId, recorded: { questionId, answer } };
  return post(`/assessments/${assessmentId}/answer`, { question_id: questionId, answer });
}

export async function getAssessmentResults(assessmentId: string, studentId?: string): Promise<QuizResult> {
  return USE_MOCKS ? mockGetAssessmentResults(assessmentId, studentId) : get(`/assessments/${assessmentId}/results`);
}

export async function generateWorksheet(studentId: string, skillId?: SkillId, strategy?: string) {
  return USE_MOCKS ? mockGenerateWorksheet(studentId, skillId, strategy) : post("/worksheets/generate", { student_id: studentId, skill_id: skillId, strategy });
}

export async function gradeWorksheet(worksheetId: string, studentId: string, answers: { itemId: string; answer: string }[]) {
  return USE_MOCKS ? mockGradeWorksheet(worksheetId, studentId, answers) : post("/worksheets/grade", { worksheet_id: worksheetId, student_id: studentId, answers: answers.map((a) => ({ item_id: a.itemId, answer: a.answer })) });
}

export async function getQuestions(skillId?: SkillId): Promise<QuizQuestion[]> {
  return USE_MOCKS ? mockGetQuestions(skillId) : get(skillId ? `/questions?skill_id=${encodeURIComponent(skillId)}` : "/questions");
}

// Raw helpers for one-off use
export { get as apiGet, post as apiPost };
