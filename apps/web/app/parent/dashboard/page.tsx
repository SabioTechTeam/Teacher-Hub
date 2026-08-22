"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { setSession } from "@/lib/session";

interface UploadedRecord {
  id: string;
  type: "iep" | "report" | "worksheet";
  title: string;
  date: string;
  icon: string;
  bg: string;
  status: string;
  insight: string;
}

const INITIAL_RECORDS: UploadedRecord[] = [
  {
    id: "rec-1",
    type: "iep",
    title: "Aiden_IEP_Math_Accommodations_2026.pdf",
    date: "Aug 18, 2026",
    icon: "📄",
    bg: "#F5F3FF",
    status: "AI Processed ✓",
    insight: "IEP Accommodation #3: Provide visual fraction bars and number line representations before abstract arithmetic.",
  },
  {
    id: "rec-2",
    type: "worksheet",
    title: "Unit4_Fractions_Homework_Mistakes.jpg",
    date: "Aug 20, 2026",
    icon: "📸",
    bg: "#FFF7ED",
    status: "Misconception Extracted ✓",
    insight: "Homework Error Analysis: Student struggled with common denominators (e.g. added numerators & denominators 2/3 + 1/4 = 3/7).",
  },
  {
    id: "rec-3",
    type: "report",
    title: "Q1_Grade4_Math_Report_Card.pdf",
    date: "Aug 21, 2026",
    icon: "📊",
    bg: "#ECFDF5",
    status: "Grade Baseline Synced ✓",
    insight: "Report Card Note: Strong in spatial geometry; needs targeted reinforcement in multi-step fraction word problems.",
  },
];

const HOBBY_OPTIONS = [
  { id: "space", label: "🚀 Space & Rockets", active: true },
  { id: "minecraft", label: "🎮 Minecraft Blocks", active: true },
  { id: "basketball", label: "🏀 Basketball Stats", active: true },
  { id: "dinosaurs", label: "🦖 Dinosaurs", active: false },
  { id: "robotics", label: "🤖 Robotics & Coding", active: false },
  { id: "soccer", label: "⚽ Soccer", active: false },
];

const SKILLS = [
  { id: "math.4.fractions.parts", name: "Parts of a Whole (Gr 4)", pct: 0.85, color: "#4F46E5" },
  { id: "math.4.fractions.equivalent", name: "Equivalent Fractions (Gr 4)", pct: 0.60, color: "#7C3AED" },
  { id: "math.5.fractions.compare", name: "Compare Fractions (Gr 5)", pct: 0.30, color: "#EC4899" },
  { id: "math.5.fractions.add-like", name: "Add Fractions (Gr 5)", pct: 0.10, color: "#F59E0B" },
  { id: "math.6.ratios.intro", name: "Ratio Concepts (Gr 6)", pct: 0.00, color: "#10B981" },
];

