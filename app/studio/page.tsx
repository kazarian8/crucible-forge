"use client";

import { useRouter } from "next/navigation";

const tools = [
  {
    title: "Crucible Mastering",
    description: "Upload and prepare your music for professional mastering.",
  },
  {
    title: "AI Video Lab",
    description: "Build cinematic visuals and music-video concepts.",
  },
  {
    title: "Song Starter",
    description: "Create concepts, structures, rhyme patterns, and direction.",
  },
  {
    title: "Wordplay Training",
    description: "Practice cadence, syllable stacks, multis, and delivery.",
  },
  {
    title: "Artwork Forge",
    description: "Create covers, posters, merchandise, and promotional art.",
  },
  {
    title: "Book Justice",
    description: "Contact Justice for custom production and creative services.",
  },
];

export default function StudioPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#080604] px-5 py-8 text-white md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-orange-300">
              Crucible Operating System
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-5xl">
              The Studio
            </h1>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Leave studio
          </button>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.title}
              type="button"
              className="group min-h-56 rounded-[2rem] border border-orange-300/15 bg-gradient-to-b from-orange-500/[0.08] to-white/[0.025] p-7 text-left shadow-[0_25px_70px_rgba(0,0,0,.4)] transition hover:-translate-y-1 hover:border-orange-300/40 hover:bg-orange-500/[0.12]"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-300/20 bg-orange-400/10 text-2xl">
                ✦
              </div>

              <h2 className="mt-7 text-xl font-semibold">{tool.title}</h2>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {tool.description}
              </p>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
