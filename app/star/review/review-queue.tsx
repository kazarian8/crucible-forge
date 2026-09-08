"use client";

import { useEffect, useRef, useState } from "react";
import type { MasterQuality } from "../../../lib/audio/master-quality";

type Track = { id: string; title: string; created_at: string; publish_status: string; verification_status: string; grade: string | null; analysis_score: number | null; quality: MasterQuality | null };
export default function ReviewQueue() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [visibility, setVisibility] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<{ id: string; title: string; url: string } | null>(null);
  const [preparing, setPreparing] = useState("");
  const playbackRequest = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/star/review?page=${page}&visibility=${visibility}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; })
      .then((data) => { setTracks(data.tracks); setTotal(data.total); })
      .catch((caught) => { if (!controller.signal.aborted) setError(caught.message || "Tracks could not be loaded."); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); playbackRequest.current += 1; };
  }, [page, visibility]);
  function changeView(nextPage: number, nextVisibility = visibility) {
    playbackRequest.current += 1;
    setSelected(null);
    setPreparing("");
    setLoading(true);
    setError("");
    setPage(nextPage);
    setVisibility(nextVisibility);
  }
  async function preview(track: Track) {
    const request = ++playbackRequest.current;
    setSelected(null);
    setPreparing(track.id);
    setError("");
    try {
      const response = await fetch(`/api/star/review?track=${track.id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (request === playbackRequest.current) setSelected({ id: track.id, title: track.title, url: data.url });
    } catch (caught) {
      if (request === playbackRequest.current) setError(caught instanceof Error ? caught.message : "Preview failed.");
    } finally { if (request === playbackRequest.current) setPreparing(""); }
  }
  return <main className="min-h-screen bg-[#080c12] px-4 py-8 text-white"><div className="mx-auto max-w-5xl">
    <p className="text-sm font-bold text-orange-300">CrucibleStar · Admin</p><h1 className="mt-2 text-3xl font-black">Daily listening review</h1>
    <p className="mt-3 text-base text-slate-300">Listen to uploaded tracks and check the measured changes. Public and private tracks remain under their existing visibility settings.</p>
    <label className="mt-6 block text-sm">Visibility <select value={visibility} onChange={(event) => { changeView(0, event.target.value); }} className="ml-3 rounded-lg border border-white/20 bg-slate-900 p-2"><option value="all">All tracks</option><option value="public">Public</option><option value="private">Private</option></select></label>
    {error ? <p role="alert" className="mt-4 text-amber-200">{error}</p> : null}
    {selected ? <section className="sticky top-20 z-10 mt-5 rounded-xl border border-sky-300/30 bg-slate-950 p-4"><p className="font-bold">Listening: {selected.title}</p><audio key={selected.url} controls autoPlay preload="none" src={selected.url} className="mt-3 w-full" onError={() => setError("Playback failed or the preview expired. Select Preview again to refresh it.")} /><p className="mt-2 text-sm text-slate-400">Full saved track · private preview</p></section> : null}
    {loading ? <p role="status" className="mt-6">Loading tracks…</p> : !error && tracks.length === 0 ? <p className="mt-6">No tracks in this view yet.</p> : <div className="mt-6 space-y-4">{tracks.map((track) => <article key={track.id} className="rounded-2xl border border-white/15 bg-slate-900/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold">{track.title}</h2><p className="mt-1 text-sm text-slate-400">{new Date(track.created_at).toLocaleString()} · {track.publish_status === "published" ? "Public" : "Private"} · {track.verification_status}</p></div><p className="text-lg font-bold text-orange-200">{track.grade ?? "Ungraded"} · {track.analysis_score ?? "—"}/100</p></div>
      {track.quality ? <div className="mt-3 text-sm"><p className={track.quality.reviewRequired ? "text-amber-200" : "text-sky-200"}>{track.quality.reviewRequired ? "Listening review needed" : "Technical improvement measured"} · {track.quality.before.score} → {track.quality.after.score}/100</p>{track.quality.reasons.map((reason) => <p key={reason} className="mt-2 text-slate-300">{reason}</p>)}</div> : <p className="mt-3 text-sm text-slate-400">No before/after comparison recorded for this upload.</p>}
      <button type="button" disabled={preparing === track.id} onClick={() => void preview(track)} className="mt-4 rounded-lg bg-sky-200 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{preparing === track.id ? "Preparing…" : "Preview track"}</button>
    </article>)}</div>}
    <div className="mt-6 flex items-center gap-4 text-sm"><button disabled={page === 0 || loading} onClick={() => changeView(page - 1)} className="rounded-lg border border-white/20 p-3 disabled:opacity-40">Previous</button><span>Page {page + 1} · {total} tracks</span><button disabled={(page + 1) * 25 >= total || loading} onClick={() => changeView(page + 1)} className="rounded-lg border border-white/20 p-3 disabled:opacity-40">Next</button></div>
    <p className="mt-6 text-sm text-slate-400">Technical checks are advisory and browser-reported. A rising score does not prove better sound. Compare at matched playback levels and use the same reference tracks when evaluating engine changes.</p>
  </div></main>;
}
