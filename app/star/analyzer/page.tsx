"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";
import StarDnaAnalyzer from "../../../components/star/StarDnaAnalyzer";
import { createClient } from "../../../lib/supabase/client";

type StarTrack = {
  id: string;
  title: string;
  original_filename: string;
  storage_path: string;
  grade: string | null;
  analysis_score: number | null;
  verification_status: "pending" | "verified" | "warning" | "failed";
  created_at: string;
};

const COLUMNS = "id,title,original_filename,storage_path,grade,analysis_score,verification_status,created_at";

export default function CrucibleStarAnalyzerPage() {
  const [tracks, setTracks] = useState<StarTrack[]>([]);
  const [selected, setSelected] = useState<StarTrack | null>(null);
  const [audio, setAudio] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setMessage("Sign in to inspect your verified CrucibleStar DNA.");
          setLoading(false);
        }
        return;
      }
      const { data, error } = await sb
        .from("star_music_files")
        .select(COLUMNS)
        .eq("user_id", user.id)
        .eq("verification_status", "verified")
        .is("archived_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (cancelled) return;
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      const items = (data ?? []) as StarTrack[];
      setTracks(items);
      setLoading(false);
      if (items[0]) void openTrack(items[0]);
    })();
    return () => { cancelled = true; };
  }, []);

  async function openTrack(track: StarTrack) {
    setOpeningId(track.id);
    setMessage("Opening the exact verified audio version…");
    setAudio(null);
    try {
      const sb = createClient();
      const { data, error } = await sb.storage.from("star-music").download(track.storage_path);
      if (error || !data) throw error || new Error("Verified audio could not be opened.");
      setSelected(track);
      setAudio(data);
      setMessage("");
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Verified audio could not be opened.");
    } finally {
      setOpeningId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#040609] pb-28 text-white">
      <div className="mx-auto max-w-7xl px-3 py-5 sm:px-5 sm:py-7">
        <header className="rounded-3xl border border-sky-300/15 bg-gradient-to-br from-[#07121b] via-[#07090f] to-[#110912] p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-sky-300 text-sky-950 shadow-[0_0_30px_rgba(125,211,252,.22)]"><Sparkles size={24} /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.28em] text-sky-300">CrucibleStar</p>
                <h1 className="text-2xl font-black sm:text-3xl">Verified Audio DNA</h1>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/star" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/65">Back to Star</Link>
              <Link href="/workstation" className="rounded-xl border border-violet-300/20 px-3 py-2 text-xs font-black text-violet-200">Workstation</Link>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45">Two read-only views of the same measured audio: DNA Wave for fast visual inspection and Analyzer Stack for technical detail. Tap or drag anywhere on the graphs to inspect that point in the track.</p>
        </header>

        <section className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.22em] text-emerald-300">Verified masters</p>
              <p className="mt-1 text-xs text-white/35">The DNA visualization belongs to the exact verified file version.</p>
            </div>
            <ShieldCheck className="text-emerald-300" size={20} />
          </div>
          {loading ? <div className="mt-3 flex items-center gap-2 text-xs text-white/45"><LoaderCircle className="animate-spin" size={15} />Loading verified tracks…</div> : null}
          {!loading && tracks.length > 0 ? (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {tracks.map((track) => {
                const active = selected?.id === track.id;
                return (
                  <button
                    key={track.id}
                    type="button"
                    disabled={openingId === track.id}
                    onClick={() => void openTrack(track)}
                    className={`min-w-48 rounded-xl border px-3 py-3 text-left transition disabled:opacity-50 ${active ? "border-sky-300/45 bg-sky-300/10" : "border-white/8 bg-black/25"}`}
                  >
                    <span className="block truncate text-xs font-black text-white/85">{track.title}</span>
                    <span className="mt-1 block text-[10px] text-white/35">{openingId === track.id ? "Opening…" : `${track.grade ?? "—"}${typeof track.analysis_score === "number" ? ` · ${track.analysis_score}/100` : ""}`}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {!loading && tracks.length === 0 ? <p className="mt-3 text-xs text-white/40">No verified tracks yet. Verify a final master in CrucibleStar and its DNA Wave will appear here automatically.</p> : null}
          {message ? <p className="mt-3 rounded-xl border border-orange-300/15 bg-orange-400/[0.05] p-3 text-xs text-orange-100/75">{message}</p> : null}
        </section>

        <div className="mt-4">
          {selected && audio ? (
            <StarDnaAnalyzer audio={audio} title={selected.title} grade={selected.grade} score={selected.analysis_score} verified={selected.verification_status === "verified"} />
          ) : !loading && tracks.length > 0 && openingId ? (
            <div className="grid min-h-72 place-items-center rounded-3xl border border-sky-300/15 bg-sky-400/[0.035] text-sm font-black text-sky-100"><LoaderCircle className="mb-2 animate-spin" />Opening verified master…</div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
