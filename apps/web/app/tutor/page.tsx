import Link from "next/link";

export default function TutorPage() {
  return (
    <main style={{ padding: 24, fontFamily: "system-ui" }}>
      <h1>Tutor</h1>
      <p>The adaptive loop: quiz → level → worksheet → grade → adapt.</p>
      <p><Link href="/worksheet">Open worksheet flow →</Link></p>
    </main>
  );
}