export default function ParentDashboard() {
  const router = useRouter();
  const [records, setRecords] = useState<UploadedRecord[]>(INITIAL_RECORDS);
  const [hobbies, setHobbies] = useState(HOBBY_OPTIONS);
  const [parentNote, setParentNote] = useState(
    "Aiden gets frustrated when fraction problems are purely abstract. He loves visual models and anything related to building in Minecraft or space exploration."
  );
  const [noteSaved, setNoteSaved] = useState(false);

  const toggleHobby = (id: string) => {
    setHobbies(prev =>
      prev.map(h => (h.id === id ? { ...h, active: !h.active } : h))
    );
  };

  const handleAddSampleRecord = (type: "iep" | "worksheet" | "report") => {
    if (type === "iep") {
      const newRec: UploadedRecord = {
        id: `rec-${Date.now()}`,
        type: "iep",
        title: `Aiden_504_Plan_Update_${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}.pdf`,
        date: "Just now",
        icon: "📄",
        bg: "#F5F3FF",
        status: "AI Processed ✓",
        insight: "New Accommodation Added: Provide 1-minute brain breaks between multi-step problem sets.",
      };
      setRecords([newRec, ...records]);
    } else if (type === "worksheet") {
      const newRec: UploadedRecord = {
        id: `rec-${Date.now()}`,
        type: "worksheet",
        title: `Teacher_Quiz_Review_Photo_${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}.png`,
        date: "Just now",
        icon: "📸",
        bg: "#FFF7ED",
        status: "Misconception Extracted ✓",
        insight: "Photo Analysis: Misinterpreted pie chart question #4. AI adjusted next worksheet to include slice shading.",
      };
      setRecords([newRec, ...records]);
    } else {
      const newRec: UploadedRecord = {
        id: `rec-${Date.now()}`,
        type: "report",
        title: "MidTerm_Math_Assessment_Feedback.pdf",
        date: "Just now",
        icon: "📊",
        bg: "#ECFDF5",
        status: "Synced ✓",
        insight: "Teacher Feedback: High effort in classroom; ready for scaffolded equivalent fractions.",
      };
      setRecords([newRec, ...records]);
    }
  };

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2500);
  };

  const handleLaunchChildSession = () => {
    setSession({
      studentId: "stu-001",
      gradeLevel: 4,
      gapSkill: "math.4.fractions.equivalent",
      strategy: "worked_example",
    });
    router.push("/tutor");
  };

  return (
    <div className={styles.shell}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navBrand} onClick={() => router.push("/")}>
          <div className={styles.navMark}>👨‍👩‍👧</div>
          UnStuck Parent Portal
        </div>
        <div className={styles.navRight}>
          <button className={styles.demoBtn} onClick={handleLaunchChildSession}>
            Test Child's Practice Session 🚀
          </button>
          <span className={styles.navGreet}>Welcome, Maria (Aiden's Mom) 👋</span>
          <button className={styles.logoutBtn} onClick={() => router.push("/login")}>
            Sign out
          </button>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Aiden's Learning Profile &amp; Home Hub</h1>
            <p className={styles.pageSubtitle}>
              Grade 4 Math · Upload IEPs, homework photos, and hobbies to personalize Aiden's AI teacher.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Current Mastery</span>
              <div className={styles.statIcon} style={{ background: "#EEF2FF", color: "#4F46E5" }}>📈</div>
            </div>
            <div className={styles.statValue} style={{ color: "#4F46E5" }}>68%</div>
            <div className={styles.statSub}>Grade 4 Math · Improving</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Target Skill Gap</span>
              <div className={styles.statIcon} style={{ background: "#F5F3FF", color: "#7C3AED" }}>🎯</div>
            </div>
            <div className={styles.statValue} style={{ color: "#7C3AED", fontSize: 20 }}>Equivalent Fractions</div>
            <div className={styles.statSub}>Scaffolded with visual bars</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>Uploaded Records</span>
              <div className={styles.statIcon} style={{ background: "#ECFDF5", color: "#059669" }}>📑</div>
            </div>
            <div className={styles.statValue} style={{ color: "#059669" }}>{records.length} Active</div>
            <div className={styles.statSub}>IEP + Homework + Report Card</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>AI Gamification</span>
              <div className={styles.statIcon} style={{ background: "#FFF7ED", color: "#EA580C" }}>🎮</div>
            </div>
            <div className={styles.statValue} style={{ color: "#EA580C", fontSize: 20 }}>Space &amp; Minecraft</div>
            <div className={styles.statSub}>{hobbies.filter(h => h.active).length} interest themes active</div>
          </div>
        </div>

        {/* Main Grid */}
        <div className={styles.grid}>
          {/* Left Column: Uploads, Hobbies, Notes */}
          <div>
            {/* Upload Hub Card */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  <span>📁</span> Home Uploads: IEPs, Homework &amp; Report Cards
                </span>
                <span className={`${styles.badge} ${styles.badgePurple}`}>AI Document Reader Active</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 16px", lineHeight: 1.5 }}>
                Upload photos of difficult worksheets sent home from school, formal IEP/504 plans, or report cards. The AI Teacher parses them to identify exact misconceptions and apply accommodations.
              </p>

              {/* Upload Dropzone */}
              <div className={styles.uploadDropzone}>
                <div className={styles.uploadIcon}>☁️</div>
                <div className={styles.uploadTitle}>Drag and drop any IEP PDF, Report Card, or Worksheet Photo</div>
                <div className={styles.uploadSubtitle}>Supports PDF, PNG, JPG up to 25MB · FERPA &amp; COPPA Protected</div>
                <div className={styles.uploadButtons}>
                  <button className={styles.presetBtn} onClick={() => handleAddSampleRecord("iep")}>
                    + Upload Sample IEP (PDF)
                  </button>
                  <button className={styles.presetBtn} onClick={() => handleAddSampleRecord("worksheet")}>
                    + Upload Homework Photo (Image)
                  </button>
                  <button className={styles.presetBtn} onClick={() => handleAddSampleRecord("report")}>
                    + Upload Report Card (PDF)
                  </button>
                </div>
              </div>

              {/* Active Records List */}
              <div className={styles.fileList}>
                {records.map(rec => (
                  <div key={rec.id} className={styles.fileItem}>
                    <div className={styles.fileItemHeader}>
                      <div className={styles.fileMeta}>
                        <div className={styles.fileIcon} style={{ background: rec.bg }}>{rec.icon}</div>
                        <div>
                          <div className={styles.fileName}>{rec.title}</div>
                          <div className={styles.fileDate}>{rec.date}</div>
                        </div>
                      </div>
                      <span className={`${styles.badge} ${styles.badgeGreen}`}>{rec.status}</span>
                    </div>
                    <div className={styles.fileInsight}>
                      <strong>💡 AI Learning Rule:</strong> {rec.insight}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hobbies & Interests Card */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  <span>🎮</span> Child Interests &amp; Gamification Themes
                </span>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>Personalized Prompts</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Select Aiden's favorite topics. The AI teacher crafts contextual word problems around these passions to make math feel like play.
              </p>

              <div className={styles.tagGrid}>
                {hobbies.map(h => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => toggleHobby(h.id)}
                    className={`${styles.tagChip} ${h.active ? styles.active : ""}`}
                  >
                    {h.label} {h.active && "✓"}
                  </button>
                ))}
              </div>
            </div>

            {/* Parent Observations Notes */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  <span>📝</span> Parent Observations &amp; Emotional Cues
                </span>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>Tutor Memory</span>
              </div>
              <p style={{ fontSize: 13, color: "#64748B", margin: "0 0 12px", lineHeight: 1.5 }}>
                Share specific cues about how Aiden learns at home. The AI tutor adjusts its tone and pacing accordingly.
              </p>

              <textarea
                value={parentNote}
                onChange={e => setParentNote(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 10,
                  border: "1px solid #CBD5E1",
                  fontSize: 14,
                  fontFamily: "inherit",
                  marginBottom: 12,
                  boxSizing: "border-box",
                }}
              />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick={handleSaveNote}
                  style={{
                    padding: "10px 18px",
                    background: "#4F46E5",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save &amp; Sync with AI Tutor 💾
                </button>
                {noteSaved && (
                  <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>
                    ✓ Synced to AI Teacher memory!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: AI Action Plan, Mastery Bars */}
          <div>
            {/* AI Action Plan Hero */}
            <div className={styles.actionHero}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#A5B4FC", textTransform: "uppercase", marginBottom: 6 }}>
                ✦ Live AI Tutor Configuration
              </div>
              <h3 className={styles.actionHeroTitle}>How AI Uses Aiden's Parent Data</h3>
              <p className={styles.actionHeroDesc}>
                Synthesizing uploaded IEP accommodations, home worksheet mistakes, and active interest themes into the next live practice set.
              </p>

              <div className={styles.actionPills}>
                <div className={styles.actionPill}>
                  <strong>🧩 Scaffolding:</strong> Visual fraction bars + step-by-step worked examples (from IEP #3).
                </div>
                <div className={styles.actionPill}>
                  <strong>🎯 Gap Target:</strong> Equivalent Fractions (CCSS 4.NF.1) — remediating common denominator mistakes.
                </div>
                <div className={styles.actionPill}>
                  <strong>🚀 Theme:</strong> Space rockets &amp; Minecraft building block word problems.
                </div>
              </div>

              <button className={styles.actionBtn} onClick={handleLaunchChildSession}>
                Launch Aiden's Personalized Practice →
              </button>
            </div>

            {/* Skill Mastery Breakdown */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  <span>📊</span> Skill Mastery Overview
                </span>
                <span className={`${styles.badge} ${styles.badgeBlue}`}>Grade 4 Focus</span>
              </div>

              <div className={styles.skillList}>
                {SKILLS.map(s => (
                  <div key={s.id} className={styles.skillRow}>
                    <div className={styles.skillMeta}>
                      <span className={styles.skillName}>{s.name}</span>
                      <span className={styles.skillPct} style={{ color: s.color }}>
                        {Math.round(s.pct * 100)}%
                      </span>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{ width: `${s.pct * 100}%`, background: s.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Feedback Loop */}
            <div className={styles.card}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  <span>💬</span> Classroom Teacher Notes
                </span>
                <span className={`${styles.badge} ${styles.badgeGreen}`}>School Sync</span>
              </div>
              <div style={{ background: "#F8FAFC", borderLeft: "3px solid #059669", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#334155", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 700, marginBottom: 4, color: "#065F46" }}>Ms. Davis (4th Grade Math):</div>
                "Aiden made great progress on Parts of a Whole this week! When he practices equivalent fractions at home with the visual models, please encourage him to find the matching multiplier."
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
