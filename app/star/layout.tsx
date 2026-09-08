import Link from "next/link";
import { isStarAdmin } from "../../lib/star/admin";
import { Activity, LogIn, UserPlus } from "lucide-react";
import StarSessionGate from "../../components/star/StarSessionGate";
import { createClient } from "../../lib/supabase/server";

export default async function StarLayout({ children }: { children: React.ReactNode }) {
  let signedIn = false;
  let admin = false;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    signedIn = Boolean(user);
    admin = isStarAdmin(user);
  } catch {
    signedIn = false;
  }

  return (
    <>
      <div className="sticky top-0 z-[85] border-b border-white/10 bg-[#070707]/95 px-3 py-2.5 text-white backdrop-blur-xl sm:px-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-orange-300/70">CrucibleStar · Music Intake Lab</p>
            <p className="truncate text-[11px] font-bold text-white/45">Analyze first. Edit in Forge when you are ready.</p>
          </div>

          {signedIn ? (
            <div className="flex shrink-0 items-center gap-2">
              <a
                href="/auth/handoff?target=forge&next=/sound-furnace"
                className="rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[10px] font-black text-sky-100"
              >
                Forge
              </a>
              {admin ? <Link href="/star/review" className="rounded-xl border border-orange-300/25 px-3 py-2 text-sm font-bold text-orange-200">Review</Link> : null}
              <Link href="/account" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black text-white/75">Account</Link>
              <form action="/auth/signout?next=/star" method="post">
                <button type="submit" className="rounded-xl border border-orange-300/20 bg-orange-400/10 px-3 py-2 text-[10px] font-black text-orange-200">Sign Out</button>
              </form>
            </div>
          ) : (
            <div className="flex shrink-0 overflow-hidden rounded-xl border border-orange-300/25 bg-black/45">
              <Link href="/login?next=/star" className="inline-flex items-center gap-1.5 border-r border-orange-300/20 px-3 py-2 text-[10px] font-black text-orange-100 hover:bg-orange-400/10">
                <LogIn size={13} /> Sign In
              </Link>
              <Link href="/signup?next=/star" className="inline-flex items-center gap-1.5 bg-orange-400 px-3 py-2 text-[10px] font-black text-black hover:bg-orange-300">
                <UserPlus size={13} /> Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      <StarSessionGate signedIn={signedIn}>{children}</StarSessionGate>

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
