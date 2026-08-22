import Link from "next/link";
export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Teacher-Hub</h1>
      <p>Grades 4-6 Math tutor (hackathon MVP)</p>
      <p><Link href="/student">Start as student</Link></p>
      <p><Link href="/tutor">Tutor flow</Link></p>
    </main>
  );
}
