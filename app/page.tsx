const features = [
  {
    number: "01",
    title: "AI Bridge",
    description:
      "Connect leading AI models through one unified API. Route every request by quality, speed, availability, or cost.",
  },
  {
    number: "02",
    title: "Data Cloud",
    description:
      "Turn documents, databases, and private knowledge into secure, searchable intelligence for every application.",
  },
  {
    number: "03",
    title: "Developer Platform",
    description:
      "Build, monitor, and scale AI products with production-ready APIs, analytics, authentication, billing, and SDKs.",
  },
];

const metrics = [
  ["100+", "Models supported"],
  ["99.99%", "Target availability"],
  ["One API", "Unified integration"],
  ["Global", "Built to scale"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[700px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,92,56,0.18),transparent_52%)]" />

      <header className="relative z-20 border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/30 bg-orange-500/10 font-black text-orange-400">
              CF
            </span>

            <div>
              <div className="font-semibold tracking-tight">Crucible Forge</div>
              <div className="text-xs text-white/45">
                Intelligence Infrastructure
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/65 md:flex">
            <a className="transition hover:text-white" href="#platform">
              Platform
            </a>
            <a className="transition hover:text-white" href="#products">
              Products
            </a>
            <a className="transition hover:text-white" href="#developers">
              Developers
            </a>
            <a className="transition hover:text-white" href="#company">
              Company
            </a>
          </nav>

          <a
            href="#start"
            className="rounded-full border border-white/15 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400"
          >
            Start building
          </a>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-4 py-2 text-sm text-orange-300">
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              The intelligence infrastructure company
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-8xl">
              Build AI without
              <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 bg-clip-text text-transparent">
                limits.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-lg leading-8 text-white/60 md:text-xl">
              Connect every model, unify every dataset, and power every
              intelligent application from one secure developer platform.
            </p>

            <div
              id="start"
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <a
                href="#products"
                className="w-full rounded-full bg-orange-500 px-7 py-4 font-semibold text-white shadow-[0_0_50px_rgba(249,115,22,0.25)] transition hover:bg-orange-400 sm:w-auto"
              >
                Explore the platform
              </a>

              <a
                href="mailto:hello@crucibleforge.ai"
                className="w-full rounded-full border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                Book a demo
              </a>
            </div>
          </div>

          <div className="relative mx-auto mt-20 max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-black/40">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0e14] p-6 md:p-10">
              <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center">
                <div>
                  <p className="text-sm text-orange-400">Crucible Router</p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    One request. The best intelligence.
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  All systems operational
                </div>
              </div>

              <div className="grid gap-4 pt-6 md:grid-cols-3">
                {["OpenAI", "Anthropic", "Google Gemini"].map(
                  (provider, index) => (
                    <div
                      key={provider}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{provider}</span>
                        <span className="text-xs text-white/35">
                          Route 0{index + 1}
                        </span>
                      </div>

                      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${88 - index * 12}%` }}
                        />
                      </div>

                      <div className="mt-3 flex justify-between text-xs text-white/40">
                        <span>Optimized</span>
                        <span>{88 - index * 12}%</span>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="platform"
        className="relative z-10 border-y border-white/10 bg-white/[0.02]"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-2 px-5 md:grid-cols-4 md:px-8">
          {metrics.map(([value, label]) => (
            <div
              key={label}
              className="border-white/10 px-4 py-9 text-center md:border-r md:last:border-r-0"
            >
              <div className="text-2xl font-semibold md:text-3xl">{value}</div>
              <div className="mt-2 text-sm text-white/40">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section
        id="products"
        className="relative z-10 px-5 py-24 md:px-8 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-medium text-orange-400">One unified platform</p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Everything required to build intelligent software.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/55">
              Stop stitching together disconnected providers, databases, and
              developer tools. Crucible Forge brings the full AI stack into one
              secure system.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="group min-h-[340px] rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.05]"
              >
                <div className="text-sm font-medium text-orange-400">
                  {feature.number}
                </div>

                <div className="mt-20">
                  <h3 className="text-2xl font-semibold">{feature.title}</h3>
                  <p className="mt-4 leading-7 text-white/50">
                    {feature.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="developers"
        className="relative z-10 px-5 pb-24 md:px-8 md:pb-32"
      >
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500/15 to-white/[0.025] lg:grid-cols-2">
          <div className="p-8 md:p-14">
            <p className="text-sm font-medium text-orange-400">
              Designed for developers
            </p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
              Integrate once. Build anything.
            </h2>

            <p className="mt-5 max-w-xl leading-7 text-white/55">
              Use one clean interface to access multiple AI providers while
              Crucible Forge handles routing, retries, observability, cost
              controls, and provider failures.
            </p>

            <a
              className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
              href="#company"
            >
              Read the documentation →
            </a>
          </div>

          <div className="border-t border-white/10 bg-[#05070a] p-6 lg:border-l lg:border-t-0 md:p-10">
            <pre className="overflow-x-auto text-sm leading-7 text-white/70">
              <code>{`const response = await crucible.generate({
  model: "auto",
  prompt: "Build without limits",
  optimizeFor: ["quality", "cost", "speed"]
});

console.log(response.output);`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section
        id="company"
        className="relative z-10 border-t border-white/10 px-5 py-24 text-center md:px-8"
      >
        <div className="mx-auto max-w-4xl">
          <p className="text-orange-400">Forge what comes next.</p>

          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            The future will be built with intelligence.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            Crucible Forge gives ambitious builders the infrastructure to turn
            AI ideas into secure, scalable products.
          </p>

          <a
            href="mailto:hello@crucibleforge.ai"
            className="mt-9 inline-flex rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-orange-400"
          >
            Build with Crucible Forge
          </a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-white/35 md:flex-row">
          <p>© 2026 Crucible Forge. All rights reserved.</p>
          <p>Intelligence infrastructure for the next generation.</p>
        </div>
      </footer>
    </main>
  );
}
