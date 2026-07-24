"use client";

const forgeTools = [
  {
    eyebrow: "Featured Creator Tool",
    title: "Prompt Reforge",
    tagline: "Upload any video. Break down its visual DNA. Reforge it into a production-ready prompt.",
    description:
      "Turn a finished reference video into a complete recreation blueprint for modern AI video platforms.",
    href: "/prompt-reforge",
    button: "Enter Prompt Reforge",
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
    eyebrow: "Featured Developer Tool",
    title: "Crucible Code Furnace",
    tagline: "Refine. Repair. Harden.",
    description:
      "Paste or upload broken code, JSON, YAML, environment files, or configuration files and receive a clean production-ready replacement.",
    href: "/code-furnace",
    button: "Enter Code Furnace",
    features: [
      "Full-file repair",
      "Syntax and structure validation",
      "Preserves the original format",
      "Explains critical repairs",
      "Returns production-ready output",
      "Built for code and configuration files",
    ],
  },
];

const lessons = [
  {
    title: "AI Song Creation",
    description:
      "Learn how to build stronger prompts, concepts, vocals, song structures, and alternate versions.",
  },
  {
    title: "Lyrics & Arrangement",
    description:
      "Improve your hooks, verses, pacing, transitions, storytelling, and complete song structure.",
  },
  {
    title: "Mixing & Mastering",
    description:
      "Prepare your track for professional mastering and release across major streaming platforms.",
  },
  {
    title: "Release Preparation",
    description:
      "Organize your audio, artwork, credits, metadata, and other release materials.",
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

        <div className="absolute inset-0 bg-black/55" />

        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative min-h-screen w-full max-w-[1536px] overflow-hidden">
            <img
              src="/crucible-studio.jpg.PNG"
              alt="Crucible Forge recording studio surrounded by redwoods"
              className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/70 via-black/25 to-black/90" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/20 to-black/35" />

            <div className="absolute left-5 top-5 z-20 rounded-2xl border border-white/15 bg-black/65 px-4 py-3 backdrop-blur-md md:left-8 md:top-8">
              <p className="text-sm font-semibold tracking-[0.22em] text-orange-200">
                CRUCIBLE
              </p>

              <p className="mt-1 text-xs text-white/55">
                Everything enters raw. Everything leaves reforged.
              </p>
            </div>

            <div className="relative z-30 flex min-h-screen items-end px-5 pb-8 pt-28 sm:items-center sm:pb-12 md:px-8">
              <div className="w-full max-w-3xl rounded-[2rem] border border-orange-400/30 bg-black/78 p-6 shadow-[0_30px_100px_rgba(0,0,0,.8)] backdrop-blur-xl sm:p-8 md:p-10">
                <div className="inline-flex rounded-full border border-orange-300/25 bg-orange-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200 sm:text-xs">
                  The Creative and Technical Forge
                </div>

                <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl md:text-7xl">
                  Refine what&apos;s rough. Repair what&apos;s broken. Reforge
                  what&apos;s possible.
                </h1>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                  Crucible turns videos, prompts, code, music, artwork, and raw
                  ideas into stronger production-ready results. Start with
                  Prompt Reforge, repair a file inside Code Furnace, or enter the
                  full creative studio.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/prompt-reforge"
                    className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_16px_45px_rgba(249,115,22,.25)] transition hover:brightness-110"
                  >
                    Open Prompt Reforge
                  </a>

                  <a
                    href="#featured-tools"
                    className="flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.05] px-7 py-4 text-center text-sm font-bold text-white transition hover:border-orange-400/60 hover:text-orange-200"
                  >
                    Explore the Forge
                  </a>
                </div>

                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-xs leading-5 text-white/45">
                    Built for creators, artists, developers, and independent
                    builders who need complete usable output—not fragments.
                  </p>

                  <a
                    href="/studio"
                    className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-orange-300 transition hover:text-orange-200"
                  >
                    Enter Full Studio →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="featured-tools"
        className="relative overflow-hidden border-t border-white/10 bg-[#090604] px-6 py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.16),transparent_48%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
              Featured Crucible Tools
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Bring in the raw material. Leave with something usable.
            </h2>

            <p className="mt-5 text-base leading-8 text-zinc-300">
              Every Crucible tool follows the same promise: analyze the source,
              remove the weak points, preserve what matters, and return a
              stronger finished result.
            </p>
          </div>

          <div className="mt-14 grid gap-7 lg:grid-cols-2">
            {forgeTools.map((tool, index) => (
              <article
                key={tool.title}
                className="group relative overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950/85 p-7 shadow-2xl transition duration-300 hover:-translate-y-1 hover:border-orange-500/55 sm:p-9"
              >
                <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-orange-500/10 blur-3xl transition group-hover:bg-orange-500/20" />

                <div className="relative">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
                      {tool.eyebrow}
                    </p>

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
                    className="mt-8 inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-center font-black text-black transition hover:bg-orange-400"
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
            <div className="grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
                  Crucible Mastering
                </p>

                <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                  Sign up for a free quick-remaster sample.
                </h2>

                <p className="mt-5 max-w-2xl leading-8 text-zinc-300">
                  Create your Crucible account, upload one eligible song, and
                  hear a short preview of what the Forge can do. Your submission
                  can also qualify for the Justice Full Forge remaster and
                  distribution giveaway.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/login?next=/mastering"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-8 py-4 font-black text-black transition hover:bg-orange-400"
                  >
                    Sign Up and Upload
                  </a>

                  <a
                    href="/studio"
                    className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-zinc-700 px-8 py-4 font-bold text-white transition hover:border-orange-500 hover:text-orange-300"
                  >
                    Explore Music Tools
                  </a>
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  "Create your free account",
                  "Upload WAV, MP3, M4A, AAC, or FLAC",
                  "Request your quick-remaster sample",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/45 p-5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 font-black text-black">
                      {index + 1}
                    </div>

                    <p className="font-bold text-zinc-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-8 border-t border-white/10 pt-5 text-xs leading-5 text-zinc-500">
              You keep ownership of your music. A free quick-remaster sample is
              a short preview. Giveaway entry does not guarantee selection as
              the full-remaster and distribution winner.
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
              Learn Directly From Justice
            </p>

            <h2 className="text-4xl font-black leading-tight sm:text-5xl">
              Take Your AI Song From an Idea to an Official Release
            </h2>

            <p className="mt-6 text-lg leading-8 text-zinc-300">
              Bring your song, unfinished project, or creative idea. Justice
              will personally walk you through the process using your own music
              and help you leave with a clear release plan.
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
              Every lesson is built around your actual music. No generic course
              and no confusing tutorials—just direct help, practical steps, and
              a release plan you can use immediately.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href="/contact?service=private-lesson"
                className="rounded-xl bg-orange-500 px-8 py-4 font-black text-black transition hover:bg-orange-400"
              >
                Book a Private Lesson
              </a>

              <a
                href="/studio"
                className="rounded-xl border border-zinc-700 px-8 py-4 font-bold text-white transition hover:border-orange-500 hover:text-orange-300"
              >
                Explore the Crucible
              </a>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-zinc-500">
            Lessons provide creative education and release guidance. Results,
            audience growth, giveaway selection, and earnings are not
            guaranteed. Artists are responsible for owning or obtaining the
            rights required for their music.
          </p>
        </div>
      </section>
    </main>
  );
}
