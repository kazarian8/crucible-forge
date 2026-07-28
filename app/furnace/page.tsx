"use client";

import Link from "next/link";

type FurnaceCard = {
  name: string;
  description: string;
  href?: string;
  status: "active" | "coming-soon";
  badge: string;
};

const furnaces: FurnaceCard[] = [
  {
    name: "Prompt Reforge",
    description:
      "Upload a finished video and extract its visual DNA, scene structure, camera movement, lighting, effects, and production-ready prompts.",
    href: "/prompt-reforge",
    status: "active",
    badge: "ACTIVE",
  },
  {
    name: "Code Furnace",
    description:
      "Repair broken code, JSON, YAML, environment files, and configuration files while preserving the original structure.",
    status: "coming-soon",
    badge: "COMING SOON",
  },
  {
    name: "Sound Furnace",
    description:
      "Refine, repair, and prepare audio for professional release with intelligent mastering tools.",
    status: "coming-soon",
    badge: "COMING SOON",
  },
  {
    name: "Artwork Forge",
    description:
      "Turn rough creative direction into release-ready artwork, covers, promotional graphics, and visual concepts.",
    status: "coming-soon",
    badge: "COMING SOON",
  },
];

export default function FurnacePage() {
  return (
    <main className="min-h-screen bg-[#090909] text-white">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
        <header className="mb-10 flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="mb-4 inline-flex text-sm font-semibold uppercase tracking-[0.24em] text-orange-400 transition hover:text-orange-300"
            >
              ← Crucible
            </Link>

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.34em] text-zinc-500">
              Everything enters raw. Everything leaves reforged.
            </p>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              Choose Furnace Type
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-zinc-400">
              Select an active furnace to begin. New furnace types will unlock
              as they are completed and hardened for production.
            </p>
          </div>

          <div className="rounded-2xl border border-orange-400/20 bg-orange-400/5 px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-zinc-500">
              Credit balance
            </p>
            <p className="mt-1 text-2xl font-black text-orange-300">5,000</p>
            <p className="text-xs text-zinc-500">Starter credits</p>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2">
          {furnaces.map((furnace) => {
            const isActive = furnace.status === "active";

            const card = (
              <article
                className={[
                  "group relative h-full overflow-hidden rounded-3xl border p-6 transition duration-200 sm:p-7",
                  isActive
                    ? "border-orange-400/35 bg-gradient-to-br from-orange-500/12 via-zinc-950 to-zinc-950 hover:-translate-y-1 hover:border-orange-300/60"
                    : "cursor-not-allowed border-white/10 bg-white/[0.025] opacity-60",
                ].join(" ")}
              >
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div
                    className={[
                      "flex h-12 w-12 items-center justify-center rounded-2xl border text-xl",
                      isActive
                        ? "border-orange-400/30 bg-orange-400/10 text-orange-300"
                        : "border-white/10 bg-white/5 text-zinc-500",
                    ].join(" ")}
                  >
                    🔥
                  </div>

                  <span
                    className={[
                      "rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.18em]",
                      isActive
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/5 text-zinc-500",
                    ].join(" ")}
                  >
                    {furnace.badge}
                  </span>
                </div>

                <h2 className="text-2xl font-black tracking-tight">
                  {furnace.name}
                </h2>

                <p className="mt-3 min-h-[84px] text-sm leading-6 text-zinc-400">
                  {furnace.description}
                </p>

                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-sm font-bold text-zinc-300">
                    {isActive ? "Open furnace" : "In development"}
                  </span>

                  <span
                    className={[
                      "text-xl transition",
                      isActive
                        ? "text-orange-300 group-hover:translate-x-1"
                        : "text-zinc-600",
                    ].join(" ")}
                  >
                    →
                  </span>
                </div>
              </article>
            );

            return isActive && furnace.href ? (
              <Link
                key={furnace.name}
                href={furnace.href}
                className="block rounded-3xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                {card}
              </Link>
            ) : (
              <div key={furnace.name} aria-disabled="true">
                {card}
              </div>
            );
          })}
        </section>

        <section className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Membership
            </p>
            <p className="mt-2 font-bold text-zinc-200">Free month active</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              Furnace access
            </p>
            <p className="mt-2 font-bold text-zinc-200">1 active tool</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
              System status
            </p>
            <p className="mt-2 font-bold text-emerald-300">Operational</p>
          </div>
        </section>
      </div>
    </main>
  );
}
