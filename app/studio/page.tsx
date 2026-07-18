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
      {/* Desktop wallpaper */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(249,115,22,0.16),transparent_34%),radial-gradient(circle_at_15%_80%,rgba(120,53,15,0.18),transparent_35%),linear-gradient(145deg,#120b06_0%,#070504_46%,#020202_100%)]" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />

      {/* Top operating-system bar */}
      <header className="relative z-30 flex h-16 items-center justify-between border-b border-white/10 bg-black/45 px-4 backdrop-blur-xl md:px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-orange-300/25 bg-orange-400/10 text-orange-200">
            ✦
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">
              Crucible OS
            </p>
            <p className="text-[10px] text-white/35">
              Creative system online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-xs text-white/40 sm:flex">
            <span className="h-2 w-2 rounded-full bg-orange-300 shadow-[0_0_12px_rgba(253,186,116,.9)]" />
            Studio active
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Leave studio"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white/65 transition hover:border-orange-300/40 hover:bg-orange-400/10 hover:text-orange-100"
          >
            ⏻
          </button>
        </div>
      </header>

      {/* Desktop area */}
      <section className="relative z-10 min-h-[calc(100vh-4rem)] px-5 pb-28 pt-8 md:px-10 md:pt-12">
        <div className="mx-auto max-w-6xl">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
              The Crucible Studio
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
              Choose a tool
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-white/45 md:text-base">
              Open an application to create, refine, train, design, or connect
              with Crucible Forge.
            </p>
          </div>

          {/* App icons */}
          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {tools.map((tool) => (
              <button
                key={tool.title}
                type="button"
                onClick={() => openTool(tool)}
                className="group flex min-w-0 flex-col items-center text-center"
              >
                <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.7rem] border border-orange-300/20 bg-gradient-to-br from-orange-500/20 via-orange-950/30 to-black/70 text-3xl font-semibold text-orange-100 shadow-[0_18px_45px_rgba(0,0,0,.55)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03] group-hover:border-orange-300/50 group-hover:shadow-[0_20px_60px_rgba(249,115,22,.2)] sm:h-28 sm:w-28">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(255,255,255,.16),transparent_40%)]" />
                  <span className="relative">{tool.icon}</span>
                </div>

                <span className="mt-3 max-w-[120px] text-sm font-medium leading-5 text-white/80 transition group-hover:text-orange-100">
                  {tool.shortTitle}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom dock */}
      <div className="fixed inset-x-0 bottom-4 z-30 flex justify-center px-4">
        <div className="flex items-center gap-2 rounded-[1.6rem] border border-white/10 bg-black/65 p-2 shadow-[0_20px_70px_rgba(0,0,0,.65)] backdrop-blur-2xl">
          {tools.slice(0, 5).map((tool) => (
            <button
              key={tool.title}
              type="button"
              onClick={() => openTool(tool)}
              aria-label={tool.title}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-sm font-semibold text-orange-100 transition hover:-translate-y-1 hover:border-orange-300/40 hover:bg-orange-400/15"
            >
              {tool.icon}
            </button>
          ))}

          <div className="mx-1 h-7 w-px bg-white/10" />

          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Return to landing page"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-lg text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            ⏻
          </button>
        </div>
      </div>

      {/* Application window */}
      {selectedTool && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => setSelectedTool(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selectedTool.title}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-orange-300/20 bg-[#100b07] shadow-[0_40px_120px_rgba(0,0,0,.8)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-black/25 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-400/10 text-orange-100">
                  {selectedTool.icon}
                </div>

                <p className="font-semibold">{selectedTool.title}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300">
                Crucible application
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight">
                {selectedTool.title}
              </h2>

              <p className="mt-4 leading-7 text-white/50">
                {selectedTool.description}
              </p>

              <div className="mt-7 rounded-2xl border border-orange-300/15 bg-orange-400/[0.06] p-5">
                <p className="font-medium text-orange-100">
                  This application is being forged.
                </p>

                <p className="mt-2 text-sm leading-6 text-white/45">
                  We can build this tool next and connect it to its own working
                  page.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="mt-7 w-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 font-semibold text-black transition hover:brightness-110"
              >
                Return to desktop
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
