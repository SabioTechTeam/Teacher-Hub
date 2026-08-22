"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { setSession } from "@/lib/session";

interface StudentRecord {
  id: string;
  name: string;
  grade: 4 | 5 | 6;
  avg: number;
  gap: string;
  gapName: string;
  standard: string;
  strategy: string;
  sessions: number;
  alert: "struggling" | "at-risk" | null;
  iepAccommodation: string;
  parentNote: string;
  teacherNote: string;
  mastery: Record<string, number>;
  recentAttempts: Array<{
    date: string;
    title: string;
    score: number;
    decision: "advance" | "hold" | "remediate";
  }>;
}

const SKILL_SHORT: Record<string, string> = {
  "math.4.fractions.parts":      "Parts of Whole",
  "math.4.fractions.equivalent": "Equiv. Fractions",
  "math.5.fractions.compare":    "Compare Fractions",
  "math.5.fractions.add-like":   "Add Fractions",
  "math.6.ratios.intro":         "Ratio Concepts",
};

const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: "stu-001",
    name: "Aiden Torres",
    grade: 4,
    avg: 0.37,
    gap: "math.4.fractions.equivalent",
    gapName: "Equivalent Fractions",
    standard: "CCSS 4.NF.1",
    strategy: "visual",
    sessions: 3,
    alert: "struggling",
    iepAccommodation: "Provide visual fraction strips & number lines before abstract equation practice.",
    parentNote: "Aiden enjoys Minecraft & space themes. He responds best when praise is given after each problem.",
    teacherNote: "Struggles with finding common denominators when multiplying numerator/denominator.",
    mastery: {
      "math.4.fractions.parts": 0.85,
      "math.4.fractions.equivalent": 0.37,
      "math.5.fractions.compare": 0.30,
      "math.5.fractions.add-like": 0.10,
      "math.6.ratios.intro": 0.00,
    },
    recentAttempts: [
      { date: "Aug 20", title: "Equivalent Fractions — Match", score: 0.50, decision: "remediate" },
      { date: "Aug 19", title: "Parts of a Whole — Visual", score: 1.00, decision: "advance" },
      { date: "Aug 18", title: "Baseline Diagnostic Quiz", score: 0.40, decision: "hold" },
    ],
  },
  {
    id: "stu-002",
    name: "Maya Patel",
    grade: 5,
    avg: 0.63,
    gap: "math.5.fractions.add-like",
    gapName: "Add Fractions (Like Denominators)",
    standard: "CCSS 4.NF.3",
    strategy: "steps",
    sessions: 7,
    alert: null,
    iepAccommodation: "Standard pacing with graphic organizer for multi-step addition.",
    parentNote: "Maya practices 15 minutes daily after school. She loves puzzles.",
    teacherNote: "Solid conceptual understanding; occasionally makes minor arithmetic calculation errors.",
    mastery: {
      "math.4.fractions.parts": 0.95,
      "math.4.fractions.equivalent": 0.85,
      "math.5.fractions.compare": 0.70,
      "math.5.fractions.add-like": 0.63,
      "math.6.ratios.intro": 0.20,
    },
    recentAttempts: [
      { date: "Aug 21", title: "Adding Like Denominators", score: 0.83, decision: "advance" },
      { date: "Aug 20", title: "Comparing Unlike Fractions", score: 0.75, decision: "hold" },
    ],
  },
  {
    id: "stu-003",
    name: "Liam Nguyen",
    grade: 5,
    avg: 0.28,
    gap: "math.4.fractions.equivalent",
    gapName: "Equivalent Fractions",
    standard: "CCSS 4.NF.1",
    strategy: "story",
    sessions: 2,
    alert: "at-risk",
    iepAccommodation: "Extended time (1.5x) and read-aloud option for word problem prompts.",
    parentNote: "Liam loves sports stats (soccer/basketball).",
    teacherNote: "Needs frequent checks for understanding during independent math rotations.",
    mastery: {
      "math.4.fractions.parts": 0.60,
      "math.4.fractions.equivalent": 0.28,
      "math.5.fractions.compare": 0.20,
      "math.5.fractions.add-like": 0.10,
      "math.6.ratios.intro": 0.00,
    },
    recentAttempts: [
      { date: "Aug 21", title: "Equivalent Fractions Baseline", score: 0.33, decision: "remediate" },
    ],
  },
  {
    id: "stu-004",
    name: "Sofia Chen",
    grade: 6,
    avg: 0.84,
    gap: "math.6.ratios.intro",
    gapName: "Ratio Concepts",
    standard: "CCSS 6.RP.1",
    strategy: "steps",
    sessions: 12,
    alert: null,
    iepAccommodation: "Accelerated pathway; provide extension multi-step problems.",
    parentNote: "Sofia is interested in robotics and science competitions.",
    teacherNote: "Exceeding grade-level expectations; ready for unit rate and proportional reasoning.",
    mastery: {
      "math.4.fractions.parts": 1.00,
      "math.4.fractions.equivalent": 0.95,
      "math.5.fractions.compare": 0.90,
      "math.5.fractions.add-like": 0.85,
      "math.6.ratios.intro": 0.84,
    },
    recentAttempts: [
      { date: "Aug 21", title: "Ratio Word Problems", score: 1.00, decision: "advance" },
      { date: "Aug 20", title: "Unit Rates & Proportions", score: 0.85, decision: "advance" },
    ],
  },
  {
    id: "stu-005",
    name: "Ethan Williams",
    grade: 4,
    avg: 0.12,
    gap: "math.4.fractions.parts",
    gapName: "Parts of a Whole",
    standard: "CCSS 4.NF.1",
    strategy: "visual",
    sessions: 1,
    alert: "at-risk",
    iepAccommodation: "Frequent breaks and concrete manipulatives (fraction circles/tiles).",
    parentNote: "Ethan finds math challenging; benefits greatly from visual encouragement.",
    teacherNote: "Tier 3 intervention candidate. Recommend starting with 1/2 and 1/4 visual models.",
    mastery: {
      "math.4.fractions.parts": 0.20,
      "math.4.fractions.equivalent": 0.10,
      "math.5.fractions.compare": 0.05,
      "math.5.fractions.add-like": 0.00,
      "math.6.ratios.intro": 0.00,
    },
    recentAttempts: [
      { date: "Aug 21", title: "Parts of a Whole Diagnostic", score: 0.20, decision: "remediate" },
    ],
  },
];

