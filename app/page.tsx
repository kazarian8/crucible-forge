import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioWaveform,
  BadgeCheck,
  Braces,
  Flame,
  ImageIcon,
  LockKeyhole,
  Menu,
  Play,
  ShieldCheck,
  Sparkles,
  Video,
  WandSparkles,
  Zap,
} from "lucide-react";

const furnaces = [
  {
    title: "Sound Furnace",
    label: "LIVE",
    description:
      "Upload a track, choose your forge, and turn a rough mix into a louder, cleaner, release-ready master.",
    href: "/sound-furnace",
    icon: AudioWaveform,
    action: "Forge a track",
  },
  {
    title: "Prompt Reforge",
    label: "LIVE",
    description:
      "Upload a video and extract its visual DNA into production-ready prompts for the leading AI video tools.",
    href: "/prompt-reforge",
    icon: Video,
    action: "Reforge a prompt",
  },
  {
    title: "Code Furnace",
    label: "NEXT",
    description:
      "Repair broken code, configs, JSON, YAML, and environment files without losing the structure you started with.",
    href: "#coming-soon",
    icon: Braces,
    action: "Coming soon",
  },
  {
    title: "Artwork Forge",
    label: "SOON",
    description:
      "Create cover art, campaign visuals, thumbnails, and brand-ready creative from one clear direction.",
    href: "#coming-soon",
    icon: ImageIcon,
    action: "Coming soon",
  },
];

