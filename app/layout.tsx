import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Shani Nakash-Gomel | Portfolio",
  description: "Portfolio of Shani Nakash-Gomel, Senior UX Strategist and Innovation Lead.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
