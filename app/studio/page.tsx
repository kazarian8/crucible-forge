"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Tool = {
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  route?: string;
};

const tools: Tool[] = [
  {
    title: "Crucible Mastering",
    shortTitle: "Mastering",
    description:
      "Upload your track, preview it, and submit it for professional mastering.",
    icon: "◉",
    route: "/mastering",
  },
  {
    title: "AI Video Lab",
    shortTitle: "Video Lab",
    description:
      "Develop cinematic music-video concepts, scenes, and visual prompts.",
    icon: "▶",
  },
  {
    title: "Song Starter",
    shortTitle: "Song Starter",
    description:
      "Generate concepts, structures, rhyme directions, and writing ideas.",
    icon: "✎",
  },
  {
    title: "Wordplay Training",
    shortTitle: "Wordplay",
    description:
      "Practice rhyme stacks, syllable patterns, cadence, and delivery.",
    icon: "W",
  },
  {
    title: "Artwork Forge",
    shortTitle: "Artwork",
    description:
      "Create album covers, posters, merchandise, and promotional visuals.",
    icon: "◆",
  },
  {
    title: "Book Justice",
    shortTitle: "Contact",
    description:
      "Contact Justice for production, engineering, artwork, and creative work.",
    icon: "✦",
    route: "/contact",
  },
];

export default function StudioPage() {
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  function openTool(tool: Tool) {
    if (tool.route) {
      router.push(tool.route);
      return;
    }

    setSelectedTool(tool);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080604] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_15%_80%,rgba(120,53,15,0.18),transparent_35%),linear-gradient(145deg,#120b06_0%,#070504_46%,#020202_100%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />

      <header className="relative z-30 flex h-16 items-center justify-between border-b border-white/10 bg-black/45 px-4 backdrop-blur-xl md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-400/10 text-orange-200">
            ✦
