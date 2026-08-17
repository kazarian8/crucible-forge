import { Braces, Hammer } from "lucide-react";

export default function CodeFurnacePage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <section className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Code Furnace</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Broken code goes into the fire.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">This room will handle code repair, config cleanup, debugging, refactors, and build assistance while preserving the structure the user started with.</p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-300"><Braces size={27} /></div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-violet-300/25 bg-violet-500/[0.04] p-10 text-center">
          <Hammer className="mx-auto text-violet-300" size={26} />
          <p className="mt-4 text-lg font-black">Code Furnace is being forged.</p>
          <p className="mt-2 text-sm text-white/40">The room is connected to the Furnace Switcher now and can be expanded feature by feature.</p>
        </div>
      </section>
    </main>
  );
}
