import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MASJID360 — Pengurusan Masjid",
  description: "Pengurusan kewangan masjid dan surau mengikut Garis Panduan MAIS. Oleh Fathi Global.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
