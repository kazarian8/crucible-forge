"use client";

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
      {/* Studio entrance */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Blurred background fills unused space */}
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
          style={{
            backgroundImage: "url('/crucible-studio.jpg.PNG')",
          }}
        />

        <div className="absolute inset-0 bg-black/35" />

        {/* Main studio image */}
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative h-screen w-full max-w-[1536px] overflow-hidden">
            <img
              src="/crucible-studio.jpg.PNG"
              alt="Crucible Forge recording studio surrounded by redwoods"
              className="h-full w-full object-contain"
            />

            {/* Cinematic shading */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/45" />

            {/* Branding */}
            <div className="absolute left-5 top-5 z-20 rounded-2xl border border-white/15 bg-black/55 px-4 py-3 backdrop-blur-md md:left-8 md:top-8">
              <p className="text-sm font-semibold tracking-[0.22em] text-orange-200">
                CRUCIBLE FORGE
              </p>

              <p className="mt-1 text-xs text-white/55">
                Music forged without compromise
              </p>
            </div>

            {/* Plain link to studio */}
            <a
              href="/studio"
              aria-label="Enter the Crucible studio"
              className="group absolute left-[51.5%] top-[46.8%] z-30 h-[9.8%] w-[12.5%] cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
            >
              <span className="absolute inset-0 rounded-sm border border-orange-300/0 bg-orange-500/0 transition duration-300 group-hover:border-orange-300/60 group-hover:bg-orange-500/15 group-hover:shadow-[0_0_70px_rgba(249,115,22,.75)]" />

              <span className="absolute inset-x-[-55%] top-1/2 -translate-y-1/2 transition group-hover:scale-105">
                <span className="inline-flex rounded-full border border-orange-300/30 bg-black/75 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-100 shadow-2xl backdrop-blur-md sm:text-xs md:px-5 md:py-3">
                  Tap screen to enter
                </span>
              </span>
            </a>

            {/* Bottom instruction */}
            <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-5 md:bottom-8">
              <div className="rounded-full border border-white/15 bg-black/60 px-4 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
                Enter the studio through the monitor
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Private lessons */}
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
              and no confusing tutorials—just direct help, practical steps,
              and a release plan you can use immediately.
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
            audience growth, and earnings are not guaranteed. Artists are
            responsible for owning or obtaining the rights required for their
            music.
          </p>
        </div>
      </section>
    </main>
  );
}
