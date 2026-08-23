"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { getSession, setSession } from "@/lib/session";

const SKILL_LABELS: Record<string, string> = {
  "math.4.fractions.parts":      "Parts of a Whole (Gr 4)",
  "math.4.fractions.equivalent": "Equivalent Fractions (Gr 4)",
  "math.5.fractions.compare":    "Compare Fractions (Gr 5)",
  "math.5.fractions.add-like":   "Add Fractions (Gr 5)",
  "math.6.ratios.intro":         "Ratio Concepts (Gr 6)",
};

const SKILL_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981",
];

export default function StudentDashboard() {
  const router = useRouter();
  const [gapSkill, setGapSkill] = useState("math.4.fractions.equivalent");
  const [gradeLevel, setGradeLevel] = useState<1 | 2 | 3 | 4 | 5 | 6>(4);

  const [studentState, setStudentState] = useState({
    name: "Aiden Torres",
    gradeLevel: 4,
    sessionsCompleted: 3,
    gapSkill: "math.4.fractions.equivalent",
    mastery: {
      "math.4.fractions.parts":      0.85,
      "math.4.fractions.equivalent": 0.60,
      "math.5.fractions.compare":    0.30,
      "math.5.fractions.add-like":   0.10,
      "math.6.ratios.intro":         0.00,
    } as Record<string, number>,
  });

  useEffect(() => {
    const s = getSession();
    if (s.gapSkill) {
      setGapSkill(s.gapSkill);
      setStudentState((prev) => ({
        ...prev,
        gapSkill: s.gapSkill || prev.gapSkill,
        gradeLevel: s.gradeLevel || prev.gradeLevel,
      }));
    }
    if (s.gradeLevel) {
      setGradeLevel(s.gradeLevel);
    }
  }, []);

  const recentActivity = [
    { id: 1, icon: "📝", bg: "#EEF2FF", title: "Completed: Parts of a Whole — Story Problems", date: "Aug 19", score: 1.0 },
    { id: 2, icon: "📊", bg: "#F0FDF4", title: "Assessment taken — Grade 4 Math", date: "Aug 20", score: null },
    { id: 3, icon: "📝", bg: "#FFF7ED", title: "Attempted: Equivalent Fractions — See the Match", date: "Aug 20", score: 0.50 },
  ];

  function scoreClass(s: number) {
    if (s >= 0.8) return styles.scoreGreen;
    if (s >= 0.5) return styles.scoreAmber;
    return styles.scoreRed;
  }

  const avgMastery = Math.round(
    (Object.values(studentState.mastery).reduce((a, b) => a + b, 0) /
      Object.values(studentState.mastery).length) * 100
  );

  const skillsDone = Object.values(studentState.mastery).filter((m) => m >= 0.8).length;

  const handleStartWorksheet = () => {
    setSession({
      studentId: "stu-001",
      gradeLevel: gradeLevel,
      gapSkill: gapSkill,
      strategy: "worked_example",
    });
    router.push("/tutor");
  };

  return (
    <div className={styles.shell}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand} onClick={() => router.push("/")} style={{ cursor: "pointer" }}>
          <div className={styles.navMark}>🎯</div>
          UnStuck
        </div>
        <div className={styles.navRight}>
          <button
            onClick={() => router.push("/student")}
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
            Take Math Quiz 📝
          </button>
          <span className={styles.navGreet}>Hi, {studentState.name.split(" ")[0]} 👋</span>
          <button className={styles.logoutBtn} onClick={() => router.push("/login")}>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className={styles.main}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>My Learning Dashboard</h1>
          <p className={styles.pageSubtitle}>Grade {studentState.gradeLevel} · Math · Keep it up!</p>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Overall Mastery</span>
              <div className={styles.statCardIcon} style={{ background: "#EEF2FF" }}>📈</div>
            </div>
            <div className={styles.statCardValue} style={{ color: "#4F46E5" }}>{avgMastery}%</div>
            <span className={styles.statCardChange}>↑ improving</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Sessions Done</span>
              <div className={styles.statCardIcon} style={{ background: "#ECFDF5" }}>✅</div>
            </div>
            <div className={styles.statCardValue} style={{ color: "#059669" }}>{studentState.sessionsCompleted}</div>
            <span className={styles.statCardChange}>this week</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Skills Mastered</span>
              <div className={styles.statCardIcon} style={{ background: "#FFF7ED" }}>⭐</div>
            </div>
            <div className={styles.statCardValue} style={{ color: "#EA580C" }}>{skillsDone}/5</div>
            <span className={styles.statCardChange}>keep going!</span>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statCardTop}>
              <span className={styles.statCardLabel}>Grade Level</span>
              <div className={styles.statCardIcon} style={{ background: "#F5F3FF" }}>🎓</div>
            </div>
            <div className={styles.statCardValue} style={{ color: "#7C3AED" }}>{studentState.gradeLevel}</div>
            <span className={styles.statCardChange}>Math focus</span>
          </div>
        </div>

        {/* Two-column section */}
        <div className={styles.grid2}>
          {/* Left: skill mastery + gap */}
          <div>
            {/* Gap skill call-to-action */}
            <div className={styles.gapHero}>
              <p className={styles.gapLabel}>Recommended next skill</p>
              <p className={styles.gapSkill}>{SKILL_LABELS[gapSkill] || gapSkill}</p>
              <p className={styles.gapDesc}>
                Your AI tutor has prepared a worksheet tailored to your learning style.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button className={styles.startBtn} onClick={handleStartWorksheet}>
                  Start worksheet →
                </button>
                <button
                  onClick={() => router.push("/student")}
                  style={{
                    padding: "10px 16px",
                    background: "rgba(255,255,255,0.2)",
                    color: "#ffffff",
                    border: "1px solid rgba(255,255,255,0.4)",
                    borderRadius: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Diagnostic Quiz 🎯
                </button>
              </div>
            </div>

            {/* Mastery bars */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHead}>
                <span className={styles.sectionTitle}>Skill Mastery</span>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>5 skills</span>
              </div>
              <div className={styles.skillList}>
                {Object.entries(studentState.mastery).map(([skillId, pct], i) => (
                  <div key={skillId} className={styles.skillRow}>
                    <div className={styles.skillMeta}>
                      <span className={styles.skillName}>{SKILL_LABELS[skillId] || skillId}</span>
                      <span className={styles.skillPct} style={{ color: SKILL_COLORS[i] || "#4F46E5" }}>
                        {Math.round(pct * 100)}%
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${pct * 100}%`, background: SKILL_COLORS[i] || "#4F46E5" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: recent activity */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHead}>
              <span className={styles.sectionTitle}>Recent Activity</span>
              <span className={`${styles.badge} ${styles.badgeGreen}`}>This week</span>
            </div>
            <div className={styles.activityList}>
              {recentActivity.map((item) => (
                <div key={item.id} className={styles.activityItem}>
                  <div className={styles.activityIcon} style={{ background: item.bg }}>
                    {item.icon}
                  </div>
                  <div className={styles.activityBody}>
                    <div className={styles.activityTitle}>{item.title}</div>
                    <div className={styles.activityMeta}>{item.date}</div>
                  </div>
                  {item.score !== null && (
                    <span className={`${styles.scorePill} ${scoreClass(item.score)}`}>
                      {Math.round(item.score * 100)}%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
