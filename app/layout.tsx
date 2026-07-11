import "./globals.css";
import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
