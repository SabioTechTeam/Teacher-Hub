import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", color: "#f8fafc", fontFamily: "system-ui, sans-serif", padding: "48px 20px" }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", borderRadius: 999, padding: "6px 16px", color: "#a5b4fc", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
            <span>✦</span> AI Teaching Operating System · Grades 4–6 Math
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.15, margin: "0 0 16px" }}>
            Personalized Math Practice at <span style={{ background: "linear-gradient(to right, #818cf8, #38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Classroom Scale</span>
          </h1>
          <p style={{ fontSize: 18, color: "#94a3b8", maxWidth: 680, margin: "0 auto", lineHeight: 1.6 }}>
            One teacher supported by AI that continuously understands student mastery, diagnoses prerequisite gaps, generates verified worksheets, and adapts in real time.
          </p>
          <div style={{ marginTop: 28, display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{ padding: "14px 32px", background: "#4F46E5", color: "#ffffff", borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: "none", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.4)" }}
            >
              Sign In to Portal →
            </Link>
            <Link
              href="/student"
              style={{ padding: "14px 24px", background: "rgba(255,255,255,0.08)", color: "#f1f5f9", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, fontWeight: 600, fontSize: 16, textDecoration: "none" }}
            >
              Take 10-Min Diagnostic 📝
            </Link>
          </div>
        </header>

        {/* Feature Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 48 }}>
          
          {/* Card 1: Student App */}
          <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>🎒</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>Student Dashboard</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
              View personalized skill mastery, track learning streaks, and receive tailored practice recommendations.
            </p>
            <Link
              href="/student/dashboard"
              style={{ display: "inline-block", color: "#818cf8", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
            >
              Open Student View →
            </Link>
          </div>

          {/* Card 2: Teacher Copilot */}
          <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>📚</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>Teacher Copilot</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
              Classroom mastery heatmaps, at-risk student alerts, and "Why is this student struggling?" prerequisite gap insights.
            </p>
            <Link
              href="/teacher/dashboard"
              style={{ display: "inline-block", color: "#38bdf8", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
            >
              Open Teacher View →
            </Link>
          </div>

          {/* Card 3: Adaptive Tutor & Worksheet */}
          <div style={{ background: "rgba(30, 41, 59, 0.7)", backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 32, marginBottom: 14 }}>⚡</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", color: "#ffffff" }}>Adaptive Worksheet Engine</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.5, margin: "0 0 20px" }}>
              Live OpenRouter generation, exact fraction math checking, and dynamic difficulty adjustment based on student answers.
            </p>
            <Link
              href="/tutor"
              style={{ display: "inline-block", color: "#34d399", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
            >
              Launch Live Tutor →
            </Link>
          </div>

        </div>

        {/* Demo Footer */}
        <footer style={{ textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.1)", paddingTop: 24, color: "#64748b", fontSize: 13 }}>
          Teacher-Hub Hackathon Architecture · Demo Credentials: <code>student / learn123</code> or <code>teacher / teach456</code>
        </footer>

      </div>
    </main>
  );
}
