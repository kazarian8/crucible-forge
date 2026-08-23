import "./globals.css";
import CreditBalance from "../components/CreditBalance";
import ArtistBottomNav from "../components/ArtistBottomNav";
import SequencerClipGestureGuard from "../components/SequencerClipGestureGuard";
import SupportDock from "../components/SupportDock";
import type { Metadata } from "next";
import { Gochi_Hand, JetBrains_Mono, Space_Grotesk } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const gochiHand = Gochi_Hand({ weight: "400", subsets: ["latin"], variable: "--font-gochi-hand" });

export const metadata: Metadata = {
  title: { default: "Crucible Forge", template: "%s | Crucible Forge" },
  description: "A private independent-artist network for making music, collaborating, sharing releases, and getting discovered.",
  keywords: ["independent artists", "music collaboration", "DAW", "music production", "beats", "samples", "artist discovery", "Crucible Forge"],
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${gochiHand.variable}`}>
      <body className="pb-20 md:pb-0">
        {children}
        <ArtistBottomNav />
        <SequencerClipGestureGuard />
        <CreditBalance />
        <SupportDock />
      </body>
    </html>
  );
}
