import { ImageIcon, Sparkles } from "lucide-react";

export default function PictureFurnacePage() {
  return (
    <main className="min-h-screen bg-[#070605] px-5 py-12 text-white">
      <section className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-white/[0.025] p-6 sm:p-10">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Picture Furnace</p>
            <h1 className="mt-3 text-4xl font-black tracking-[-0.04em] sm:text-6xl">Visual work enters here.</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/50">This workspace is reserved for image enhancement, cleanup, object edits, cover art, thumbnails, and future visual Forge tools.</p>
          </div>
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-orange-500/10 text-orange-300"><ImageIcon size={26} /></div>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-orange-300/25 bg-orange-500/[0.04] p-10 text-center">
          <Sparkles className="mx-auto text-orange-300" size={26} />
          <p className="mt-4 text-lg font-black">Picture Furnace is being forged.</p>
          <p className="mt-2 text-sm text-white/40">The navigation is live now so this room can grow without changing how users move through Crucible.</p>
        </div>
      </section>
    </main>
  );
}
