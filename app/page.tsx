import Link from "next/link";

const furnaces = [
  {
    name: "Code Furnace",
    description:
      "Paste or upload broken code, JSON, YAML, environment files, and configuration files. Get back a repaired, validated, production-ready file.",
    href: "/code-furnace",
    icon: "</>",
    accent: "from-blue-500/25 border-blue-400/30 text-blue-300",
    active: true,
  },
  {
    name: "Prompt Reforge",
    description:
      "Turn a reference, idea, or uploaded video into structured production prompts for CapCut, Sora, Veo, Kling, Runway, and more.",
    href: "/prompt-reforge",
    icon: "✦",
    accent: "from-violet-500/25 border-violet-400/30 text-violet-300",
    active: true,
  },
  {
    name: "Sound Furnace",
    description:
      "Clean, repair, enhance, balance, and prepare audio for release with controlled previews before paid export.",
    href: "/sound-furnace",
    icon: "▥",
    accent: "from-pink-500/25 border-pink-400/30 text-pink-300",
    active: false,
  },
  {
    name: "Artwork Forge",
    description:
      "Create cover art, promotional graphics, visual concepts, and release-ready creative assets.",
    href: "/artwork-forge",
    icon: "◩",
    accent: "from-amber-500/25 border-amber-400/30 text-amber-300",
    active: false,
  },
  {
    name: "Merch Forge",
    description:
      "Turn ideas into apparel concepts, mockups, product graphics, and launch-ready merchandise direction.",
    href: "/merch-forge",
    icon: "⌁",
    accent: "from-emerald-500/25 border-emerald-400/30 text-emerald-300",
    active: false,
  },
];

const signupHooks = [
  "Repair broken files without rebuilding everything from scratch",
  "Turn rough ideas into production-ready creative direction",
  "Preview results before paying for premium exports",
  "Use one account across every active Crucible furnace",
];

const foundingPerks = [
  "Founding Member badge and permanent profile recognition",
  "Early access to new furnaces before public launch",
  "Priority consideration for beta testing and feature voting",
  "Referral, affiliate, and influencer earning opportunities",
  "Possible entry into future commission-based hiring drawings",
  "Founder pricing protection on qualifying early plans",
];

const steps = [
  ["01", "Choose a Furnace", "Select the tool built for the job you need completed."],
  ["02", "Upload or Paste", "Add your file, code, media, reference, or creative direction."],
  ["03", "Preview the Reforge", "See the controlled result before paying for premium output."],
  ["04", "Export or Upgrade", "Download, retry, or unlock advanced processing when needed."],
];

