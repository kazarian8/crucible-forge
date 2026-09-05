"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Dna, Gauge, Music2, ShieldCheck, Star } from "lucide-react";
import { createClient } from "../../../lib/supabase/client";

type StarTrack = {
  id: string;
  title: string;
  artwork_url: string | null;
  category: string;
  bpm: number | null;
  musical_key: string | null;
  size_bytes: number;
  duration_seconds: number | null;
  sample_rate: number | null;
  channels: number | null;
  peak_dbfs: number | null;
  rms_dbfs: number | null;
  silence_percent: number | null;
  clipping_count: number;
  analysis_score: number | null;
  grade: string | null;
  verification_status: "pending" | "verified" | "warning" | "failed";
  publish_status: "draft" | "ready" | "published" | "rejected";
  analysis: {
    content_type?: string;
    content_tags?: string[];
    content_confidence?: number;
    estimated_bpm?: number | null;
    estimated_key?: string | null;
    model_version?: string;
    artist_confirmed?: boolean;
    confidence_source?: string;
    learned_from_examples?: number;
  } | null;
  created_at: string;
};

const STAR_COLUMNS = "id,title,artwork_url,category,bpm,musical_key,size_bytes,duration_seconds,sample_rate,channels,peak_dbfs,rms_dbfs,silence_percent,clipping_count,analysis_score,grade,verification_status,publish_status,analysis,created_at";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <p className="text-[10px] font-black uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-1 text-sm font-black text-white/80">{value}</p>
    </div>
  );
}

export default function CrucibleStarTrackPage() {
  const params = useParams<{ id: string }>();
  const trackId = params.id;
  const [track, setTrack] = useState<StarTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!trackId) return;
      setLoading(true);
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setMessage("Sign in to view this private Crucible Star DNA report.");
          setTrack(null);
          setLoading(false);
        }
        return;
      }
      const { data, error } = await sb
        .from("star_music_files")
        .select(STAR_COLUMNS)
        .eq("id", trackId)
        .eq("user_id", user.id)
        .single();
      if (cancelled) return;
      if (error || !data) {
        setTrack(null);
        setMessage("This Crucible Star report could not be opened.");
      } else {
        setTrack(data as StarTrack);
        setMessage("");
      }
      setLoading(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [trackId]);

  if (loading) {
    return <main className="min-h-screen bg-[#050403] p-8 text-white"><p>Opening Crucible Star DNA…</p></main>;
  }

  if (!track) {
    return (
      <main className="min-h-screen bg-[#050403] p-8 text-white">
        <Link href="/local-library" className="inline-flex items-center gap-2 font-black"><ArrowLeft size={17} />My Tracks</Link>
        <p className="mt-8 text-white/60">{message || "Track not found."}</p>
      </main>
    );
  }

  const dna = track.analysis ?? {};
  const score = track.analysis_score == null ? "—" : String(track.analysis_score);
  const statusLabel = track.verification_status === "verified"
    ? "Verified"
    : track.verification_status === "warning"
      ? "Verified with warning"
      : track.verification_status === "failed"
        ? "Verification failed"
        : "Verification pending";

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link href="/local-library" className="inline-flex items-center gap-2 text-sm font-black text-white/70"><ArrowLeft size={17} />My Tracks</Link>

        <header className="mt-5 rounded-3xl border border-orange-300/20 bg-gradient-to-br from-[#17100a] to-[#080605] p-5 sm:p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl border border-orange-200/30 bg-gradient-to-br from-orange-300 to-orange-600 text-black shadow-[0_0_28px_rgba(249,115,22,0.22)]">
              <Star size={34} fill="currentColor" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.28em] text-orange-300">Crucible Star · File DNA</p>
              <h1 className="mt-1 truncate text-3xl font-black">{track.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">Crucible Star analyzes this exact saved audio file, records its File DNA and technical signals, and assigns a grade. The report is an audio-analysis record, not proof of copyright ownership.</p>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-[1fr_1.25fr]">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0a08]">
            <div className="aspect-square bg-gradient-to-br from-orange-500/50 to-black bg-cover bg-center" style={track.artwork_url ? { backgroundImage: `url(${track.artwork_url})` } : undefined}>
              {!track.artwork_url ? <div className="grid h-full place-items-center"><Music2 size={54} className="text-white/25" /></div> : null}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d0a08] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-white/35">Crucible Star rating</p>
                <div className="mt-2 flex items-end gap-2"><span className="text-5xl font-black text-orange-300">{score}</span><span className="pb-1 text-sm font-black text-white/35">/100</span></div>
              </div>
              <div className="rounded-2xl bg-orange-500 px-4 py-3 text-center text-black">
                <p className="text-[10px] font-black uppercase">Grade</p>
                <p className="text-2xl font-black">{track.grade ?? "—"}</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/20 bg-emerald-400/5 px-3 py-2 text-xs font-black text-emerald-200"><ShieldCheck size={15} />{statusLabel}</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/5 px-3 py-2 text-xs font-black text-sky-200"><Dna size={15} />{dna.content_type || track.category}</span>
              <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/55"><Gauge size={15} />{dna.content_confidence ?? 0}% DNA confidence</span>
            </div>
            {(dna.content_tags ?? []).length > 0 ? <p className="mt-4 text-sm leading-6 text-white/45">{(dna.content_tags ?? []).join(" · ")}</p> : null}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-[#0d0a08] p-5">
          <div className="flex items-center gap-2"><Dna size={19} className="text-sky-200" /><h2 className="text-lg font-black">Track DNA</h2></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Tempo" value={track.bpm ? `${track.bpm} BPM` : "Not detected"} />
            <Metric label="Key" value={track.musical_key || "Not detected"} />
            <Metric label="Duration" value={track.duration_seconds == null ? "—" : `${Number(track.duration_seconds).toFixed(2)} sec`} />
            <Metric label="Sample rate" value={track.sample_rate ? `${track.sample_rate} Hz` : "—"} />
            <Metric label="Channels" value={track.channels ? String(track.channels) : "—"} />
            <Metric label="Peak" value={track.peak_dbfs == null ? "—" : `${Number(track.peak_dbfs).toFixed(1)} dBFS`} />
            <Metric label="RMS" value={track.rms_dbfs == null ? "—" : `${Number(track.rms_dbfs).toFixed(1)} dBFS`} />
            <Metric label="Silence" value={track.silence_percent == null ? "—" : `${Number(track.silence_percent).toFixed(1)}%`} />
            <Metric label="Clipping events" value={String(track.clipping_count ?? 0)} />
            <Metric label="File size" value={`${(track.size_bytes / 1024 / 1024).toFixed(2)} MB`} />
            <Metric label="Publish state" value={track.publish_status} />
            <Metric label="Model" value={dna.model_version || "Legacy analysis"} />
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-orange-300/15 bg-orange-500/[0.05] p-5">
          <div className="flex items-start gap-3"><Star size={20} fill="currentColor" className="mt-0.5 shrink-0 text-orange-300" /><div><h2 className="font-black">What the Star means</h2><p className="mt-1 text-sm leading-6 text-white/55">A Crucible Star report means Crucible successfully analyzed and graded this saved file. A lower score does not mean the track is stolen, and a high score does not establish copyright ownership. Rights checks and ownership claims are handled separately.</p></div></div>
        </section>
      </div>
    </main>
  );
}
