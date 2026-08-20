import ChallengeClient from "./ChallengeClient";
import { createClient } from "../../lib/supabase/server";

type LeaderboardRow = {
  id: string;
  artist_name: string;
  track_title: string;
  track_url: string;
  originality_percent: number | string | null;
  vote_count: number | string;
  status: string;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leaderboardData } = await supabase
    .from("challenge_leaderboard")
    .select("id,artist_name,track_title,track_url,originality_percent,vote_count,status,created_at")
    .order("vote_count", { ascending: false })
    .order("created_at", { ascending: true });

  let hasSubmitted = false;
  if (user) {
    const { data: ownEntry } = await supabase
      .from("challenge_entries")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    hasSubmitted = Boolean(ownEntry);
  }

  const entries = ((leaderboardData ?? []) as LeaderboardRow[]).map((entry) => ({
    id: entry.id,
    artist_name: entry.artist_name,
    track_title: entry.track_title,
    track_url: entry.track_url,
    originality_percent:
      entry.originality_percent == null ? null : Number(entry.originality_percent),
    vote_count: Number(entry.vote_count ?? 0),
  }));

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="relative overflow-hidden border-b border-white/10 px-5 py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_45%)]" />
        <div className="relative mx-auto max-w-6xl">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-400">Crucible Free Challenge</p>
          <h1 className="mt-4 max-w-4xl text-5xl font-black leading-[0.95] sm:text-7xl">You can’t buy first place.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">Free entry. Free voting. No vote bundles. No paid boosts. No pay-to-win leaderboard.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-black uppercase tracking-[0.14em]">
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-orange-300">Free Entry</span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-orange-300">Verified Voters</span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-orange-300">One Vote Total</span>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-orange-300">No Self-Votes</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <ChallengeClient entries={entries} signedIn={Boolean(user)} hasSubmitted={hasSubmitted} />
      </section>
    </main>
  );
}
