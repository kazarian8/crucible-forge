import Link from "next/link";
import { Activity } from "lucide-react";

export default function StarLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Link
        href="/star/analyzer"
        className="fixed right-3 z-[90] inline-flex items-center gap-2 rounded-full border border-sky-200/25 bg-[#07121b]/95 px-4 py-3 text-[10px] font-black uppercase tracking-wider text-sky-200 shadow-[0_0_28px_rgba(56,189,248,.18)] backdrop-blur-xl"
        style={{ bottom: "calc(max(env(safe-area-inset-bottom), .5rem) + 4.75rem)" }}
      >
        <Activity size={15} /> DNA Wave
      </Link>
    </>
  );
}
