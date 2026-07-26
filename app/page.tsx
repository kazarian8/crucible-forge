"use client";

const furnaceModules = [
  {
    status: "LIVE",
    eyebrow: "First Active Furnace Module",
    title: "Prompt Reforge",
    tagline:
      "Upload any video. Break down its visual DNA. Reforge it into a production-ready prompt.",
    description:
      "Turn a finished reference video into a complete recreation blueprint for modern AI video platforms.",
    href: "/prompt-reforge",
    button: "Enter Prompt Reforge",
    live: true,
    features: [
      "Master recreation prompt",
      "Scene-by-scene prompts",
      "Camera and movement breakdown",
      "Lighting, effects, and editing recipe",
      "Platform-specific prompt versions",
      "Negative prompt",
    ],
  },
  {
    status: "FORGING SOON",
    eyebrow: "Developer Furnace Module",
    title: "Crucible Code Furnace",
    tagline: "Refine. Repair. Harden.",
    description:
      "Paste or upload broken code, JSON, YAML, environment files, or configuration files and receive a clean production-ready replacement.",
    href: "/code-furnace",
    button: "Preview Code Furnace",
    live: false,
    features: [
      "Full-file repair",
      "Syntax and structure validation",
      "Preserves the original format",
      "Explains critical repairs",
      "Returns production-ready output",
      "Built for code and configuration files",
    ],
  },
  {
    status: "FORGING SOON",
    eyebrow: "Audio Furnace Module",
    title: "Crucible Mastering",
    tagline: "Raw recording in. Release-ready sound out.",
    description:
      "Upload a track for a private mastering workflow, preview improvements, and request a full professional finish.",
    href: "/mastering",
    button: "Preview Mastering",
    live: false,
    features: [
      "Private audio upload",
      "Quick-remaster preview",
      "Full mastering option",
      "Release preparation",
      "Personal Justice review",
      "Automatic source deletion",
    ],
  },
  {
    status: "FORGING SOON",
    eyebrow: "Visual Furnace Module",
    title: "Artwork Forge",
    tagline: "Turn a rough concept into finished visual direction.",
    description:
      "Build cover art, promotional graphics, visual concepts, and production-ready image prompts from a single creative brief.",
    href: "/artwork-forge",
    button: "Preview Artwork Forge",
    live: false,
    features: [
      "Album-cover direction",
      "Prompt generation",
      "Visual identity guidance",
      "Platform-ready dimensions",
      "Revision workflow",
      "Private project storage",
    ],
  },
];

const privacyPromises = [
  "No behavioral advertising trackers",
  "No sale of user data",
  "No training on private uploads",
  "Minimal operational logging",
  "Private file access",
  "Automatic deletion controls",
];

