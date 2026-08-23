import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  AudioWaveform,
  BadgeCheck,
  Binary,
  Braces,
  Dna,
  FileSearch,
  ImageIcon,
  Layers3,
  LockKeyhole,
  Menu,
  ShieldCheck,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";

const capabilities = [
  {
    title: "File DNA Analysis",
    description:
      "Inspect the structure, signals, characteristics, and usable footprint of a file before making changes.",
    icon: Dna,
  },
  {
    title: "AI-Assisted Editing",
    description:
      "Use intelligent tools to repair, refine, transform, and enhance while keeping the source file as the reference point.",
    icon: WandSparkles,
  },
  {
    title: "Controlled Transformation",
    description:
      "Apply targeted changes instead of sending your work through a one-size-fits-all generator.",
    icon: Layers3,
  },
  {
    title: "File Footprint & Verification",
    description:
      "Build a clearer technical footprint around what entered Crucible, what changed, and what left the forge.",
    icon: FileSearch,
  },
];

const furnaces = [
  {
    title: "Sound Furnace",
    label: "LIVE",
    description:
      "Analyze audio DNA, refine a mix, separate stems, repair problem areas, and move into a deeper engineering workflow.",
    href: "/sound-furnace",
    icon: AudioWaveform,
    action: "Open Sound Furnace",
  },
  {
    title: "Prompt Reforge",
    label: "LIVE",
    description:
      "Inspect visual DNA from video and rebuild it into structured production direction and reusable prompts.",
    href: "/prompt-reforge",
    icon: Video,
    action: "Open Prompt Reforge",
  },
  {
    title: "Picture Furnace",
    label: "LIVE",
    description:
      "Use command-driven AI assistance to enhance, repair, isolate, sharpen, and transform images with controlled edits.",
    href: "/picture-furnace",
    icon: ImageIcon,
    action: "Open Picture Furnace",
  },
  {
    title: "Code Furnace",
    label: "NEXT",
    description:
      "Analyze code structure, diagnose broken logic and configuration, and repair files without losing their intended architecture.",
    href: "/code-furnace",
    icon: Braces,
    action: "Explore Code Furnace",
  },
];

