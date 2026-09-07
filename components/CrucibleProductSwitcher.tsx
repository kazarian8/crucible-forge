"use client";

import { usePathname } from "next/navigation";

export default function CrucibleProductSwitcher() {
  const pathname = usePathname();

  if (pathname !== "/sound-furnace" && pathname !== "/workstation") return null;

  return (
    <a
      href="/auth/handoff?target=star&next=/star"
      className="fixed right-3 top-20 z-[80] rounded-full border border-sky-300/25 bg-[#07121b]/95 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-sky-100 shadow-[0_0_24px_rgba(56,189,248,.14)] backdrop-blur-xl"
      aria-label="Open CrucibleStar with this Crucible account"
    >
      CrucibleStar
    </a>
  );
}