const AVATAR_COLORS = ["#4F46E5", "#7C3AED", "#059669", "#EC4899", "#F59E0B"];

const ALERTS = [
  { name: "Ethan Williams",  msg: "Below 20% on 3 skills. Needs intervention.",        color: "#EF4444", bg: "#FFF1F2", dot: "#EF4444" },
  { name: "Liam Nguyen",     msg: "Struggling with Equivalent Fractions since Aug 21.", color: "#F59E0B", bg: "#FFFBEB", dot: "#F59E0B" },
  { name: "Aiden Torres",    msg: "Made progress on Parts of a Whole — keep going!",    color: "#3B82F6", bg: "#EFF6FF", dot: "#3B82F6" },
];

const SKILL_DIST = [
  { label: "Parts of a Whole",   pct: 76, color: "#4F46E5" },
  { label: "Equiv. Fractions",   pct: 63, color: "#7C3AED" },
  { label: "Compare Fractions",  pct: 48, color: "#EC4899" },
  { label: "Add Fractions",      pct: 27, color: "#F59E0B" },
  { label: "Ratio Concepts",     pct: 14, color: "#10B981" },
];

function gapTagStyle(gap: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    "math.4.fractions.parts":      { bg: "#EEF2FF", color: "#4338CA" },
    "math.4.fractions.equivalent": { bg: "#F5F3FF", color: "#6D28D9" },
    "math.5.fractions.compare":    { bg: "#FDF2F8", color: "#9D174D" },
    "math.5.fractions.add-like":   { bg: "#FFFBEB", color: "#92400E" },
    "math.6.ratios.intro":         { bg: "#ECFDF5", color: "#065F46" },
  };
  return colors[gap] ?? { bg: "#F1F5F9", color: "#334155" };
}

