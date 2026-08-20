"use client";

import { FormEvent, useState } from "react";

type Entry = {
  id: string;
  artist_name: string;
  track_title: string;
  track_url: string;
  originality_percent: number | null;
  vote_count: number;
};

type Props = {
  entries: Entry[];
  signedIn: boolean;
  hasSubmitted: boolean;
};

export default function ChallengeClient({ entries, signedIn, hasSubmitted }: Props) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  async function submitEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      artistName: String(form.get("artistName") ?? ""),
      trackTitle: String(form.get("trackTitle") ?? ""),
      trackUrl: String(form.get("trackUrl") ?? ""),
    };

    try {
      const response = await fetch("/api/challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Submission failed.");
      setMessage("Submitted. Your track is pending originality review.");
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed.");
    } finally {
      setBusy(false);
    }
  }

  async function castVote(entryId: string) {
    setVotingId(entryId);
    setMessage("");
    try {
      const response = await fetch("/api/challenge/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Vote failed.");
      setMessage("Vote locked in. One verified person, one vote.");
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Vote failed.");
    } finally {
      setVotingId(null);
    }
  }

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-orange-500/25 bg-zinc-950 p-6 sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">Enter Free</p>
        <h2 className="mt-2 text-3xl font-black">Submit one original track</h2>
        <p className="mt-3 max-w-2xl text-zinc-400">No entry fee. No paid boosts. One entry per verified account. Entries are reviewed before public voting.</p>

        {!signedIn ? (
          <a href="/login?next=/challenge" className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-black text-black">Sign in to enter</a>
        ) : hasSubmitted ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black p-5 text-zinc-300">You already have an entry in this challenge.</div>
        ) : (
          <form onSubmit={submitEntry} className="mt-7 grid gap-4">
            <input name="artistName" required maxLength={80} placeholder="Artist name" className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-orange-500" />
            <input name="trackTitle" required maxLength={120} placeholder="Track title" className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-orange-500" />
            <input name="trackUrl" required type="url" placeholder="Public audio URL (WAV/MP3 link)" className="rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none focus:border-orange-500" />
            <button disabled={busy} className="rounded-xl bg-orange-500 px-5 py-3 font-black text-black disabled:opacity-50">{busy ? "Submitting…" : "Submit Free"}</button>
          </form>
        )}
      </section>

      {message && <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4 font-bold text-orange-200">{message}</div>}

      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400">Leaderboard</p>
            <h2 className="mt-2 text-3xl font-black">The people decide — for free</h2>
          </div>
          <p className="text-sm text-zinc-500">One verified voter gets one vote total.</p>
        </div>

        {entries.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-zinc-700 bg-zinc-950/60 p-10 text-center text-zinc-400">Approved entries will appear here.</div>
        ) : (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {entries.map((entry, index) => (
              <article key={entry.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">#{index + 1}</p>
                    <h3 className="mt-2 text-2xl font-black">{entry.track_title}</h3>
                    <p className="mt-1 text-zinc-400">{entry.artist_name}</p>
                  </div>
                  <div className="rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm font-black text-orange-300">{entry.vote_count} votes</div>
                </div>
                <audio controls preload="none" className="mt-5 w-full" src={entry.track_url} />
                {entry.originality_percent != null && (
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-400">Originality verified: {entry.originality_percent}%</p>
                )}
                {signedIn ? (
                  <button onClick={() => castVote(entry.id)} disabled={votingId !== null} className="mt-5 w-full rounded-xl border border-orange-500 px-4 py-3 font-black text-orange-300 transition hover:bg-orange-500 hover:text-black disabled:opacity-50">{votingId === entry.id ? "Locking vote…" : "Vote Free"}</button>
                ) : (
                  <a href="/login?next=/challenge" className="mt-5 block rounded-xl border border-zinc-700 px-4 py-3 text-center font-black text-zinc-300">Sign in to vote</a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
