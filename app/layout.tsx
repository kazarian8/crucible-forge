import "./globals.css";
import CreditBalance from "../components/CreditBalance";
import FurnaceSwitcher from "../components/FurnaceSwitcher";
import PictureFurnaceSoundTrigger from "../components/PictureFurnaceSoundTrigger";
import SequencerClipGestureGuard from "../components/SequencerClipGestureGuard";
import SupportDock from "../components/SupportDock";
import type { Metadata } from "next";
import { Gochi_Hand, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const gochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-gochi-hand" });

export const metadata: Metadata = {
  title: { default: "Crucible Forge", template: "%s | Crucible Forge" },
  description: "AI-assisted file DNA analysis, editing, repair, transformation, and verification infrastructure for creators.",
  keywords: ["AI", "File DNA", "AI Editing", "Audio Mastering", "Music Production", "Image Editing", "Video Analysis", "Creative Infrastructure", "Crucible Forge"],
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${gochiHand.variable}`}>
      <body>
        <FurnaceSwitcher />
        {children}
        <PictureFurnaceSoundTrigger />
        <SequencerClipGestureGuard />
        <CreditBalance />
        <SupportDock />
      </body>
    </html>
  );
}
