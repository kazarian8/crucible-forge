"use client";

import Link from "next/link";
import { Home, LibraryBig, Music2, Radio, SlidersHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  center?: boolean;
};

const items: readonly NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Moments", href: "/moments", icon: Radio },
  { label: "Workstation", href: "/workstation", icon: SlidersHorizontal, center: true },
  { label: "Market", href: "/sound-library", icon: Music2 },
  { label: "My Tracks", href: "/local-library", icon: LibraryBig },
];

export default function ArtistBottomNav() {
  const pathname = usePathname();
  const hidden = pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/verify-email");
  if (hidden) return null;

  return (
    <nav aria-label="Crucible artist navigation" className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#090705]/95 px-2 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5 backdrop-blur-xl md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 items-end">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[9px] font-bold ${active ? "text-orange-300" : "text-white/45"}`}>
              <span className={item.center ? `grid size-11 -translate-y-2 place-items-center rounded-full border ${active ? "border-orange-300/50 bg-orange-500 text-black" : "border-white/10 bg-[#16110d] text-white"}` : "grid size-7 place-items-center"}>
                <Icon size={item.center ? 20 : 18} />
              </span>
              <span className={item.center ? "-mt-2" : ""}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
