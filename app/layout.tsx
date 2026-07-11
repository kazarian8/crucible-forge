import "./globals.css";
import type { Metadata } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Crucible Forge",
    template: "%s | Crucible Forge",
  },
  description:
    "Connect every AI. Unify every dataset. Power every intelligent application.",
  keywords: [
    "AI",
    "Artificial Intelligence",
    "Developer Platform",
    "Infrastructure",
    "API",
    "LLM",
    "Crucible Forge",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
