"use client";

import { useRouter } from "next/navigation";

const tools = [
  {
    title: "Crucible Mastering",
    description: "Upload your track for professional mastering.",
    icon: "◉",
    route: "/mastering",
    status: "live",
    primary: true,
  },
  {
    title: "Video Lab",
    description: "Create professional music-video concepts.",
    icon: "▶",
    route: "/video-lab",
    status: "coming-soon",
    primary: false,
  },
  {
    title: "Song Starter",
    description: "Build a structured song blueprint.",
    icon: "✎",
    route: "/song-starter",
    status: "coming-soon",
    primary: false,
  },
  {
    title: "Wordplay",
    description: "Train rhyme patterns and lyrical technique.",
    icon: "W",
    route: "/wordplay",
    status: "coming-soon",
    primary: false,
  },
  {
    title: "Artwork",
    description: "Develop cover-art concepts for your release.",
    icon: "◆",
    route: "/artwork",
    status: "coming-soon",
    primary: false,
  },
  {
    title: "Contact Justice",
    description: "Discuss custom production and creative services.",
    icon: "✦",
    route: "/contact",
    status: "live",
    primary: false,
  },
];

export default function StudioPage() {
  const router = useRouter();

  const openTool = (route: string, status: string) => {
    if (status !== "live") return;
    router.push(route);
  };

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
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:border-orange-300/30 hover:text-orange-200"
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
            Forge your sound.
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/45">
            Start with Crucible Mastering or contact Justice for custom
            production and creative services.
          </p>

          <div className="mt-8 rounded-3xl border border-orange-300/20 bg-gradient-to-br from-orange-500/15 via-orange-950/10 to-black p-6 shadow-[0_25px_70px_rgba(0,0,0,.45)]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-green-300/20 bg-green-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-200">
                    Now available
                  </span>

                  <span className="rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-orange-200">
                    Start here
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  Crucible Mastering
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-6 text-white/50">
                  Upload your song, choose your mastering service, and send it
                  through the forge.
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push("/mastering")}
                className="rounded-2xl bg-orange-400 px-6 py-4 text-sm font-bold text-black transition hover:bg-orange-300"
              >
                Master My Track
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3">
            {tools.map((tool) => {
              const isLive = tool.status === "live";

              return (
                <button
                  key={tool.title}
                  type="button"
                  onClick={() => openTool(tool.route, tool.status)}
                  disabled={!isLive}
                  className={`group relative flex flex-col items-center rounded-3xl border p-4 text-center transition ${
                    isLive
                      ? "border-white/10 bg-white/[0.025] hover:-translate-y-1 hover:border-orange-300/30 hover:bg-orange-400/[0.04]"
                      : "cursor-not-allowed border-white/5 bg-white/[0.015] opacity-45"
                  }`}
                >
                  {!isLive && (
                    <span className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/50 px-2 py-1 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/50">
                      Coming soon
                    </span>
                  )}

                  <div className="flex h-24 w-24 items-center justify-center rounded-[1.6rem] border border-orange-300/20 bg-gradient-to-br from-orange-500/20 via-orange-950/20 to-black text-3xl font-semibold text-orange-100 shadow-[0_18px_45px_rgba(0,0,0,.45)]">
                    {tool.icon}
                  </div>

                  <span className="mt-4 text-sm font-medium text-white/85">
                    {tool.title}
                  </span>

                  <span className="mt-2 text-xs leading-5 text-white/35">
                    {tool.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
