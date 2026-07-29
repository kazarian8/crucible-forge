import Link from "next/link";

const furnaces = [
  { name: "Code Furnace", description: "Repair broken code, JSON, YAML, and configuration files.", href: "/code-furnace", icon: "</>", style: "border-blue-400/30 from-blue-500/25 text-blue-300", active: true },
  { name: "Prompt Reforge", description: "Turn references into structured, production-ready prompts.", href: "/prompt-reforge", icon: "✦", style: "border-violet-400/30 from-violet-500/25 text-violet-300", active: true },
  { name: "Refurbish Furnace", description: "Restore old, damaged, faded, scratched, or blurry photos.", href: "/refurbish", icon: "▧", style: "border-amber-400/30 from-amber-500/25 text-amber-300", active: false },
  { name: "Quick Picture Forge", description: "Fast edits, resizing, background removal, and enhancement.", href: "/picture-forge", icon: "⌗", style: "border-green-400/30 from-green-500/25 text-green-300", active: false },
  { name: "Sound Furnace", description: "Clean, enhance, repair, and prepare audio for release.", href: "/sound-furnace", icon: "▥", style: "border-pink-400/30 from-pink-500/25 text-pink-300", active: false },
];

const steps = [
  ["↑", "Upload", "Drop in a supported file or paste your code."],
  ["✦", "We Reforge", "Crucible analyzes, repairs, or enhances it."],
  ["◉", "Preview", "See the result before deciding to keep it."],
  ["↓", "Download or Upgrade", "Save the result or unlock more power."],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-xl font-black text-black shadow-[0_0_30px_rgba(249,115,22,.38)]">C</span>
            <span>
              <span className="block text-xl font-black tracking-[0.08em]">CRUCIBLE</span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.28em] text-orange-400">Everything Reforged</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-white/70 lg:flex">
            <a href="#furnaces" className="hover:text-white">Furnaces</a>
            <a href="#process" className="hover:text-white">How It Works</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="#partners" className="hover:text-white">Partners</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden rounded-xl border border-white/15 px-5 py-3 text-sm font-bold hover:border-orange-400 sm:inline-flex">Sign In</Link>
            <a href="#furnaces" className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black hover:bg-orange-400">Try Free</a>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_45%,rgba(249,115,22,.18),transparent_30%),linear-gradient(90deg,#050505_20%,rgba(5,5,5,.86)_47%,rgba(5,5,5,.15))]" />
        <div className="absolute inset-y-0 right-0 w-full bg-[url('/crucible-hero.jpg')] bg-cover bg-[65%_center] opacity-75 lg:w-[62%]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/60" />

        <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-end px-5 pb-12 pt-28 sm:items-center sm:py-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">The AI forge for repair, restoration & creation</p>
            <h1 className="mt-5 text-5xl font-black leading-[.96] tracking-[-0.05em] sm:text-7xl">
              Everything Enters Raw.
              <span className="mt-2 block bg-gradient-to-r from-amber-200 via-orange-400 to-orange-600 bg-clip-text text-transparent">Everything Leaves Reforged.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
              Repair code, restore images, transform prompts, and improve creative work—without giving payment information before you see value.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#furnaces" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-orange-500 px-7 py-4 font-black text-black shadow-[0_18px_50px_rgba(249,115,22,.28)] hover:bg-orange-400">✦ Try a Furnace Free</a>
              <a href="#process" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/20 bg-black/35 px-7 py-4 font-bold hover:border-orange-400">See How It Works</a>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65">
              <span>✓ Free to try</span>
              <span>✓ No credit card required</span>
              <span>✓ Controlled preview costs</span>
            </div>
          </div>
        </div>
      </section>

      <section id="furnaces" className="border-b border-white/10 px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Built for creators, developers & dreamers</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">Choose Your Furnace</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/55">Only active, affordable functions should be publicly available. Future builds remain controlled inside the Command Center.</p>
          </div>

          <div className="mt-10 flex snap-x gap-4 overflow-x-auto pb-5 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {furnaces.map((furnace) => (
              <article key={furnace.name} className={`min-w-[250px] snap-start rounded-2xl border bg-gradient-to-b ${furnace.style} to-black p-5 lg:min-w-0`}>
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-current/25 bg-black/45 text-2xl font-black">{furnace.icon}</div>
                <h3 className="mt-5 text-xl font-black text-white">{furnace.name}</h3>
                <p className="mt-3 min-h-20 text-sm leading-6 text-white/60">{furnace.description}</p>
                {furnace.active ? (
                  <Link href={furnace.href} className="mt-5 inline-flex font-black hover:text-white">Try It →</Link>
                ) : (
                  <span className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.16em] text-white/35">Coming Soon</span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="border-b border-white/10 bg-[#080808] px-5 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Simple process</p>
            <h2 className="mt-3 text-4xl font-black">How Crucible Works</h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {steps.map(([icon, title, text], index) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-full border border-white/15 text-2xl">{icon}</span>
                  <span className="text-sm font-black text-orange-400">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-xl font-black">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-20">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl border border-orange-500/25 bg-gradient-to-br from-orange-500/10 to-black p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">Start free. See the power.</p>
            <h2 className="mt-4 text-4xl font-black">Try before you pay.</h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/65">
              Crucible uses small, controlled previews to prove value. Full-resolution exports, advanced retries, large files, premium models, and human review require credits or payment.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#furnaces" className="inline-flex min-h-14 items-center justify-center rounded-xl bg-orange-500 px-7 py-4 font-black text-black hover:bg-orange-400">Start Free Now</a>
              <Link href="/pricing" className="inline-flex min-h-14 items-center justify-center rounded-xl border border-white/15 px-7 py-4 font-bold hover:border-orange-400">View Pricing</Link>
            </div>
          </div>

          <div id="partners" className="rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">Affiliate partner</p>
            <h2 className="mt-4 text-3xl font-black">DISTROKID</h2>
            <p className="mt-3 leading-7 text-white/60">Distribute your music to major platforms and keep 100% of your earnings.</p>
            <a href="https://distrokid.com/student/12343575" target="_blank" rel="noreferrer" className="mt-7 inline-flex font-black text-lime-300 hover:text-lime-200">Learn More →</a>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-5 py-8 text-center text-sm text-white/35">
        © 2026 Crucible. Everything enters raw. Everything leaves reforged.
      </footer>
    </main>
  );
}
