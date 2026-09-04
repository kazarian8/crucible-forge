"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Music2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type InviteInfo = {
  authenticated: boolean;
  track: { id: string; title: string; artwork_url: string | null };
  owner: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null;
};

export default function CollaborationInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [accepting, setAccepting] = useState(false);
  const nextPath = useMemo(() => `/collab/${encodeURIComponent(token || "")}`, [token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    fetch(`/api/collaboration/invite/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(String(result.error || "This collaboration link is unavailable."));
        if (active) setInfo(result as InviteInfo);
      })
      .catch((error) => active && setMessage(error instanceof Error ? error.message : "This collaboration link is unavailable."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [token]);

  async function accept() {
    if (!token) return;
    setAccepting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/collaboration/invite/${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(result.error || "Could not join this project."));
      window.location.replace(`/tracks/${encodeURIComponent(result.trackId)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not join this project.");
      setAccepting(false);
    }
  }

  if (loading) return <main className="min-h-screen bg-[#080604] p-8 text-white"><p>Opening collaboration invite…</p></main>;

  if (!info) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-7 text-center">
          <h1 className="text-2xl font-black">Collaboration link unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-white/60">{message || "The owner may have disabled or replaced this invite link."}</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-black text-black">Go to Crucible</Link>
        </section>
      </main>
    );
  }

  const ownerName = info.owner?.display_name || info.owner?.username || "A Crucible artist";
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-zinc-950 p-7">
        <div className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-zinc-800 bg-cover bg-center" style={info.track.artwork_url ? { backgroundImage: `url(${info.track.artwork_url})` } : undefined}>
            {!info.track.artwork_url ? <Music2 size={26} className="text-orange-300" /> : null}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.18em] text-orange-300">Collaboration invite</p>
            <h1 className="mt-1 truncate text-2xl font-black">{info.track.title}</h1>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/[0.04] p-4">
          <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800 bg-cover bg-center" style={info.owner?.avatar_url ? { backgroundImage: `url(${info.owner.avatar_url})` } : undefined}>
            {!info.owner?.avatar_url ? <Users size={18} className="text-white/60" /> : null}
          </div>
          <div className="min-w-0"><p className="text-xs text-white/45">Invited by</p><p className="truncate font-black">{ownerName}</p></div>
        </div>

        <p className="mt-5 text-sm leading-6 text-white/60">Join this private Crucible project as a collaborator. The project stays private unless its owner publishes it.</p>

        {info.authenticated ? (
          <button type="button" onClick={() => void accept()} disabled={accepting} className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50">
            {accepting ? "Joining project…" : "Accept Collaboration"}
          </button>
        ) : (
          <div className="mt-6 grid gap-3">
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 text-center font-black text-black">Sign Up Free & Join</Link>
            <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="rounded-xl border border-white/15 px-5 py-4 text-center font-black">Already have an account? Sign in</Link>
          </div>
        )}
        {message ? <p className="mt-4 text-sm text-red-200" role="alert">{message}</p> : null}
      </section>
    </main>
  );
}