const steps = [
  ["01", "Read the file", "Crucible examines the file and establishes its working DNA and structure."],
  ["02", "Choose the change", "You direct the edit, repair, enhancement, separation, or transformation you actually want."],
  ["03", "Reforge with context", "AI assistance works from the file itself instead of treating your source as disposable."],
  ["04", "Leave with a footprint", "The output is tied back to what entered, what was changed, and the workflow used to create it."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070605] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:56px_56px]" />

      <header className="relative z-30 border-b border-white/10 bg-[#070605]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Crucible Forge home">
            <Image
              src="/crucible-logo.png"
              alt="Crucible Forge"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
              priority
            />
            <div>
              <div className="text-sm font-black tracking-[0.25em]">CRUCIBLE FORGE</div>
              <div className="mt-1 text-[9px] font-semibold tracking-[0.18em] text-orange-300/80">
                FILE DNA · AI ASSISTED INFRASTRUCTURE
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#infrastructure" className="transition hover:text-white">Infrastructure</a>
            <a href="#furnaces" className="transition hover:text-white">Furnaces</a>
            <a href="#how-it-works" className="transition hover:text-white">How it works</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-xl border border-white/15 px-3 py-2.5 text-xs font-black text-white transition hover:bg-white/5 sm:px-4 sm:text-sm">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-[0_0_35px_rgba(249,115,22,.22)] transition hover:bg-orange-400">
              Enter Crucible
            </Link>
            <button className="rounded-xl border border-white/10 p-2.5 text-white/70 md:hidden" aria-label="Open menu">
              <Menu size={19} />
            </button>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-0">
          <Image src="/crucible-hero.jpg" alt="" fill priority className="object-cover opacity-20" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#070605_0%,rgba(7,6,5,.94)_46%,rgba(7,6,5,.54)_78%,#070605_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_38%,rgba(249,115,22,.24),transparent_31rem)]" />
        </div>

        <div className="relative mx-auto grid min-h-[760px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.08fr_.92fr] lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.19em] text-orange-200">
              <Sparkles size={14} />
              Welcome to Crucible Forge
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[.94] tracking-[-0.055em] sm:text-7xl lg:text-[84px]">
              Full file DNA.
              <span className="mt-2 block bg-gradient-to-r from-orange-300 via-orange-500 to-amber-200 bg-clip-text text-transparent">
                Intelligent editing infrastructure.
              </span>
            </h1>

            <p className="mt-7 max-w-3xl text-lg leading-8 text-white/65 sm:text-xl">
              Crucible Forge is an AI-assisted infrastructure for analyzing a file&apos;s DNA, understanding its technical footprint, and making controlled edits, repairs, enhancements, and transformations across audio, video, images, prompts, and code.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-white/45 sm:text-lg">
              Your file is not just an upload. It becomes the reference layer for the entire workflow — what came in, what was detected, what you changed, and what came out.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-400 px-7 py-4 font-black text-black shadow-[0_18px_60px_rgba(249,115,22,.25)] transition hover:brightness-110">
                Enter the Infrastructure
                <ArrowRight size={18} className="transition group-hover:translate-x-1" />
              </Link>
              <a href="#infrastructure" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 font-bold text-white transition hover:bg-white/[0.08]">
                <Binary size={17} />
                See how file DNA works
              </a>
            </div>

            <Link href="/login" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-200 underline decoration-orange-300/35 underline-offset-4">
              <LockKeyhole size={15} /> Already a member? Sign in
            </Link>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-white/45">
              <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-orange-400" /> Source-first workflow</span>
              <span className="flex items-center gap-2"><Dna size={15} className="text-orange-400" /> File DNA analysis</span>
              <span className="flex items-center gap-2"><BadgeCheck size={15} className="text-orange-400" /> Traceable transformation</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute -inset-12 rounded-full bg-orange-500/15 blur-3xl" />
            <div className="relative overflow-hidden rounded-[32px] border border-white/12 bg-black/60 p-3 shadow-[0_35px_120px_rgba(0,0,0,.75)] backdrop-blur-xl">
              <div className="rounded-[24px] border border-white/8 bg-[#0c0907] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange-300">Crucible file layer</p>
                    <h2 className="mt-2 text-2xl font-black">DNA Footprint</h2>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-400">
                    <Dna size={25} />
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/[0.045] p-5">
                  <div className="flex items-center justify-between border-b border-white/8 pb-4 text-xs">
                    <span className="text-white/45">SOURCE</span>
                    <span className="font-mono text-orange-200">FILE_001</span>
                  </div>
                  <div className="space-y-4 pt-4 text-sm">
                    <div className="flex items-center justify-between"><span className="text-white/45">Structure</span><span className="font-bold">Analyzed</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/45">Characteristics</span><span className="font-bold">Mapped</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/45">Edit context</span><span className="font-bold">Preserved</span></div>
                    <div className="flex items-center justify-between"><span className="text-white/45">Output footprint</span><span className="font-bold text-orange-300">Linked</span></div>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {["Analyze", "Assist", "Reforge"].map((item, index) => (
                    <div key={item} className="rounded-xl border border-white/8 bg-white/[0.035] p-3 text-center">
                      <div className="text-[10px] font-bold text-orange-300">0{index + 1}</div>
                      <div className="mt-1 text-xs font-semibold text-white/60">{item}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="infrastructure" className="relative border-y border-white/8 bg-white/[0.018] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-4xl">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">The infrastructure</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-6xl">A file-aware AI layer built around the work itself.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/50">
              Crucible is designed to understand the material first, then help you work on it. The goal is not to replace the source — it is to give the source a smarter editing, analysis, and verification layer.
            </p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <div key={capability.title} className="rounded-[28px] border border-white/10 bg-[#0d0b09] p-7 sm:p-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/12 text-orange-400">
                    <Icon size={27} />
                  </div>
                  <h3 className="mt-7 text-2xl font-black">{capability.title}</h3>
                  <p className="mt-3 leading-7 text-white/48">{capability.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="furnaces" className="py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">Purpose-built furnaces</p>
              <h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.035em] sm:text-6xl">Different files. Same DNA-first infrastructure.</h2>
            </div>
            <p className="max-w-md leading-7 text-white/50">Each furnace applies the Crucible workflow to a different kind of file and editing problem.</p>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {furnaces.map((furnace) => {
              const Icon = furnace.icon;
              const isLive = furnace.label === "LIVE";
              return (
                <Link key={furnace.title} href={furnace.href} className={`group rounded-[28px] border p-6 transition sm:p-8 ${isLive ? "border-white/10 bg-[#0d0b09] hover:-translate-y-1 hover:border-orange-400/35 hover:bg-[#120d09]" : "border-white/[0.06] bg-white/[0.018] opacity-70"}`}>
                  <div className="flex items-start justify-between gap-5">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isLive ? "bg-orange-500/12 text-orange-400" : "bg-white/5 text-white/35"}`}>
                      <Icon size={27} />
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.2em] ${isLive ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-white/35"}`}>{furnace.label}</span>
                  </div>
                  <h3 className="mt-8 text-2xl font-black">{furnace.title}</h3>
                  <p className="mt-3 max-w-xl leading-7 text-white/48">{furnace.description}</p>
                  <div className={`mt-7 flex items-center gap-2 text-sm font-bold ${isLive ? "text-orange-300" : "text-white/45"}`}>
                    {furnace.action}<ArrowRight size={16} className="transition group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-white/8 bg-white/[0.018] py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">How it works</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Analyze first. Edit with context. Reforge with control.</h2>
              <p className="mt-5 max-w-lg leading-7 text-white/50">That is the difference between a generic AI tool and infrastructure built around the file itself.</p>
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

      <section className="px-5 py-24 sm:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-orange-400/20 bg-[radial-gradient(circle_at_80%_20%,rgba(249,115,22,.2),transparent_28rem),linear-gradient(135deg,#140b06,#080706_65%)] px-6 py-14 sm:px-12 sm:py-16">
          <div className="relative max-w-4xl">
            <Dna className="text-orange-400" size={30} />
            <h2 className="mt-6 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Welcome to Crucible Forge. Give your files a working DNA layer.</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/55">Analyze deeper, edit smarter, preserve context, and build stronger outputs from the material you already created.</p>
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
            <span className="font-bold tracking-[0.18em] text-white/55">CRUCIBLE FORGE</span>
          </div>
          <p>Analyze. Assist. Edit. Reforge.</p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/contact" className="hover:text-white">Contact</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-white">Disclaimer</Link>
            <Link href="/login" className="hover:text-white">Log in</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
