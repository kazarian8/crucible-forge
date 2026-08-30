"use client";

import Link from "next/link";
import { useState } from "react";
import StemSequencer from "../../components/sound-furnace/StemSequencer";

export default function WorkstationPage() {
  const [mixName, setMixName] = useState("");

  return (
    <main className="min-h-screen bg-[#050403] px-3 py-4 text-white sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-300/15 bg-[#0d0a08] px-4 py-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Crucible</p>
            <h1 className="text-2xl font-black">Workstation</h1>
            <p className="mt-1 text-xs text-white/45">Full 16-track engineer workspace.</p>
          </div>
          <div className="flex items-center gap-2">
            {mixName ? <span className="hidden text-xs font-bold text-emerald-300 sm:inline">{mixName} ready for Forge</span> : null}
            <Link href="/star" className="rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black">Upload &amp; File DNA</Link>
            <Link href="/sound-furnace" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/70">Sound Furnace</Link>
          </div>
        </header>

        <StemSequencer
          onMixReady={(_buffer, name) => setMixName(name)}
        />
      </div>
    </main>
  );
}
