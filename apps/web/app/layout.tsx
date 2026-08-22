import "./globals.css";

export const metadata = {
  title: "UnStuck — AI Math Tutor",
  description: "Adaptive math tutoring for grades 4–6",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
