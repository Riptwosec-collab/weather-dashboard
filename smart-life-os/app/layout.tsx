import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Life OS | Thai Personal Dashboard",
  description: "Modular AI dashboard for weather, food, market, and tech tools for Thai users.",
  applicationName: "Smart Life OS",
  keywords: ["dashboard", "Thailand", "weather", "finance", "tech tools", "AI briefing"]
};

export const viewport: Viewport = {
  themeColor: "#020617",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