const platforms = [
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "TikTok",
  "Amazon Music",
  "Instagram",
  "Tidal",
  "Deezer",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-orange-500 text-xl font-black text-black shadow-[0_0_34px_rgba(249,115,22,.42)]">
              C
            </span>
            <span>
              <span className="block text-lg font-black tracking-[0.12em] sm:text-xl">
                CRUCIBLE
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-[0.3em] text-orange-400">
                Everything Reforged
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/65 lg:flex">
            <a href="#furnaces" className="transition hover:text-white">
              Furnaces
            </a>
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <a href="#founding" className="transition hover:text-white">
              Founding Members
            </a>
            <a href="#partners" className="transition hover:text-white">
              Partners
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="hidden rounded-xl border border-white/15 px-4 py-3 text-sm font-bold transition hover:border-orange-400 sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black shadow-[0_12px_30px_rgba(249,115,22,.24)] transition hover:bg-orange-400 sm:px-5"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 -z-30 bg-black" />
        <div className="absolute inset-y-0 right-0 -z-20 w-full bg-[url('/crucible-hero.jpg')] bg-cover bg-[62%_center] opacity-55 sm:opacity-65 lg:w-[66%] lg:opacity-75" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_72%_42%,rgba(249,115,22,.26),transparent_28%),linear-gradient(90deg,#050505_18%,rgba(5,5,5,.92)_48%,rgba(5,5,5,.28)_78%,rgba(5,5,5,.72))]" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/20 via-transparent to-black/80" />

        <div className="mx-auto flex min-h-[760px] max-w-7xl items-center px-4 py-24 sm:min-h-[820px] sm:px-6 lg:py-28">
          <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
            <p className="inline-flex rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300 sm:text-xs">
              The AI forge for repair, restoration and creation
            </p>

            <h1 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.055em] sm:text-7xl lg:text-8xl">
              Everything Enters Raw.
              <span className="mt-3 block bg-gradient-to-r from-amber-200 via-orange-400 to-orange-600 bg-clip-text text-transparent">
                Everything Leaves Reforged.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg lg:mx-0">
              Repair broken code. Rebuild weak prompts. Restore creative work.
              Crucible gives creators and developers one controlled place to turn
              unfinished, damaged, or rough material into something useful.
            </p>

            <div className="mt-8 grid gap-3 sm:flex sm:justify-center lg:justify-start">
              <Link
                href="/signup"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 text-base font-black text-black shadow-[0_20px_60px_rgba(249,115,22,.3)] transition hover:-translate-y-0.5 hover:bg-orange-400"
              >
                Start Free Today
              </Link>
              <a
                href="#furnaces"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/20 bg-black/45 px-7 py-4 text-base font-bold backdrop-blur transition hover:border-orange-400"
              >
                Explore the Furnaces
              </a>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-white/70 lg:justify-start">
              <span>✓ No payment information required</span>
              <span>✓ Free controlled previews</span>
              <span>✓ Upgrade only when value is proven</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              More than another AI tool
            </p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              One account. Multiple furnaces. Real outcomes.
            </h2>
            <p className="mt-5 max-w-xl leading-8 text-white/60">
              Crucible is designed around completed work, not a crowded list of
              features. Every public furnace must provide a useful result at a
              cost the platform can responsibly support.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {signupHooks.map((hook) => (
              <div
                key={hook}
                className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"
              >
                <span className="text-orange-400">✦</span>
                <p className="mt-3 text-sm font-bold leading-6 text-white/78">
                  {hook}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="furnaces" className="border-b border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Choose Furnace Type
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              Enter through the furnace built for the job
            </h2>
            <p className="mt-5 leading-8 text-white/55">
              Active furnaces are available now. Planned furnaces stay visible so
              members can see what Crucible is building next.
            </p>
          </div>

          <div className="mt-12 flex snap-x gap-4 overflow-x-auto pb-6 lg:grid lg:grid-cols-5 lg:overflow-visible">
            {furnaces.map((furnace) => (
              <article
                key={furnace.name}
                className={`min-w-[270px] snap-start rounded-3xl border bg-gradient-to-b ${furnace.accent} to-black p-6 lg:min-w-0`}
              >
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-current/25 bg-black/50 text-2xl font-black shadow-inner">
                  {furnace.icon}
                </div>
                <div className="mt-6 flex items-start justify-between gap-3">
                  <h3 className="text-xl font-black text-white">{furnace.name}</h3>
                  {furnace.active ? (
                    <span className="rounded-full border border-lime-400/30 bg-lime-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-lime-300">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-white/35">
                      Soon
                    </span>
                  )}
                </div>
                <p className="mt-4 min-h-32 text-sm leading-6 text-white/60">
                  {furnace.description}
                </p>
                {furnace.active ? (
                  <Link
                    href={furnace.href}
                    className="mt-6 inline-flex items-center font-black text-white transition hover:text-orange-300"
                  >
                    Enter Furnace →
                  </Link>
                ) : (
                  <span className="mt-6 inline-flex text-xs font-black uppercase tracking-[0.16em] text-white/30">
                    Coming Soon
                  </span>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="border-b border-white/10 bg-[#080808] px-4 py-20 sm:px-6"
      >
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Simple by design
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              From raw input to usable result
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map(([number, title, text]) => (
              <div
                key={title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-orange-400/25 bg-orange-500/10 text-sm font-black text-orange-300">
                    {number}
                  </span>
                  <span className="text-2xl text-white/15">✦</span>
                </div>
                <h3 className="mt-6 text-xl font-black">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/55">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="founding" className="border-b border-white/10 px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[32px] border border-orange-500/25 bg-gradient-to-br from-orange-500/12 via-[#0b0b0b] to-black lg:grid-cols-[1.05fr_.95fr]">
          <div className="p-7 sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Founding Member Access
            </p>
            <h2 className="mt-4 text-4xl font-black sm:text-5xl">
              Help shape the forge while it is still being built.
            </h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/62">
              Early members are more than subscribers. They help identify the
              functions worth building, report weak points, test new furnaces,
              and influence what Crucible becomes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 font-black text-black transition hover:bg-orange-400"
            >
              Become a Founding Member
            </Link>
          </div>

          <div className="border-t border-white/10 bg-black/28 p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <h3 className="text-xl font-black">Possible founding advantages</h3>
            <div className="mt-6 space-y-4">
              {foundingPerks.map((perk) => (
                <div key={perk} className="flex gap-3">
                  <span className="mt-1 text-orange-400">✓</span>
                  <p className="text-sm leading-6 text-white/68">{perk}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs leading-5 text-white/35">
              Certain future opportunities may require eligibility, performance,
              availability, and separate written terms. No employment or income
              is guaranteed.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#080808] px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Start free. Upgrade with purpose.
            </p>
            <h2 className="mt-4 text-4xl font-black">See value before payment.</h2>
            <p className="mt-5 max-w-2xl leading-8 text-white/60">
              Creating an account does not require payment information. Free use
              stays controlled so Crucible can provide useful previews without
              offering expensive functions the platform cannot responsibly cover.
              Premium exports, larger jobs, advanced retries, and third-party
              processing may require credits or payment.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl bg-orange-500 px-7 py-4 font-black text-black transition hover:bg-orange-400"
              >
                Create Your Free Account
              </Link>
              <Link
                href="/pricing"
                className="inline-flex min-h-14 items-center justify-center rounded-2xl border border-white/15 px-7 py-4 font-bold transition hover:border-orange-400"
              >
                View Pricing
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black p-7 sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
              Account promise
            </p>
            <h3 className="mt-4 text-3xl font-black">No surprise entry fee.</h3>
            <div className="mt-6 space-y-4 text-sm leading-6 text-white/62">
              <p>✓ Create an account without entering a card.</p>
              <p>✓ Try supported free functions and controlled previews.</p>
              <p>✓ See pricing before any premium action is processed.</p>
              <p>✓ Keep future paid functions locked until intentionally selected.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="partners" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-400">
              Complete the outcome
            </p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">
              Get your music onto major platforms
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/55">
              Crucible may connect creators with trusted partners that help finish
              the job after the furnace work is complete.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-5xl rounded-[32px] border border-lime-400/20 bg-gradient-to-br from-lime-400/8 to-black p-7 sm:p-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-300">
                  Distribution partner
                </p>
                <h3 className="mt-3 text-4xl font-black">DistroKid</h3>
                <p className="mt-4 max-w-xl leading-7 text-white/60">
                  Distribute your music to major streaming services and keep 100%
                  of the earnings reported through your distributor account.
                </p>
              </div>
              <a
                href="https://distrokid.com/student/12343575"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-14 shrink-0 items-center justify-center rounded-2xl bg-lime-300 px-7 py-4 font-black text-black transition hover:bg-lime-200"
              >
                Distribute with DistroKid →
              </a>
            </div>

            <div className="mt-8 flex gap-3 overflow-x-auto pb-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/62"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-white/30">
            Crucible may receive compensation from qualifying partner referrals.
            Partner services are operated independently and remain subject to
            their own pricing, approval, support, and refund policies.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="font-black tracking-[0.12em]">CRUCIBLE</p>
            <p className="mt-1 text-xs text-white/35">
              Everything enters raw. Everything leaves reforged.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-5 text-xs font-semibold text-white/40">
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/affiliate-disclosure" className="hover:text-white">
              Affiliate Disclosure
            </Link>
          </div>
          <p className="text-xs text-white/30">© 2026 Crucible</p>
        </div>
      </footer>
    </main>
  );
}