function masteryColor(avg: number) {
  if (avg >= 0.7) return "#10B981";
  if (avg >= 0.4) return "#F59E0B";
  return "#EF4444";
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [customTeacherNote, setCustomTeacherNote] = useState("");
  const [strategyOverride, setStrategyOverride] = useState("visual");
  const [noteSaved, setNoteSaved] = useState(false);

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const atRisk     = students.filter((s) => s.avg < 0.4).length;
  const avgClass   = Math.round(students.reduce((a, s) => a + s.avg, 0) / students.length * 100);
  const totalSess  = students.reduce((a, s) => a + s.sessions, 0);

  const handleOpenStudent = (s: StudentRecord) => {
    setSelectedStudent(s);
    setCustomTeacherNote(s.teacherNote);
    setStrategyOverride(s.strategy);
    setNoteSaved(false);
  };

  const handleSaveTeacherNote = () => {
    if (!selectedStudent) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudent.id
          ? { ...s, teacherNote: customTeacherNote, strategy: strategyOverride }
          : s
      )
    );
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const handleLaunchStudentWorksheet = (s: StudentRecord) => {
    setSession({
      studentId: s.id,
      gradeLevel: s.grade,
      gapSkill: s.gap,
      strategy: strategyOverride || s.strategy,
    });
    router.push("/tutor");
  };

  return (
    <div className={styles.shell}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand} onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <div className={styles.navMark}>📚</div>
          UnStuck Teacher Copilot
        </div>
        <div className={styles.navRight}>
          <button
            onClick={() => router.push("/tutor")}
            style={{
              padding: "6px 12px",
              background: "#EEF2FF",
              color: "#4338CA",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Live Tutor Demo ⚡
          </button>
          <span className={styles.navGreet}>Welcome, Teacher 👋</span>
          <button className={styles.logoutBtn} onClick={() => router.push("/login")}>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Class Overview</h1>
            <p className={styles.pageSubtitle}>Grades 4–6 · Math · Click any student row to view full stats &amp; submit notes</p>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Students</span>
              <div className={styles.statIcon} style={{ background: "#EEF2FF" }}>👥</div>
            </div>
            <div className={styles.statValue} style={{ color: "#4F46E5" }}>{students.length}</div>
            <div className={styles.statSub}>enrolled</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Class Avg Mastery</span>
              <div className={styles.statIcon} style={{ background: "#ECFDF5" }}>📈</div>
            </div>
            <div className={styles.statValue} style={{ color: "#059669" }}>{avgClass}%</div>
            <div className={styles.statSub}>across all skills</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>At Risk</span>
              <div className={styles.statIcon} style={{ background: "#FFF1F2" }}>⚠️</div>
            </div>
            <div className={styles.statValue} style={{ color: "#E11D48" }}>{atRisk}</div>
            <div className={styles.statSub}>need attention</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Total Sessions</span>
              <div className={styles.statIcon} style={{ background: "#FFF7ED" }}>✅</div>
            </div>
            <div className={styles.statValue} style={{ color: "#EA580C" }}>{totalSess}</div>
            <div className={styles.statSub}>completed</div>
          </div>
        </div>

        {/* Main grid */}
        <div className={styles.grid}>
          {/* Student table */}
          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <span className={styles.tableTitle}>Students (Click row to inspect)</span>
              <input
                className={styles.searchInput}
                placeholder="🔍  Search student…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Mastery</th>
                  <th>Gap Skill</th>
                  <th>Strategy</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const mc = masteryColor(s.avg);
                  const gt = gapTagStyle(s.gap);
                  return (
                    <tr
                      key={s.id}
                      className={styles.clickableRow}
                      onClick={() => handleOpenStudent(s)}
                    >
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.avatar} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                            {s.name[0]}
                          </div>
                          <div>
                            <div className={styles.studentName} style={{ color: "#4F46E5", textDecoration: "underline", textUnderlineOffset: 3 }}>
                              {s.name}
                            </div>
                            <div className={styles.studentGrade}>Grade {s.grade}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div className={styles.miniBar}>
                            <div
                              className={styles.miniBarFill}
                              style={{ width: `${s.avg * 100}%`, background: mc }}
                            />
                          </div>
                          <span className={styles.pct} style={{ color: mc }}>
                            {Math.round(s.avg * 100)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={styles.gapTag}
                          style={{ background: gt.bg, color: gt.color }}
                        >
                          {SKILL_SHORT[s.gap]}
                        </span>
                      </td>
                      <td>
                        <span className={styles.strategyTag}>{s.strategy}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{s.sessions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Sidebar */}
          <div className={styles.sidebar}>
            {/* Alerts */}
            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>🔔 Alerts</div>
              <div className={styles.alertList}>
                {ALERTS.map((a, i) => (
                  <div key={i} className={styles.alertItem} style={{ background: a.bg }}>
                    <div className={styles.alertDot} style={{ background: a.dot }} />
                    <div className={styles.alertBody}>
                      <div className={styles.alertName}>{a.name}</div>
                      <div className={styles.alertMsg}>{a.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Class skill distribution */}
            <div className={styles.sideCard}>
              <div className={styles.sideTitle}>📊 Class Skill Distribution</div>
              <div className={styles.distList}>
                {SKILL_DIST.map((d, i) => (
                  <div key={i} className={styles.distRow}>
                    <div className={styles.distMeta}>
                      <span className={styles.distLabel}>{d.label}</span>
                      <span className={styles.distVal}>{d.pct}% avg</span>
                    </div>
                    <div className={styles.distTrack}>
                      <div
                        className={styles.distFill}
                        style={{ width: `${d.pct}%`, background: d.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Student Details & Teacher Input Modal ── */}
      {selectedStudent && (
        <div className={styles.modalOverlay} onClick={() => setSelectedStudent(null)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={styles.modalHead}>
              <div className={styles.modalStudentInfo}>
                <div className={styles.modalAvatar} style={{ background: "#4F46E5" }}>
                  {selectedStudent.name[0]}
                </div>
                <div>
                  <h2 className={styles.modalName}>{selectedStudent.name}</h2>
                  <p className={styles.modalSub}>
                    Grade {selectedStudent.grade} Math · Student ID: <code>{selectedStudent.id}</code>
                  </p>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedStudent(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              {/* Top Quick Stats */}
              <div className={styles.modalStatsGrid}>
                <div className={styles.modalStatBox}>
                  <div className={styles.modalStatLabel}>Overall Mastery</div>
                  <div className={styles.modalStatVal} style={{ color: masteryColor(selectedStudent.avg) }}>
                    {Math.round(selectedStudent.avg * 100)}%
                  </div>
                </div>
                <div className={styles.modalStatBox}>
                  <div className={styles.modalStatLabel}>Target Gap Skill</div>
                  <div className={styles.modalStatVal} style={{ color: "#7C3AED", fontSize: 14 }}>
                    {selectedStudent.gapName}
                  </div>
                </div>
                <div className={styles.modalStatBox}>
                  <div className={styles.modalStatLabel}>Total Sessions</div>
                  <div className={styles.modalStatVal} style={{ color: "#059669" }}>
                    {selectedStudent.sessions}
                  </div>
                </div>
              </div>

              {/* Mastery Breakdown */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionTitle}>📊 CCSS Skill Breakdown</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {Object.entries(selectedStudent.mastery).map(([skillId, pct]) => (
                    <div key={skillId} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ fontWeight: 600, color: "#334155" }}>{SKILL_SHORT[skillId] || skillId}</span>
                        <span style={{ fontWeight: 700, color: pct >= 0.7 ? "#059669" : pct >= 0.4 ? "#D97706" : "#DC2626" }}>
                          {Math.round(pct * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${pct * 100}%`,
                            background: pct >= 0.7 ? "#059669" : pct >= 0.4 ? "#D97706" : "#DC2626",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked IEP & Parent Notes */}
              <div className={styles.modalSection} style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
                <div className={styles.modalSectionTitle} style={{ color: "#92400E" }}>
                  <span>👨‍👩‍👧</span> Parent &amp; IEP Records
                </div>
                <p style={{ fontSize: 13, color: "#78350F", margin: "0 0 6px", lineHeight: 1.4 }}>
                  <strong>📄 IEP Accommodations:</strong> {selectedStudent.iepAccommodation}
                </p>
                <p style={{ fontSize: 13, color: "#78350F", margin: 0, lineHeight: 1.4 }}>
                  <strong>💬 Parent Home Notes:</strong> {selectedStudent.parentNote}
                </p>
              </div>

              {/* Recent Attempt History */}
              <div className={styles.modalSection}>
                <div className={styles.modalSectionTitle}>📝 Recent Practice &amp; Worksheet Attempts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedStudent.recentAttempts.map((att, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        background: "#ffffff",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: "#1E293B" }}>{att.title}</div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>{att.date}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontWeight: 700, color: att.score >= 0.7 ? "#059669" : "#DC2626" }}>
                          {Math.round(att.score * 100)}%
                        </span>
                        <div style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: "#64748B" }}>
                          {att.decision}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Teacher Observation & Additional Info Form */}
              <div className={styles.modalSection} style={{ background: "#EEF2FF", borderColor: "#C7D2FE" }}>
                <div className={styles.modalSectionTitle} style={{ color: "#3730A3" }}>
                  <span>✏️</span> Teacher Observations &amp; Custom Interventions
                </div>
                <p style={{ fontSize: 12, color: "#4338CA", margin: "0 0 8px" }}>
                  Submit classroom observations or adjust the AI pedagogical strategy for {selectedStudent.name.split(" ")[0]}.
                </p>

                <textarea
                  className={styles.noteTextarea}
                  rows={3}
                  value={customTeacherNote}
                  onChange={(e) => setCustomTeacherNote(e.target.value)}
                  placeholder="Enter classroom notes, observed struggles, or tailored scaffolding guidance..."
                />

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "#3730A3" }}>Strategy:</label>
                    <select
                      value={strategyOverride}
                      onChange={(e) => setStrategyOverride(e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #C7D2FE",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#3730A3",
                        background: "#ffffff",
                        outline: "none",
                      }}
                    >
                      <option value="visual">Visual Fraction Strips</option>
                      <option value="worked_example">Worked Examples Scaffold</option>
                      <option value="story">Story &amp; Real-World Context</option>
                      <option value="steps">Step-by-Step Direct Rules</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveTeacherNote}
                    style={{
                      padding: "8px 16px",
                      background: "#4F46E5",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Save &amp; Sync Note 💾
                  </button>
                </div>

                {noteSaved && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#059669", fontWeight: 700 }}>
                    ✓ Teacher observations and strategy saved to AI tutoring model!
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={styles.modalActionRow}>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  style={{
                    padding: "10px 18px",
                    background: "#F1F5F9",
                    color: "#334155",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleLaunchStudentWorksheet(selectedStudent)}
                  style={{
                    padding: "10px 20px",
                    background: "#059669",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(5, 150, 105, 0.3)",
                  }}
                >
                  Launch Practice for {selectedStudent.name.split(" ")[0]} 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
