const platformCards = [
  {
    number: "01",
    title: "AI Bridge",
    description:
      "Route requests across multiple AI providers using policies for quality, cost, latency, availability, and privacy.",
  },
  {
    number: "02",
    title: "Data Cloud",
    description:
      "Connect private documents, application data, embeddings, memory, and searchable knowledge.",
  },
  {
    number: "03",
    title: "Developer Platform",
    description:
      "Build with unified APIs, SDKs, monitoring, analytics, usage controls, and deployment tools.",
  },
];

const capabilities = [
  "Intelligent routing",
  "Provider fallback",
  "Cost controls",
  "Private data access",
  "Request tracing",
  "Usage visibility",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07090d] text-white">
      <div className="background-grid pointer-events-none fixed inset-0 opacity-40" />

      <div className="pointer-events-none fixed inset-x-0 top-0 h-[700px] bg-[radial-gradient(circle_at_50%_0%,rgba(249,115,22,0.18),transparent_55%)]" />

      <header className="relative z-20 border-b border-white/10 bg-[#07090d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
          <a href="/" className="flex items-center gap-3">
            <img
  src="/crucible-forge-mark.jpg"
  alt="Crucible Forge"
  className="h-12 w-12 rounded-xl object-cover"
/>

            <div>
              <div className="font-semibold tracking-tight">Crucible Forge</div>
              <div className="text-xs text-white/40">
                Intelligence Infrastructure
              </div>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a className="transition hover:text-white" href="#platform">
              Platform
            </a>
            <a className="transition hover:text-white" href="#bridge">
              AI Bridge
            </a>
            <a className="transition hover:text-white" href="#developers">
              Developers
            </a>
            <a className="transition hover:text-white" href="#contact">
              Contact
            </a>
          </nav>

          <a
            href="#contact"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400"
          >
            Start building
          </a>
        </div>
      </header>

      <section className="relative z-10 px-5 pb-24 pt-20 md:px-8 md:pb-32 md:pt-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-400/20 bg-orange-400/10 px-4 py-2 text-xs font-medium tracking-[0.18em] text-orange-300">
              INTELLIGENCE INFRASTRUCTURE
            </div>

            <h1 className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-6xl md:text-8xl">
              Build intelligence
              <span className="block bg-gradient-to-r from-orange-300 via-orange-500 to-red-500 bg-clip-text text-transparent">
                without limits.
              </span>
            </h1>

            <p className="mx-auto mt-7 max-w-3xl text-pretty text-lg leading-8 text-white/60 md:text-xl">
              Connect leading AI models, private data, and intelligent workflows
              through one secure infrastructure layer.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#platform"
                className="w-full rounded-full bg-orange-500 px-7 py-4 font-semibold text-white shadow-[0_0_50px_rgba(249,115,22,0.22)] transition hover:bg-orange-400 sm:w-auto"
              >
                Explore the platform
              </a>

              <a
                href="#architecture"
                className="w-full rounded-full border border-white/15 bg-white/5 px-7 py-4 font-semibold text-white transition hover:bg-white/10 sm:w-auto"
              >
                View architecture
              </a>
            </div>

            <p className="mt-6 text-sm text-white/35">
              Designed for builders who need control over quality, cost,
              reliability, and data.
            </p>
          </div>

          <div className="relative mx-auto mt-20 max-w-6xl rounded-[2rem] border border-white/10 bg-white/[0.035] p-3 shadow-2xl shadow-black/40">
            <div className="rounded-[1.5rem] border border-white/10 bg-[#0b0e14] p-6 md:p-10">
              <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-6 md:flex-row md:items-center">
                <div>
                  <p className="text-sm text-orange-400">
                    Crucible Routing Layer
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    One request. The right intelligence.
                  </h2>
                </div>

                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Platform preview
                </div>
              </div>

              <div className="grid gap-4 pt-6 md:grid-cols-4">
                {["Request", "Routing Engine", "Model Providers", "Application"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-white/30">
                          0{index + 1}
                        </span>
                      </div>

                      <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                          style={{ width: `${94 - index * 9}%` }}
                        />
                      </div>

                      <p className="mt-3 text-xs text-white/40">
                        {index === 0 && "Input received"}
                        {index === 1 && "Policy evaluated"}
                        {index === 2 && "Best route selected"}
                        {index === 3 && "Response delivered"}
                      </p>
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
        className="relative z-10 border-y border-white/10 bg-white/[0.02] px-5 py-24 md:px-8 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-medium text-orange-400">One unified platform</p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              One infrastructure layer. Every intelligent system.
            </h2>

            <p className="mt-6 text-lg leading-8 text-white/55">
              Developers should not have to stitch together model providers,
              databases, observability tools, billing systems, and workflow
              engines manually.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {platformCards.map((card) => (
              <article
                key={card.title}
                className="min-h-[330px] rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-7 transition hover:-translate-y-1 hover:border-orange-400/30 hover:bg-white/[0.05]"
              >
                <div className="text-sm font-medium text-orange-400">
                  {card.number}
                </div>

                <div className="mt-20">
                  <h3 className="text-2xl font-semibold">{card.title}</h3>
                  <p className="mt-4 leading-7 text-white/50">
                    {card.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="bridge"
        className="relative z-10 px-5 py-24 md:px-8 md:py-32"
      >
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-medium text-orange-400">AI Bridge</p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              The right intelligence for every request.
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/55">
              Route requests across providers using policies for quality, cost,
              latency, availability, privacy, and fallback behavior.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div
            id="developers"
            className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#05070a]"
          >
            <div className="border-b border-white/10 px-6 py-4 text-sm text-white/45">
              Proposed SDK interface
            </div>

            <pre className="overflow-x-auto p-6 text-sm leading-7 text-white/70 md:p-8">
              <code>{`const result = await crucible.generate({
  route: "balanced",
  input: "Analyze this contract",
  requirements: {
    privacy: "strict",
    fallback: true
  }
});

console.log(result.output);`}</code>
            </pre>
          </div>
        </div>
      </section>

      <section
        id="architecture"
        className="relative z-10 border-y border-white/10 bg-white/[0.02] px-5 py-24 md:px-8 md:py-32"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="font-medium text-orange-400">Architecture</p>

            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
              Built as a unified intelligence layer.
            </h2>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {[
              "Applications",
              "Crucible API Gateway",
              "Routing & Policy Engine",
              "Model Providers",
              "Data Cloud",
              "Observability & Governance",
            ].map((layer, index) => (
              <div
                key={layer}
                className="rounded-2xl border border-white/10 bg-[#0b0e14] p-6"
              >
                <div className="text-xs text-orange-400">
                  LAYER {index + 1}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{layer}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="relative z-10 px-5 py-24 text-center md:px-8 md:py-32"
      >
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-gradient-to-br from-orange-500/15 to-white/[0.025] px-6 py-16 md:px-12">
          <p className="font-medium text-orange-400">Forge what comes next.</p>

          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
            Build the next generation of intelligent software.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
            Tell us what you are building and where your current AI stack is
            slowing you down.
          </p>

          <a
            href="mailto:hello@crucibleforge.ai"
            className="mt-9 inline-flex rounded-full bg-white px-7 py-4 font-semibold text-black transition hover:bg-orange-400"
          >
            Contact Crucible Forge
          </a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-white/35 md:flex-row">
          <p>© 2026 Crucible Forge. All rights reserved.</p>
          <p>The Intelligence Infrastructure Company</p>
        </div>
      </footer>
    </main>
  );
}
