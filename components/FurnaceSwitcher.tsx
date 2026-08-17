"use client";

import Link from "next/link";
import { AudioWaveform, Braces, ImageIcon, LayoutGrid, Video } from "lucide-react";
import { usePathname } from "next/navigation";

const FURNACES = [
  { id: "sound", label: "Sound", href: "/sound-furnace", icon: AudioWaveform, live: true },
  { id: "picture", label: "Picture", href: "/picture-furnace", icon: ImageIcon, live: false },
  { id: "video", label: "Video", href: "/video-furnace", icon: Video, live: false },
  { id: "code", label: "Code", href: "/code-furnace", icon: Braces, live: false },
] as const;

export default function FurnaceSwitcher({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Crucible furnaces" className={compact ? "w-full" : "w-full"}>
      <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/45 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,.25)] backdrop-blur-xl">
        <Link
          href="/"
          className="grid size-10 shrink-0 place-items-center rounded-xl border border-white/8 bg-white/[0.04] text-white/45 transition hover:text-white"
          aria-label="All furnaces"
        >
          <LayoutGrid size={17} />
        </Link>

        {FURNACES.map((furnace) => {
          const Icon = furnace.icon;
          const active = pathname === furnace.href || pathname.startsWith(`${furnace.href}/`);
          return (
            <Link
              key={furnace.id}
              href={furnace.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-w-[112px] shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-black transition ${
                active
                  ? "border-orange-300/60 bg-orange-400 text-black shadow-[0_0_24px_rgba(251,146,60,.18)]"
                  : "border-white/8 bg-white/[0.035] text-white/55 hover:border-white/16 hover:text-white"
              }`}
            >
              <Icon size={15} />
              <span>{furnace.label}</span>
              {!furnace.live ? (
                <span className={`absolute -right-1 -top-1 rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider ${active ? "bg-black text-orange-200" : "bg-white/10 text-white/45"}`}>
                  Soon
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
