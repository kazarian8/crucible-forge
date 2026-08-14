import "./globals.css";
import CreditBalance from "../components/CreditBalance";
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
    "Private browser-based audio analysis and quick remastering for independent creators.",
  keywords: [
    "AI",
    "Artificial Intelligence",
    "Audio Mastering",
    "Music Production",
    "Quick Remaster",
    "Crucible Forge",
  ],
  manifest: "/manifest.webmanifest",
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
      <body>
        {children}
        <CreditBalance />
      </body>
    </html>
  );
}
