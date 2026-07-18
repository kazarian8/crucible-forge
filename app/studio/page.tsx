"use client";

import { useRouter } from "next/navigation";

const tools = [
  {
    title: "Mastering",
    icon: "◉",
    route: "/mastering",
  },
  {
    title: "Video Lab",
    icon: "▶",
    route: "/video-lab",
  },
  {
    title: "Song Starter",
    icon: "✎",
    route: "/song-starter",
  },
  {
    title: "Wordplay",
    icon: "W",
    route: "/wordplay",
  },
  {
    title: "Artwork",
    icon: "◆",
    route: "/artwork",
  },
  {
    title: "Contact",
    icon: "✦",
    route: "/contact",
  },
];

export default function StudioPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#080604] text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-orange-300/20 bg-orange-400/10 text-orange-200">
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

        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70"
          aria-label="Return home"
        >
          ⏻
        </button>
      </header>

      <section className="px-5 pb-16 pt-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
            The Crucible Studio
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            Choose a tool
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
            Open a Crucible application to create, refine, train, design, or
            connect.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-3">
            {tools.map((tool) => (
              <button
                key={tool.title}
                type="button"
                onClick={() => router.push(tool.route)}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-28 w-28 items-center justify-center rounded-[1.8rem] border border-orange-300/20 bg-gradient-to-br from-orange-500/20 via-orange-950/20 to-black text-3xl font-semibold text-orange-100 shadow-[0_18px_45px_rgba(0,0,0,.45)]">
                  {tool.icon}
                </div>

                <span className="mt-3 text-sm font-medium text-white/80">
                  {tool.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
