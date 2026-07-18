"use client";

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
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

          {/* Plain link to studio — no flash or JavaScript transition */}
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
    </main>
  );
}
