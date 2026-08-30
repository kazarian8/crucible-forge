import Link from "next/link";
import { AudioLines, LibraryBig, Music2, Radio, SlidersHorizontal, Sparkles, Upload } from "lucide-react";

const cards = [
  {
    title: "Upload & File DNA",
    description: "Analyze a device file, save the private master, and publish it when you choose.",
    href: "/star",
    icon: Upload,
  },
  {
    title: "Moments",
    description: "Post public updates, music drops, clips, and artist moments.",
    href: "/moments",
    icon: Radio,
  },
  {
    title: "Sound Library",
    description: "Free downloadable sounds, loops, samples, and beats for Crucible artists.",
    href: "/sound-library",
    icon: Music2,
  },
  {
    title: "Private Library",
    description: "Your local music vault for private tracks, works in progress, and saved mixes.",
    href: "/local-library",
    icon: LibraryBig,
  },
] as const;

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300">Private artist network</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-5xl">Crucible Forge</h1>
          </div>
          <Link href="/account" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black text-white/70">
            Account
          </Link>
        </header>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-orange-300/15 bg-[radial-gradient(circle_at_78%_20%,rgba(249,115,22,.22),transparent_34rem),#0d0907] p-6 sm:p-9">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300/20 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">
              <Sparkles size={13} /> Your music workspace
            </div>
            <h2 className="mt-5 text-4xl font-black leading-none tracking-[-0.05em] sm:text-6xl">Build it in the Forge.</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
              Crucible is your private artist hub: create in the workstation, keep your music organized, pull from the shared sound library, and publish only what you choose.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/workstation" className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-black">
                <SlidersHorizontal size={17} /> Open Workstation
              </Link>
              <Link href="/sound-furnace" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/80">
                <AudioLines size={17} /> Sound Furnace
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black">Your Crucible</h3>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">5-tab mobile hub</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.href} href={card.href} className="rounded-2xl border border-white/10 bg-[#0d0a08] p-5 transition hover:border-orange-300/30 hover:bg-[#120d09]">
                  <div className="grid size-10 place-items-center rounded-xl bg-orange-500/10 text-orange-300">
                    <Icon size={20} />
                  </div>
                  <h4 className="mt-4 font-black">{card.title}</h4>
                  <p className="mt-2 text-sm leading-5 text-white/45">{card.description}</p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
