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

const distributionPlatforms = [
  { name: "Spotify", slug: "spotify", href: "#" },
  { name: "Apple Music", slug: "applemusic", href: "#" },
  { name: "YouTube Music", slug: "youtubemusic", href: "#" },
  { name: "Amazon Music", slug: "amazonmusic", href: "#" },
  { name: "TikTok", slug: "tiktok", href: "#" },
  { name: "Instagram", slug: "instagram", href: "#" },
  { name: "Facebook", slug: "facebook", href: "#" },
  { name: "Pandora", slug: "pandora", href: "#" },
  { name: "Deezer", slug: "deezer", href: "#" },
  { name: "TIDAL", slug: "tidal", href: "#" },
  { name: "SoundCloud", slug: "soundcloud", href: "#" },
  { name: "iHeartRadio", slug: "iheartradio", href: "#" },
  { name: "Napster", slug: "napster", href: "#" },
  { name: "Audiomack", slug: "audiomack", href: "#" },
  { name: "Shazam", slug: "shazam", href: "#" },
  { name: "Qobuz", slug: "qobuz", href: "#" },
  { name: "Beatport", slug: "beatport", href: "#" },
  { name: "Mixcloud", slug: "mixcloud", href: "#" },
  { name: "Snapchat", slug: "snapchat", href: "#" },
  { name: "CapCut", slug: "capcut", href: "#" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f3f3f3] text-[#121826]">
      <style jsx global>{`
        @keyframes anvilFire {
          0%, 100% { transform: translateY(0) scale(1); filter: brightness(.95) drop-shadow(0 0 4px rgba(249,115,22,.45)); opacity: .82; }
          35% { transform: translateY(-2px) scale(1.08,.96); filter: brightness(1.35) drop-shadow(0 0 11px rgba(249,115,22,.9)); opacity: 1; }
          65% { transform: translateY(1px) scale(.96,1.08); filter: brightness(1.12) drop-shadow(0 0 7px rgba(245,158,11,.72)); opacity: .9; }
        }
        @keyframes distroGlow {
          0%, 100% { box-shadow: 0 10px 30px rgba(132,204,22,.18), 0 0 0 1px rgba(190,242,100,.35); }
          50% { box-shadow: 0 18px 42px rgba(132,204,22,.38), 0 0 24px rgba(163,230,53,.28), 0 0 0 1px rgba(217,249,157,.8); }
        }
      `}</style>

      <section className="px-3 py-3 sm:px-5 sm:py-5">
        <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1500px] overflow-hidden rounded-[2rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,.10)] sm:min-h-[calc(100vh-40px)]">
          <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-9 sm:py-5 lg:px-12">
            <a href="/" className="group flex items-center gap-3" aria-label="Crucible home">
              <span className="relative flex h-12 w-14 items-end justify-center">
                <span className="absolute top-0 text-3xl" style={{ animation: "anvilFire 1.05s ease-in-out infinite" }}>🔥</span>
                <span className="relative z-10 text-4xl leading-none text-slate-950">⚒</span>
              </span>
              <span>
                <span className="block text-xl font-black tracking-[0.08em] text-slate-950 sm:text-3xl">CRUCIBLE</span>
                <span className="block text-[8px] font-black uppercase tracking-[0.22em] text-orange-600 sm:text-[9px] sm:tracking-[0.28em]">Refine. Repair. Reforge.</span>
              </span>
            </a>

            <nav className="hidden items-center gap-8 text-sm font-semibold lg:flex">
              <a href="/" className="hover:text-orange-600">Home</a>
              <a href="#furnace" className="hover:text-orange-600">Furnaces</a>
              <a href="#pricing" className="hover:text-orange-600">Pricing</a>
              <a href="/contact" className="hover:text-orange-600">Contact</a>
              <a href="/faq" className="hover:text-orange-600">FAQ</a>
            </nav>

            <a href="/login" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-bold transition hover:border-orange-500 hover:text-orange-600 lg:hidden">Log in</a>
          </header>

          <div className="grid lg:min-h-[790px] lg:grid-cols-2">
            <div className="order-2 flex min-w-0 flex-col justify-center border-b border-slate-200 px-5 py-10 sm:px-10 lg:order-1 lg:border-b-0 lg:border-r lg:px-16 lg:py-14">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.26em] text-orange-600">Private AI tools for creators</p>
              <h1 className="max-w-full break-words text-[2.65rem] font-black uppercase leading-[.95] tracking-[-0.045em] text-slate-950 sm:max-w-2xl sm:text-6xl xl:text-7xl">
                Everything enters raw.
                <span className="mt-1 block text-orange-600">Everything leaves reforged.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                One private Furnace for video, code, music, artwork, and unfinished ideas. Premium unlocks the platform. Credits power each operation.
              </p>

              <a
                href="https://distrokid.com/student/12343575"
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="group mt-8 block w-full max-w-full overflow-hidden rounded-[1.35rem] border border-lime-400 bg-[#0b1220] text-white transition hover:-translate-y-1"
                style={{ animation: "distroGlow 1.8s ease-in-out infinite" }}
                aria-label="Release your music with DistroKid"
              >
                <div className="flex items-center gap-4 px-5 py-5 sm:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime-300 text-2xl">🦖</div>
                    <div className="min-w-0 border-l border-white/25 pl-4">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-lime-300">DistroKid Partner</p>
                      <p className="mt-1 text-lg font-black uppercase leading-tight sm:text-2xl">Finished the track?</p>
                      <p className="text-sm font-bold text-white/80">Release it everywhere.</p>
                    </div>
                  </div>
                  <span className="text-3xl transition group-hover:translate-x-1">›</span>
                </div>

                <div className="border-t border-white/10 bg-black/25 px-0 py-2.5">
                  <div className="flex w-full items-center gap-5 overflow-x-auto whitespace-nowrap px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {distributionPlatforms.map((platform) => (
                      <a
                        key={platform.name}
                        href={platform.href}
                        title={platform.name}
                        aria-label={platform.name}
                        onClick={(event) => {
                          if (platform.href === "#") event.preventDefault();
                        }}
                        className="flex h-8 min-w-8 shrink-0 items-center justify-center opacity-75 transition hover:scale-110 hover:opacity-100"
                      >
                        <img
                          src={`https://cdn.simpleicons.org/${platform.slug}/ffffff`}
                          alt={platform.name}
                          className="h-5 w-5 object-contain"
                          loading="lazy"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              </a>

              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                <div><p className="font-black text-violet-700">Secure</p><p className="text-xs text-slate-500">Private processing</p></div>
                <div><p className="font-black text-orange-600">Fast</p><p className="text-xs text-slate-500">Built for speed</p></div>
                <div><p className="font-black text-emerald-600">Supported</p><p className="text-xs text-slate-500">Creator guidance</p></div>
              </div>
            </div>

            <div className="order-1 flex min-w-0 items-center justify-center border-b border-slate-200 bg-gradient-to-br from-white via-white to-violet-50 px-5 py-10 sm:px-10 lg:order-2 lg:border-b-0 lg:px-14">
              <div className="w-full max-w-xl py-2 sm:py-0">
                <div className="text-center">
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-violet-700">Create your account today</p>
                  <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                    Get one month free + 5,000 points.
                  </h2>
                  <p className="mx-auto mt-3 max-w-lg text-base font-semibold leading-7 text-slate-600">
                    Sign up now for automatic entry into a random drawing. Selected winners will receive one full album professionally remastered by Justice and distributed to more than 40 major music platforms.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">Cancel anytime before renewal.</p>
                </div>

                <form action="/signup" method="get" className="mt-8 space-y-3">
                  <input type="hidden" name="plan" value="premium-trial" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input name="firstName" autoComplete="given-name" placeholder="First Name" className="min-h-14 rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                    <input name="lastName" autoComplete="family-name" placeholder="Last Name" className="min-h-14 rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                  </div>
                  <input type="email" name="email" autoComplete="email" required placeholder="Email Address" className="min-h-14 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                  <input type="password" name="password" autoComplete="new-password" required minLength={8} placeholder="Choose Password" className="min-h-14 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />
                  <input type="password" name="confirmPassword" autoComplete="new-password" required minLength={8} placeholder="Confirm Password" className="min-h-14 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100" />

                  <label className="flex items-start gap-3 pt-2 text-sm text-slate-600">
                    <input type="checkbox" name="termsAccepted" required className="mt-1 h-4 w-4 accent-violet-700" />
                    <span>I agree to the <a href="/terms" className="font-bold text-violet-700 hover:underline">Terms</a>, <a href="/privacy" className="font-bold text-violet-700 hover:underline">Privacy Policy</a>, and recurring subscription terms.</span>
                  </label>

                  <button type="submit" className="flex min-h-16 w-full items-center justify-center rounded-xl bg-gradient-to-r from-violet-700 to-indigo-600 px-6 text-base font-black uppercase tracking-[0.05em] text-white shadow-[0_14px_35px_rgba(109,40,217,.28)] transition hover:brightness-110">
                    Get One Month Free + 5,000 Points <span className="ml-3 text-2xl">→</span>
                  </button>
                </form>

                <p className="mt-4 text-center text-sm font-semibold text-slate-500">$0 today • Includes <span className="text-violet-700">5,000 points</span> • Random drawing entry included • Winner receives album remastering + distribution to 40+ platforms • Then <span className="text-violet-700">$19.99/month</span></p>
                <p className="mt-1 text-center text-xs leading-5 text-slate-400">Payment method required at checkout. Renews automatically after 30 days unless canceled.</p>

                <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.18em] text-slate-300"><span className="h-px flex-1 bg-slate-200" /><span>or</span><span className="h-px flex-1 bg-slate-200" /></div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <a href="/auth/google" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:border-slate-400">G&nbsp; Google</a>
                  <a href="/auth/apple" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:border-slate-400">●&nbsp; Apple</a>
                  <a href="/auth/facebook" className="flex min-h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold hover:border-slate-400">f&nbsp; Facebook</a>
                </div>
                <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <a href="/login" className="font-black text-violet-700 hover:underline">Log in</a></p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.14),transparent_52%)]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.28em] text-orange-400">How Crucible Works</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Premium unlocks it. Credits power it.</h2>
              <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-300">
                Your Premium membership gives you access to every active Furnace
                module. Each time you process a video, repair code, master audio,
                or generate artwork, the operation uses credits based on the
                resources required.
              </p>
            </div>

            <div className="rounded-[2rem] border border-orange-500/30 bg-zinc-950/90 p-7 shadow-2xl sm:p-9">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">Crucible Premium</p>
                  <p className="mt-2 text-3xl font-black">$19.99<span className="text-base font-bold text-white/45">/month</span></p>
                </div>
                <span className="rounded-full bg-orange-500 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black">30 Days Free</span>
              </div>

              <div className="mt-6 grid gap-3">
                {["5,000 credits during the free trial", "Monthly credit allowance after renewal", "Access to every active Furnace module", "Member pricing on additional credit packs", "Cancel through account settings anytime"].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3 text-sm leading-6 text-zinc-300">
                    <span className="mt-0.5 text-orange-400">◆</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <a href="/signup?plan=premium-trial" className="mt-7 flex min-h-14 w-full items-center justify-center rounded-2xl bg-orange-500 px-6 py-4 text-center font-black text-black transition hover:bg-orange-400">Start Your Free Month</a>
              <p className="mt-3 text-center text-[11px] leading-5 text-zinc-500">Payment method required. Renews automatically at $19.99/month after 30 days unless canceled.</p>
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
