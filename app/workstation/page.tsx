"use client";

import Link from "next/link";
import { useState } from "react";
import StemSequencer from "../../components/sound-furnace/StemSequencer";

export default function WorkstationPage() {
  const [mixName, setMixName] = useState("");

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090909]/95 backdrop-blur-xl">
        <div className="flex min-h-14 items-center justify-between gap-3 px-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange-500 font-black text-black">C</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-sm font-black tracking-tight">Crucible Workstation</h1>
              </div>
              <p className="truncate text-[10px] text-white/35">Engineer + artist session</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {mixName ? <span className="hidden max-w-52 truncate text-[10px] font-bold text-emerald-300 lg:inline">{mixName} ready</span> : null}
            <Link href="/star" className="rounded-lg bg-orange-500 px-3 py-2 text-[10px] font-black text-black">File DNA</Link>
            <Link href="/sound-furnace" className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-white/65">Mastering</Link>
          </div>
        </div>
      </header>

      <div className="p-2 sm:p-3">
        <StemSequencer
          onMixReady={(_buffer, name) => setMixName(name)}
        />
      </div>
    </main>
  );
}
