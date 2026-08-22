"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Role = "student" | "teacher" | "parent";

const ACCOUNTS = {
  student: { username: "student", password: "learn123" },
  teacher: { username: "teacher", password: "teach456" },
  parent:  { username: "parent",  password: "parent789" },
};

export default function LoginClient() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("student");
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [username, setUsername] = useState("student");
  const [password, setPassword] = useState("learn123");
  const [error, setError] = useState("");

  function handleRoleSwitch(r: Role) {
    setRole(r);
    setUsername(ACCOUNTS[r].username);
    setPassword(ACCOUNTS[r].password);
    setError("");
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const acct = ACCOUNTS[role];
    if (username === acct.username && password === acct.password) {
      if (role === "teacher") {
        router.push("/teacher/dashboard");
      } else if (role === "parent") {
        router.push("/parent/dashboard");
      } else if (isNewStudent) {
        // New student onboarding routes through the diagnostic assessment quiz
        router.push("/student");
      } else {
        router.push("/student/dashboard");
      }
    } else {
      setError("Incorrect username or password.");
    }
  }

  return (
    <div className={styles.page}>
      {/* ── Left hero ── */}
      <div className={styles.hero}>
        <div className={`${styles.heroBlob} ${styles.heroBlob1}`} />
        <div className={`${styles.heroBlob} ${styles.heroBlob2}`} />
        <div className={`${styles.heroBlob} ${styles.heroBlob3}`} />

        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span>✦</span> AI-Powered Learning
          </div>
          <h1 className={styles.heroTitle}>
            Every student<br />learns differently.
          </h1>
          <p className={styles.heroSubtitle}>
            UnStuck adapts to each student's skill gaps in real time —
            delivering the right worksheet, at the right level, right now.
          </p>
          <div className={styles.heroStats}>
            <div className={styles.stat}>
              <span className={styles.statNum}>5</span>
              <span className={styles.statLabel}>Skills tracked</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>10</span>
              <span className={styles.statLabel}>Worksheets</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statNum}>Gr 4–6</span>
              <span className={styles.statLabel}>Math focus</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form ── */}
      <div className={styles.panel}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>🎯</div>
            <span className={styles.logoText}>UnStuck</span>
          </div>

          <h2 className={styles.heading}>Welcome back</h2>
          <p className={styles.sub}>Sign in to continue your learning journey.</p>

          {/* Role picker (Student, Teacher, Parent) */}
          <div className={styles.rolePicker}>
            <button
              type="button"
              className={`${styles.roleCard} ${role === "student" ? styles.active : ""}`}
              onClick={() => handleRoleSwitch("student")}
            >
              <span className={styles.roleIcon}>🎒</span>
              <span className={styles.roleLabel}>Student</span>
              <span className={styles.roleHint}>Practice & learn</span>
            </button>
            <button
              type="button"
              className={`${styles.roleCard} ${role === "teacher" ? styles.active : ""}`}
              onClick={() => handleRoleSwitch("teacher")}
            >
              <span className={styles.roleIcon}>📚</span>
              <span className={styles.roleLabel}>Teacher</span>
              <span className={styles.roleHint}>Class overview</span>
            </button>
            <button
              type="button"
              className={`${styles.roleCard} ${role === "parent" ? styles.active : ""}`}
              onClick={() => handleRoleSwitch("parent")}
            >
              <span className={styles.roleIcon}>👨‍👩‍👧</span>
              <span className={styles.roleLabel}>Parent</span>
              <span className={styles.roleHint}>IEP & Worksheets</span>
            </button>
          </div>

          {/* Student Mode Selector (New Onboarding vs Returning) */}
          {role === "student" && (
            <div style={{ background: "#F1F5F9", borderRadius: 10, padding: 4, display: "flex", marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setIsNewStudent(true)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: isNewStudent ? "#FFFFFF" : "transparent",
                  color: isNewStudent ? "#4F46E5" : "#64748B",
                  boxShadow: isNewStudent ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                ✨ New Student (Quiz)
              </button>
              <button
                type="button"
                onClick={() => setIsNewStudent(false)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  background: !isNewStudent ? "#FFFFFF" : "transparent",
                  color: !isNewStudent ? "#4F46E5" : "#64748B",
                  boxShadow: !isNewStudent ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                📊 Returning (Dashboard)
              </button>
            </div>
          )}

          {/* Static account hint */}
          <div className={styles.hint}>
            <div className={styles.hintTitle}>Demo credentials auto-filled ✓</div>
            {role === "student"
              ? "student / learn123"
              : role === "teacher"
              ? "teacher / teach456"
              : "parent / parent789"}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="username">Username</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>👤</span>
                  <input
                    id="username"
                    className={styles.input}
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">Password</label>
                <div className={styles.inputWrap}>
                  <span className={styles.inputIcon}>🔒</span>
                  <input
                    id="password"
                    className={styles.input}
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.btn}>
              {role === "teacher"
                ? "Sign in as Teacher 📚"
                : role === "parent"
                ? "Sign in as Parent 👨‍👩‍👧"
                : isNewStudent
                ? "Start Onboarding Diagnostic 🎯"
                : "Sign in to Dashboard 🎒"}
            </button>
          </form>

          <p className={styles.footer}>
            Hackathon MVP · Grades 4–6 Math · Built with Next.js &amp; FastAPI
          </p>
        </div>
      </div>
    </div>
  );
}
