import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TalentDash — Compensation Intelligence Platform",
  description: "Explore salaries, compare total compensation, discover company reviews, levels, interview experiences, and career insights.",
  keywords: ["compensation", "salaries", "benchmarks", "salary comparison", "levels", "job reviews"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Material Symbols Icon Font */}
        <link 
          rel="stylesheet" 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" 
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
