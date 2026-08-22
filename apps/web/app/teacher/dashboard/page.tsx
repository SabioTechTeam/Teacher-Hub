"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

const SKILL_SHORT: Record<string, string> = {
  "math.4.fractions.parts":      "Parts of Whole",
  "math.4.fractions.equivalent": "Equiv. Fractions",
  "math.5.fractions.compare":    "Compare Fractions",
  "math.5.fractions.add-like":   "Add Fractions",
  "math.6.ratios.intro":         "Ratio Concepts",
};

const STUDENTS = [
  { id: "stu-001", name: "Aiden Torres",   grade: 4, avg: 0.37, gap: "math.4.fractions.equivalent", strategy: "visual",  sessions: 3,  alert: "struggling" },
  { id: "stu-002", name: "Maya Patel",     grade: 5, avg: 0.63, gap: "math.5.fractions.add-like",    strategy: "steps",   sessions: 7,  alert: null },
  { id: "stu-003", name: "Liam Nguyen",    grade: 5, avg: 0.28, gap: "math.4.fractions.equivalent", strategy: "story",   sessions: 2,  alert: "at-risk" },
  { id: "stu-004", name: "Sofia Chen",     grade: 6, avg: 0.84, gap: "math.6.ratios.intro",          strategy: "steps",   sessions: 12, alert: null },
  { id: "stu-005", name: "Ethan Williams", grade: 4, avg: 0.12, gap: "math.4.fractions.parts",       strategy: "visual",  sessions: 1,  alert: "at-risk" },
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
  const [search, setSearch] = useState("");

  const filtered = STUDENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const atRisk     = STUDENTS.filter((s) => s.avg < 0.4).length;
  const avgClass   = Math.round(STUDENTS.reduce((a, s) => a + s.avg, 0) / STUDENTS.length * 100);
  const totalSess  = STUDENTS.reduce((a, s) => a + s.sessions, 0);

  return (
    <div className={styles.shell}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand}>
          <div className={styles.navMark}>📚</div>
          Teacher-Hub
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
            <p className={styles.pageSubtitle}>Grades 4–6 · Math · August 2026</p>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Students</span>
              <div className={styles.statIcon} style={{ background: "#EEF2FF" }}>👥</div>
            </div>
            <div className={styles.statValue} style={{ color: "#4F46E5" }}>5</div>
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
              <span className={styles.tableTitle}>Students</span>
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
                    <tr key={s.id}>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.avatar} style={{ background: AVATAR_COLORS[i] }}>
                            {s.name[0]}
                          </div>
                          <div>
                            <div className={styles.studentName}>{s.name}</div>
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
                {SKILL_DIST.map((d) => (
                  <div key={d.label} className={styles.distRow}>
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
    </div>
  );
}