const steps = [
  ["01", "Choose a furnace", "Select the tool built for the result you need."],
  ["02", "Drop in the raw material", "Upload your track, video, prompt, artwork, or code."],
  ["03", "Leave with something stronger", "Get a refined output you can actually use."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070605] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:56px_56px]" />

      <header className="relative z-30 border-b border-white/10 bg-[#070605]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Crucible home">
            <Image
              src="/crucible-logo.png"
              alt="Crucible"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
              priority
            />
            <div>
              <div className="text-sm font-black tracking-[0.25em]">CRUCIBLE</div>
              <div className="mt-1 text-[9px] font-semibold tracking-[0.18em] text-orange-300/80">
                REFINE. REPAIR. REFORGE.
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#furnaces" className="transition hover:text-white">Furnaces</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
            <a href="#mission" className="transition hover:text-white">Why Crucible</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white sm:block"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-[0_0_35px_rgba(249,115,22,.22)] transition hover:bg-orange-400"
            >
              Start free
            </Link>
            <button className="rounded-xl border border-white/10 p-2.5 text-white/70 md:hidden" aria-label="Open menu">
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0">
          <Image
            src="/crucible-hero.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#070605_0%,rgba(7,6,5,.9)_42%,rgba(7,6,5,.4)_75%,#070605_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(249,115,22,.24),transparent_32rem)]" />
        </div>

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-16 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.19em] text-orange-200">
              <Sparkles size={14} />
              One forge. Multiple creative furnaces.
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[.95] tracking-[-0.055em] sm:text-7xl lg:text-[88px]">
              Everything enters raw.
              <span className="mt-2 block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-200 bg-clip-text text-transparent">
                Everything leaves reforged.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">
              Crucible turns unfinished music, video ideas, prompts, artwork, and code into stronger, production-ready results—all from one focused workspace.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-400 px-7 py-4 font-black text-black shadow-[0_18px_60px_rgba(249,115,22,.25)] transition hover:brightness-110"
              >
                Enter the Crucible
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#furnaces"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 font-bold text-white transition hover:bg-white/[0.08]"
              >
                <Play size={17} fill="currentColor" />
                Explore the furnaces
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/45">
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-orange-400" /> Private by design</span>
              <span className="flex items-center gap-2"><Zap size={15} className="text-orange-400" /> Fast usable outputs</span>
              <span className="flex items-center gap-2"><BadgeCheck size={15} className="text-orange-400" /> Built for creators</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-12 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-black/55 p-3 shadow-[0_35px_120px_rgba(0,0,0,.75)] backdrop-blur-xl">
              <div className="rounded-[24px] border border-white/8 bg-[#0c0907] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300">Active furnace</p>
                    <h2 className="mt-2 text-2xl font-black">Sound Furnace</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-400">
                    <AudioWaveform size={25} />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-orange-400/30 bg-orange-500/[0.045] px-5 py-9 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/12 text-orange-400">
                    <Flame size={27} />
                  </div>
                  <p className="mt-4 font-bold">Drop your raw track here</p>
                  <p className="mt-1 text-sm text-white/40">WAV, MP3, FLAC, AIFF or M4A</p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {["Analyze", "Refine", "Reforge"].map((item, index) => (
                    <div key={item} className="rounded-xl border border-white/8 bg-white/[0.035] p-3 text-center">
                      <div className="text-[10px] font-bold text-orange-300">0{index + 1}</div>
                      <div className="mt-1 text-xs font-semibold text-white/60">{item}</div>
                    </div>
                  ))}
                </div>

                <Link href="/sound-furnace" className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 font-black text-black transition hover:bg-orange-400">
                  Open Sound Furnace <ArrowRight size={17} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="furnaces" className="relative border-y border-white/8 bg-white/[0.018] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">The furnace floor</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.035em] sm:text-6xl">One platform built to finish the work.</h2>
            </div>
            <p className="max-w-md leading-7 text-white/50">Choose what you are bringing into the fire. Each furnace is focused on a specific kind of transformation.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {furnaces.map((furnace) => {
              const Icon = furnace.icon;
              const isLive = furnace.label === "LIVE";
              return (
                <Link
                  key={furnace.title}
                  href={furnace.href}
                  className={`group rounded-[28px] border p-6 transition sm:p-8 ${isLive ? "border-white/10 bg-[#0d0b09] hover:-translate-y-1 hover:border-orange-400/35 hover:bg-[#120d09]" : "border-white/[0.06] bg-white/[0.018] opacity-58"}`}
                >
                  <div className="flex items-start justify-between gap-5">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isLive ? "bg-orange-500/12 text-orange-400" : "bg-white/5 text-white/35"}`}>
                      <Icon size={27} />
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.2em] ${isLive ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/35"}`}>{furnace.label}</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-black">{furnace.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-white/48">{furnace.description}</p>
                  <div className={`mt-7 flex items-center gap-2 text-sm font-bold ${isLive ? "text-orange-300" : "text-white/30"}`}>
                    {furnace.action}
                    {isLive && <ArrowRight size={16} className="transition group-hover:translate-x-1" />}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">How it works</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Less switching. More finishing.</h2>
              <p className="mt-5 max-w-lg leading-7 text-white/50">Crucible is not another pile of disconnected AI buttons. It is a direct path from rough material to a result worth keeping.</p>
            </div>
            <div className="space-y-3">
              {steps.map(([number, title, copy]) => (
                <div key={number} className="grid gap-4 rounded-2xl border border-white/8 bg-white/[0.025] p-5 sm:grid-cols-[70px_1fr] sm:items-center sm:p-6">
                  <div className="font-mono text-sm font-bold text-orange-400">{number}</div>
                  <div>
                    <h3 className="text-lg font-black">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/45">{copy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="px-5 pb-24 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-orange-400/20 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,.2),transparent_28rem),linear-gradient(135deg,#140b06,#080706_65%)] px-6 py-14 sm:px-12 sm:py-16">
          <div className="relative max-w-3xl">
            <WandSparkles className="text-orange-400" size={28} />
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Refine what is rough. Repair what is broken. Reforge what is possible.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/55">Built for independent creators who need stronger tools, clearer results, and control over what they make.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-7 py-4 font-black text-black transition hover:bg-orange-400">Start free <ArrowRight size={18} /></Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] px-7 py-4 font-bold transition hover:bg-white/[0.08]"><LockKeyhole size={17} /> Log in</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 py-9">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 text-sm text-white/35 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/crucible-logo.png" alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
            <span className="font-bold tracking-[0.18em] text-white/55">CRUCIBLE</span>
          </div>
          <p>Everything enters raw. Everything leaves reforged.</p>
          <div className="flex gap-5"><Link href="/contact" className="hover:text-white">Contact</Link><Link href="/login" className="hover:text-white">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}
