Replace the entire contents of app/page.tsx with this:

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
      {/* Main giveaway funnel */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Blurred background fills unused screen space */}
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-45 blur-2xl"
          style={{
            backgroundImage: "url('/crucible-studio.jpg.PNG')",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        {/* Main studio image */}
        <div className="relative flex min-h-screen items-center justify-center">
          <div className="relative min-h-screen w-full max-w-[1536px] overflow-hidden">
            <img
              src="/crucible-studio.jpg.PNG"
              alt="Crucible Forge recording studio surrounded by redwoods"
              className="absolute inset-0 h-full w-full object-cover object-center md:object-contain"
            />
            {/* Cinematic shading */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/80" />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/20" />
            {/* Small brand label */}
            <div className="absolute left-5 top-5 z-20 rounded-2xl border border-white/15 bg-black/60 px-4 py-3 backdrop-blur-md md:left-8 md:top-8">
              <p className="text-sm font-semibold tracking-[0.22em] text-orange-200">
                CRUCIBLE FORGE
              </p>
              <p className="mt-1 text-xs text-white/55">
                Music forged without compromise
              </p>
            </div>
            {/* Main funnel card */}
            <div className="relative z-30 flex min-h-screen items-end px-5 pb-8 pt-28 sm:items-center sm:pb-12 md:px-8">
              <div className="w-full max-w-2xl rounded-[2rem] border border-orange-400/30 bg-black/75 p-6 shadow-[0_30px_100px_rgba(0,0,0,.75)] backdrop-blur-xl sm:p-8 md:p-10">
                <div className="inline-flex rounded-full border border-orange-300/25 bg-orange-400/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200 sm:text-xs">
                  Crucible Forge Artist Giveaway
                </div>
                <h1 className="mt-6 text-4xl font-black leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
                  Sign up to win a free full remaster and distribution.
                </h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/70 sm:text-base">
                  Create your free Crucible account and upload one song. Every
                  new artist receives access to a free quick-remaster sample and
                  an eligible entry for a chance to win a complete Justice Full
                  Forge remaster plus music distribution.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                      Step 1
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Create your account
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                      Step 2
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Upload your song
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-300">
                      Step 3
                    </p>
                    <p className="mt-2 text-sm text-white/70">
                      Claim your free sample
                    </p>
                  </div>
                </div>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="/login?next=/mastering"
                    className="flex min-h-14 flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-4 text-center text-sm font-black text-black shadow-[0_16px_45px_rgba(249,115,22,.25)] transition hover:brightness-110"
                  >
                    Sign Up and Enter Giveaway
                  </a>
                  <a
                    href="/login?next=/mastering"
                    className="flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-white/[0.05] px-7 py-4 text-center text-sm font-bold text-white transition hover:border-orange-400/60 hover:text-orange-200"
                  >
                    Log In
                  </a>
                </div>
                <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-xs leading-5 text-white/40">
                    You keep ownership of your music. A free quick-remaster
                    sample is a short preview. Giveaway entry does not guarantee
                    selection as the full-remaster and distribution winner.
                  </p>
                  <a
                    href="/studio"
                    className="shrink-0 text-xs font-bold uppercase tracking-[0.18em] text-orange-300 transition hover:text-orange-200"
                  >
                    Explore Studio →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* How the funnel works */}
      <section className="relative overflow-hidden border-t border-white/10 bg-[#090604] px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_48%)]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">
              Your Free Signup Reward
            </p>
            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Hear what the Forge can do to your song.
            </h2>
            <p className="mt-5 text-base leading-8 text-zinc-300">
              After signup, you will go directly to the secure mastering page.
              Upload one eligible track, add your artist information, and submit
              it for a free quick-remaster sample.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <article className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-black">
                1
              </div>
              <h3 className="mt-5 text-xl font-bold">Create your account</h3>
              <p className="mt-3 leading-7 text-zinc-400">
                Sign up with your email so your uploads, requests, and giveaway
                entry stay connected to you.
              </p>
            </article>
            <article className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-black">
                2
              </div>
              <h3 className="mt-5 text-xl font-bold">Upload your track</h3>
              <p className="mt-3 leading-7 text-zinc-400">
                Send a WAV, MP3, M4A, AAC, or FLAC through the private Crucible
                upload system.
              </p>
            </article>
            <article className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-lg font-black text-black">
                3
              </div>
              <h3 className="mt-5 text-xl font-bold">Enter the Forge</h3>
              <p className="mt-3 leading-7 text-zinc-400">
                Request your short sample and receive an eligible entry for the
                full Justice Full Forge remaster and distribution giveaway.
              </p>
            </article>
          </div>
          <div className="mt-10 text-center">
            <a
              href="/login?next=/mastering"
              className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-8 py-4 font-black text-black transition hover:bg-orange-400"
            >
              Claim My Free Quick-Remaster Sample
            </a>
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
