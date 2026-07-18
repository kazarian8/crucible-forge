"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [isEntering, setIsEntering] = useState(false);

  function enterStudio() {
    if (isEntering) return;

    setIsEntering(true);

    window.setTimeout(() => {
      router.push("/studio");
    }, 1100);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Blurred image fills any unused space */}
      <div
        className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-2xl"
        style={{
          backgroundImage: "url('/crucible-studio.jpg.PNG')",
        }}
      />

      <div className="absolute inset-0 bg-black/35" />

      {/* Main studio image */}
      <div className="relative flex min-h-screen items-center justify-center">
        <div
          className={`relative h-screen w-full max-w-[1536px] overflow-hidden transition duration-[1100ms] ease-in-out ${
            isEntering ? "scale-[1.35] opacity-0" : "scale-100 opacity-100"
          }`}
        >
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

          {/* Clickable monitor hotspot */}
          <button
            type="button"
            aria-label="Enter the Crucible studio"
            onClick={enterStudio}
            disabled={isEntering}
            className="group absolute left-[51.5%] top-[46.8%] z-30 h-[9.8%] w-[12.5%] cursor-pointer rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 disabled:cursor-wait"
          >
            <span
              className={`absolute inset-0 rounded-sm border transition duration-500 ${
                isEntering
                  ? "border-orange-200 bg-orange-500/50 shadow-[0_0_100px_rgba(249,115,22,1)]"
                  : "border-orange-300/0 bg-orange-500/0 group-hover:border-orange-300/60 group-hover:bg-orange-500/15 group-hover:shadow-[0_0_70px_rgba(249,115,22,.75)]"
              }`}
            />

            <span className="absolute inset-x-[-55%] top-1/2 -translate-y-1/2 transition group-hover:scale-105">
              <span className="inline-flex rounded-full border border-orange-300/30 bg-black/75 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-100 shadow-2xl backdrop-blur-md sm:text-xs md:px-5 md:py-3">
                {isEntering ? "Entering…" : "Tap screen to enter"}
              </span>
            </span>
          </button>

          {/* Bottom instruction */}
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center px-5 md:bottom-8">
            <div className="rounded-full border border-white/15 bg-black/60 px-4 py-2 text-center text-[10px] uppercase tracking-[0.16em] text-white/70 backdrop-blur-md">
              Enter the studio through the monitor
            </div>
          </div>
        </div>
      </div>

      {/* Transition flash */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 bg-orange-100 transition duration-700 ${
          isEntering ? "opacity-100" : "opacity-0"
        }`}
      />
    </main>
  );
}