const lessons = [
  {
    title: "AI Song Creation",
    description:
      "Build stronger prompts, concepts, vocals, song structures, and alternate versions.",
  },
  {
    title: "Lyrics & Arrangement",
    description:
      "Improve hooks, verses, pacing, transitions, storytelling, and complete song structure.",
  },
  {
    title: "Mixing & Mastering",
    description:
      "Prepare a track for professional mastering and release across major streaming platforms.",
  },
  {
    title: "Release Preparation",
    description:
      "Organize audio, artwork, credits, metadata, and other release materials.",
  },
  {
    title: "Distribution Walkthrough",
    description:
      "Get step-by-step guidance for releasing eligible music through a distributor.",
  },
  {
    title: "Promotion Strategy",
    description:
      "Create a practical campaign for TikTok, YouTube Shorts, Instagram Reels, and more.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <section className="relative min-h-screen overflow-hidden">
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl"
          style={{
            backgroundImage: "url('/crucible-studio.jpg.PNG')",
          }}
        />

        <div className="absolute inset-0 bg-black/60" />

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative min-h-screen w-full max-w-[1536px] overflow-hidden">
            <img
              src="/crucible-studio.jpg.PNG"
              alt="Crucible Forge recording studio surrounded by redwoods"
              className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-black/30 to-black/95" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/80 via-black/25 to-black/45" />

            <div className="absolute left-5 top-5 z-20 rounded-2xl border border-white/15 bg-black/70 px-4 py-3 backdrop-blur-md md:left-8 md:top-8">
              <p className="text-sm font-semibold tracking-[0.22em] text-orange-200">
                CRUCIBLE PRIVATE AI
              </p>

              <p className="mt-1 text-xs text-white/55">
                Everything enters raw. Everything leaves reforged.
              </p>
            </div>

            <div className="relative z-30 flex min-h-screen items-end px-5 pb-8 pt-28 sm:items-center sm:pb-12 md:px-8">
              <div className="w-full max-w-3xl rounded-[2rem] border border-orange-400/30 bg-black/82 p-6 shadow-[0_30px_100px_rgba(0,0,0,.85)] backdrop-blur-xl sm:p-8 md:p-10">
                <div className="inline-flex rounded-full border border-orange-300/25 bg-orange-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200 sm:text-xs">
                  One Furnace. Unlimited Possibilities.
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl md:text-7xl">
                  Create without being watched.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/72 sm:text-base">
                  The Crucible Furnace is one private workspace built to reforge
                  video, code, music, artwork, and unfinished ideas into complete,
                  production-ready results. Prompt Reforge is live now. New
                  Furnace modules will be added as the platform expands.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#furnace"
                    className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_16px_45px_rgba(249,115,22,.25)] transition hover:brightness-110"
                  >
                    Enter the Furnace
                  </a>

                  <a
                    href="/prompt-reforge"
                    className="flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.05] px-7 py-4 text-center text-sm font-bold text-white transition hover:border-orange-400/60 hover:text-orange-200"
                  >
                    Launch Prompt Reforge
                  </a>
                </div>

                <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                      Private
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      No behavioral ad tracking.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                      Expandable
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      New modules enter one Furnace.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                      Usable
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Complete output—not fragments.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="furnace"
        className="relative overflow-hidden border-t border-white/10 bg-[#090604] px-6 py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_48%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
              The Crucible Furnace
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              One core platform built for continuous expansion.
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-300">
              Every Furnace module follows the same process: bring in raw
              material, preserve what matters, remove weak points, and leave
              with a stronger finished result.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-2">
            {furnaceModules.map((tool, index) => (
              <article
                key={tool.title}
                className={`group relative overflow-hidden rounded-[2rem] border p-7 shadow-2xl transition duration-300 sm:p-9 ${
                  tool.live
                    ? "border-orange-500/55 bg-zinc-950/90 hover:-translate-y-1 hover:border-orange-400"
                    : "border-zinc-800 bg-zinc-950/70"
                }`}
              >
                <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl transition group-hover:bg-orange-500/20" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
                        {tool.eyebrow}
                      </p>

                      <span
                        className={`mt-3 inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${
                          tool.live
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-white/[0.06] text-white/45"
                        }`}
                      >
                        {tool.status}
                      </span>
                    </div>

                    <span className="text-sm font-black text-white/25">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                    {tool.title}
                  </h3>

                  <p className="mt-3 text-lg font-bold leading-7 text-orange-200">
                    {tool.tagline}
                  </p>

                  <p className="mt-5 leading-7 text-zinc-400">
                    {tool.description}
                  </p>

                  <div className="mt-7 grid gap-3 sm:grid-cols-2">
                    {tool.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3"
                      >
                        <span className="mt-0.5 text-orange-400">◆</span>
                        <span className="text-sm leading-6 text-zinc-300">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  <a
                    href={tool.href}
                    className={`mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-2xl px-7 py-4 text-center font-black transition ${
                      tool.live
                        ? "bg-orange-500 text-black hover:bg-orange-400"
                        : "border border-zinc-700 bg-white/[0.03] text-white hover:border-orange-500 hover:text-orange-300"
                    }`}
                  >
                    {tool.button}
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.11),transparent_55%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="rounded-[2rem] border border-orange-500/25 bg-gradient-to-br from-orange-500/10 via-zinc-950 to-black p-8 shadow-2xl sm:p-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
                  The Crucible Privacy Standard
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                  Your work belongs to you.
                </h2>

                <p className="mt-5 max-w-2xl leading-8 text-zinc-300">
                  Crucible is being built around private processing, minimal data
                  collection, and clear deletion controls. We do not need to
                  follow creators around the internet to build useful tools.
                </p>

                <a
                  href="/privacy"
                  className="mt-7 inline-flex min-h-14 items-center justify-center rounded-2xl border border-orange-500/40 px-8 py-4 font-black text-orange-200 transition hover:bg-orange-500 hover:text-black"
                >
                  Read the Privacy Standard
                </a>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {privacyPromises.map((promise) => (
                  <div
                    key={promise}
                    className="flex min-h-24 items-center gap-4 rounded-2xl border border-white/10 bg-black/45 p-5"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 font-black text-black">
                      ✓
                    </div>

                    <p className="font-bold leading-6 text-zinc-200">
                      {promise}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
              Limited security, payment, and error records may still be retained
              when required to operate the service, prevent abuse, or comply
              with law. Crucible will disclose those uses clearly.
            </p>
          </div>
        </div>
      </section>

      <section
        id="private-lessons"
        className="relative overflow-hidden border-t border-white/10 bg-zinc-950 px-6 py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_45%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-orange-400">
              Work Directly With Justice
            </p>

            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Human guidance when AI output is not enough.
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Bring your song, unfinished project, creative idea, or release
              problem. Justice will personally help turn it into a practical
              finished plan.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {lessons.map((lesson, index) => (
              <article
                key={lesson.title}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/80 p-7 shadow-xl backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-500/60"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-black shadow-[0_0_35px_rgba(249,115,22,.25)]">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <h3 className="text-xl font-bold">{lesson.title}</h3>

                <p className="mt-3 leading-7 text-zinc-400">
                  {lesson.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-12 rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-8 text-center shadow-2xl sm:p-12">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
              Private One-on-One Guidance
            </p>

            
            <h3 className="mt-3 text-3xl font-black sm:text-4xl">
              Build Your Release With Justice
            </h3>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-zinc-300">
              No generic course and no confusing tutorial chain—just direct
              help, practical steps, and a release plan built around your actual
              project.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/contact?service=private-lesson"
                className="rounded-xl bg-orange-500 px-8 py-4 font-black text-black transition hover:bg-orange-400"
              >
                Book a Private Lesson
              </a>

              <a
                href="#furnace"
                className="rounded-xl border border-zinc-700 px-8 py-4 font-bold text-white transition hover:border-orange-500 hover:text-orange-300"
              >
                Return to the Furnace
              </a>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-zinc-500">
            Lessons provide creative education and release guidance. Results,
            audience growth, selection, and earnings are not guaranteed. Artists
            are responsible for owning or obtaining the rights required for
            their music.
          </p>
        </div>
      </section>
    </main>
  );
}
