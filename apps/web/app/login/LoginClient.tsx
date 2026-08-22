"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

type Role = "student" | "teacher";

const ACCOUNTS = {
  student: { username: "student", password: "learn123", redirect: "/student/dashboard" },
  teacher: { username: "teacher", password: "teach456", redirect: "/teacher/dashboard" },
};

export default function LoginClient() {
  const router = useRouter();
  const [role, setRole]       = useState<Role>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");

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
      router.push(acct.redirect);
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
            Teacher-Hub adapts to each student's skill gaps in real time —
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
            <div className={styles.logoMark}>🎓</div>
            <span className={styles.logoText}>Teacher-Hub</span>
          </div>

          <h2 className={styles.heading}>Welcome back</h2>
          <p className={styles.sub}>Sign in to continue your learning journey.</p>

          {/* Role picker */}
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
              <span className={styles.roleHint}>Monitor students</span>
            </button>
          </div>

          {/* Static account hint */}
          <div className={styles.hint}>
            <div className={styles.hintTitle}>Demo credentials auto-filled ✓</div>
            {role === "student"
              ? "student / learn123"
              : "teacher / teach456"}
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
              Sign in as {role === "student" ? "Student 🎒" : "Teacher 📚"}
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
