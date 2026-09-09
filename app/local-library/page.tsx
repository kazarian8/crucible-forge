"use client";

import type { QualityAssessment, QualityComparison } from "../../lib/audio/quality-assessment";
import QualityReport from "../../components/star/QualityReport";

import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Dna, Download, LibraryBig, Play, Send, Upload, XCircle } from "lucide-react";
import { playForgeConfirmation } from "../../lib/audio/forge-confirm";
import { storageAudioMimeType } from "../../lib/audio/mime";
import { createClient } from "../../lib/supabase/client";

type StarItem = {
  id: string;
  title: string;
  original_filename: string;
  storage_path: string;
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
  analysis_score: number | null;
  grade: string | null;
  verification_status: string;
  publish_status: string;
  analysis: {
    quality?: QualityAssessment;
    quality_comparison?: QualityComparison;
    content_type?: string;
    content_tags?: string[];
    content_confidence?: number;
    estimated_bpm?: number | null;
    estimated_key?: string | null;
    model_version?: string;
    feature_vector?: Record<string, unknown>;
    artist_confirmed?: boolean;
    confidence_source?: string;
    learned_from_examples?: number;
  };
  created_at: string;
};

const STAR_COLUMNS = "id,title,original_filename,storage_path,artwork_url,category,bpm,musical_key,size_bytes,duration_seconds,sample_rate,channels,peak_dbfs,rms_dbfs,silence_percent,analysis_score,grade,verification_status,publish_status,analysis,created_at";

export default function LocalLibraryPage() {
  const downloadRequests = useRef(new Set<string>());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<StarItem[]>([]);
  const [message, setMessage] = useState("");
  const [failedArtwork, setFailedArtwork] = useState<Set<string>>(new Set());
  const [expandedTrackId, setExpandedTrackId] = useState("");
  const [openDnaId, setOpenDnaId] = useState("");
  const [feedbackBusyId, setFeedbackBusyId] = useState("");
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(() => new Set());
  const [confirmationGlowId, setConfirmationGlowId] = useState("");
  const activeAudio = useRef<HTMLAudioElement>(null);
  const attachPreviewAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (activeAudio.current !== audio) activeAudio.current?.pause();
    activeAudio.current = audio;
  }, []);
  const previewRequest = useRef(0);
  const [activePreviewId, setActivePreviewId] = useState("");
  const [playUrl, setPlayUrl] = useState<Record<string, string>>({});
  const [publishingId, setPublishingId] = useState("");
  const [unpublishingId, setUnpublishingId] = useState("");
  const previewObjectUrls = useRef<string[]>([]);

  async function load() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return setMessage("Sign in to open your private library.");
    const { data, error } = await sb.from("star_music_files").select(STAR_COLUMNS).order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setItems((data ?? []) as StarItem[]);
  }

  useEffect(() => {
    void load();
    return () => {
      previewRequest.current += 1;
      activeAudio.current?.pause();
      for (const objectUrl of previewObjectUrls.current) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  function toggleTrack(id: string) {
    // Closing a row also invalidates any preview still loading for it.
    previewRequest.current += 1;
    activeAudio.current?.pause();
    setActivePreviewId("");
    setOpenDnaId("");
    setExpandedTrackId((current) => current === id ? "" : id);
  }

  async function play(item: StarItem) {
    // Stop immediately, even while the next private file is still downloading.
    const request = ++previewRequest.current;
    const previous = activeAudio.current;
    if (previous) {
      previous.pause();
      previous.currentTime = 0;
    }
    setActivePreviewId(item.id);
    if (playUrl[item.id]) {
      if (activePreviewId === item.id && previous) {
        try { await previous.play(); }
        catch { if (request === previewRequest.current) setMessage("Tap Play in the audio controls to start this preview."); }
      }
      return;
    }
    setMessage(`Preparing “${item.title}”…`);
    try {
      const sb = createClient();
      const { data, error } = await sb.storage.from("star-music").download(item.storage_path);
      // A slower earlier request must never replace the user's latest choice.
      if (request !== previewRequest.current) return;
      if (error || !data) throw new Error(error?.message || "Could not open the private preview.");
      const mimeType = storageAudioMimeType({ name: item.original_filename, type: data.type });
      const playableBlob = data.type === mimeType ? data : new Blob([data], { type: mimeType });
      const objectUrl = URL.createObjectURL(playableBlob);
      previewObjectUrls.current.push(objectUrl);
      setPlayUrl((current) => ({ ...current, [item.id]: objectUrl }));
      setMessage(`“${item.title}” is ready. If playback does not start, tap Play below.`);
    } catch (caught) {
      if (request === previewRequest.current) setMessage(caught instanceof Error ? caught.message : "Could not open the private preview.");
    }
  }

  async function downloadTrack(item: StarItem) {
    if (downloadRequests.current.has(item.id)) return;
    downloadRequests.current.add(item.id);
    setDownloadingIds(new Set(downloadRequests.current));
    setMessage(`Preparing download for “${item.title}”…`);
    try {
      const sb = createClient();
      const filename = item.original_filename.split(/[\\/]/).pop() || "crucible-track";
      const { data, error } = await sb.storage.from("star-music").createSignedUrl(item.storage_path, 60, { download: filename });
      if (error || !data?.signedUrl) throw new Error(error?.message || "Could not prepare this download. Please retry.");
      // Signed storage response sets Content-Disposition, including on mobile Safari.
      // Download the saved audio directly, avoiding a second full-size in-memory copy.
      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = filename;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setMessage(`Download requested for “${item.title}”. Check your browser’s downloads.`);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "Could not download the track. Please retry.");
    } finally {
      downloadRequests.current.delete(item.id);
      setDownloadingIds(new Set(downloadRequests.current));
    }
  }

  async function publish(item: StarItem) {
    setPublishingId(item.id);
    setMessage("Publishing from your private library…");
    try {
      const response = await fetch("/api/marketplace/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starFileId: item.id, previewPath: null }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Publish failed.");
      setItems((current) => current.map((file) => file.id === item.id ? { ...file, publish_status: "published" } : file));
      setMessage(`“${item.title}” is published. Your private copy is still saved here.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setPublishingId("");
    }
  }

  async function unpublish(item: StarItem) {
    setUnpublishingId(item.id);
    setMessage("Removing the public listing while keeping your private copy…");
    try {
      const response = await fetch("/api/marketplace/unpublish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starFileId: item.id }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Unpublish failed.");
      setItems((current) => current.map((file) => file.id === item.id ? { ...file, publish_status: "ready" } : file));
      setMessage(`“${item.title}” is private again.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unpublish failed.");
    } finally {
      setUnpublishingId("");
    }
  }

  async function confirmDna(item: StarItem) {
    const dna = item.analysis;
    if (!dna?.content_type || !dna.model_version) return setMessage("This older file must be re-analyzed before it can teach File DNA.");
    playForgeConfirmation();
    setFeedbackBusyId(item.id);
    setMessage("Forging your confirmation into File DNA intelligence…");
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Sign in before confirming File DNA.");
      const confirmedConfidence = Math.min(99, Math.max(Number(dna.content_confidence ?? 0) + 3, 90));
      const { error: feedbackError } = await sb.from("file_dna_feedback").upsert({
        user_id: user.id,
        star_file_id: item.id,
        model_version: dna.model_version,
        predicted_type: dna.content_type,
        predicted_category: item.category,
        predicted_tags: dna.content_tags ?? [],
        predicted_bpm: dna.estimated_bpm ?? item.bpm,
        predicted_key: dna.estimated_key ?? item.musical_key,
        predicted_confidence: Math.max(0, Math.min(100, Math.round(dna.content_confidence ?? 0))),
        corrected_type: dna.content_type,
        corrected_category: item.category,
        corrected_tags: dna.content_tags ?? [],
        corrected_bpm: item.bpm,
        corrected_key: item.musical_key,
        confirmed: true,
        feature_vector: dna.feature_vector ?? {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,star_file_id,model_version" });
      if (feedbackError) throw feedbackError;
      const confirmedAnalysis = { ...dna, content_confidence: confirmedConfidence, artist_confirmed: true, confidence_source: "signal+artist-confirmed", learned_from_examples: Number(dna.learned_from_examples ?? 0) + 1 };
      const { error: updateError } = await sb.from("star_music_files").update({ analysis: confirmedAnalysis, updated_at: new Date().toISOString() }).eq("id", item.id);
      if (updateError) throw updateError;
      setItems((current) => current.map((file) => file.id === item.id ? { ...file, analysis: confirmedAnalysis } : file));
      setConfirmedIds((current) => new Set(current).add(item.id));
      setConfirmationGlowId(item.id);
      window.setTimeout(() => setConfirmationGlowId((current) => current === item.id ? "" : current), 1500);
      setMessage("DNA confirmed. Confidence increased and this example was added to Crucible intelligence.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not confirm File DNA.");
    } finally {
      setFeedbackBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-orange-300">Private vault</p><h1 className="mt-2 text-3xl font-black">Private Library</h1><p className="mt-2 text-sm text-white/45">Your audio stays private unless you explicitly publish it.</p></div><Link href="/star" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black"><Upload size={16} />Upload New</Link></div>
        {message ? <p className="mt-4 rounded-xl border border-orange-300/15 bg-orange-500/10 p-3 text-sm text-orange-100">{message}</p> : null}

        <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0a08]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h2 className="flex items-center gap-2 font-black"><LibraryBig size={18} />My files</h2><span className="text-xs text-white/35">{items.length}</span></div>
          {items.length === 0 ? <div className="p-10 text-center text-sm text-white/30">No analyzed audio yet.</div> : <div className="divide-y divide-white/10">{items.map((item) => {
            const dnaOpen = openDnaId === item.id;
            const dnaConfirmed = confirmedIds.has(item.id) || Boolean(item.analysis?.artist_confirmed);
            return <article key={item.id}>
              <h3><button type="button" id={`track-title-${item.id}`} aria-expanded={expandedTrackId === item.id} aria-controls={`track-options-${item.id}`} onClick={() => toggleTrack(item.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-base font-black text-white hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-300"><Image src={item.artwork_url && !failedArtwork.has(item.artwork_url) ? item.artwork_url : "/crucible-logo.png"} alt="" width={40} height={40} unoptimized className="size-10 shrink-0 rounded-lg object-cover" onError={() => { if (item.artwork_url) setFailedArtwork((current) => new Set(current).add(item.artwork_url!)); }} /><span className="min-w-0 break-words">{item.title}</span></button></h3>
              {expandedTrackId === item.id ? <div id={`track-options-${item.id}`} role="region" aria-labelledby={`track-title-${item.id}`} className="px-4 pb-4">
              {item.artwork_url ? <div className="mb-4 aspect-square rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${item.artwork_url})` }} /> : null}
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-white/40">{item.category}{item.duration_seconds != null ? ` · ${Number(item.duration_seconds).toFixed(2)} sec` : ""} · {item.publish_status === "published" ? "published" : "private"}</p><span className="rounded-lg bg-orange-500 px-2.5 py-1 text-xs font-black text-black">Technical: {item.verification_status}</span></div>
              <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void play(item)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black"><Play size={14} />Preview</button><button type="button" aria-label={`Download ${item.title}`} disabled={downloadingIds.has(item.id)} onClick={() => void downloadTrack(item)} className="inline-flex items-center gap-2 rounded-xl border border-orange-300/25 px-3 py-2 text-xs font-black text-orange-200 disabled:opacity-40"><Download size={14} />{downloadingIds.has(item.id) ? "Preparing…" : "Download"}</button><button type="button" aria-expanded={dnaOpen} onClick={() => setOpenDnaId(dnaOpen ? "" : item.id)} className="inline-flex items-center gap-2 rounded-xl border border-sky-300/20 px-3 py-2 text-xs font-black text-sky-200"><Dna size={14} />{dnaOpen ? "Hide DNA" : "View DNA"}{dnaOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>{item.publish_status === "published" ? (
                <button
                  type="button"
                  disabled={unpublishingId === item.id}
                  onClick={() => void unpublish(item)}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white disabled:opacity-40"
                >
                  <XCircle size={14} />{unpublishingId === item.id ? "Unpublishing…" : "Unpublish"}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={publishingId === item.id || item.verification_status === "failed"}
                  onClick={() => void publish(item)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black disabled:opacity-40"
                >
                  <Send size={14} />{publishingId === item.id ? "Publishing…" : "Publish"}
                </button>
              )}</div>
              {activePreviewId === item.id && playUrl[item.id] ? <audio key={item.id} ref={attachPreviewAudio} aria-label={`Preview ${item.title}`} className="mt-3 w-full" controls autoPlay src={playUrl[item.id]} onError={() => setMessage("This preview could not play. Try downloading the track instead.")} /> : null}
              {dnaOpen ? <div>{item.analysis?.quality?.version === "quality-measurements-v1" ? <QualityReport quality={item.analysis.quality} comparison={item.analysis.quality_comparison} /> : <p className="mt-2 text-xs text-white/50">Legacy technical assessment. Reanalyze the audio for detailed quality checks.</p>}</div> : null}
              {dnaOpen ? <div className="mt-3 rounded-2xl border border-sky-300/15 bg-sky-400/[0.04] p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-sky-200">File DNA · {item.analysis?.content_type ?? "unanalyzed"}</p><p className="mt-1 text-xs text-white/45">{(item.analysis?.content_tags ?? []).join(" + ") || "No content tags"}</p></div><span className="text-sm font-black text-sky-200 transition-all duration-500">{item.analysis?.content_confidence ?? 0}%</span></div><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><Metric label="Tempo" value={item.bpm ? `${item.bpm} BPM` : "Not detected"} /><Metric label="Key" value={item.musical_key || "Not detected"} /><Metric label="Peak" value={item.peak_dbfs == null ? "—" : `${Number(item.peak_dbfs).toFixed(1)} dBFS`} /><Metric label="RMS" value={item.rms_dbfs == null ? "—" : `${Number(item.rms_dbfs).toFixed(1)} dBFS`} /><Metric label="Silence" value={item.silence_percent == null ? "—" : `${Number(item.silence_percent).toFixed(1)}%`} /><Metric label="Sample rate" value={item.sample_rate ? `${item.sample_rate} Hz` : "—"} /><Metric label="Channels" value={item.channels ? String(item.channels) : "—"} /><Metric label="Size" value={`${(item.size_bytes / 1024 / 1024).toFixed(2)} MB`} /></div>{dnaConfirmed ? <span className={`mt-3 inline-flex rounded-xl border px-3 py-2 text-xs font-black transition-all duration-500 ${confirmationGlowId === item.id ? "border-emerald-200 bg-emerald-300 text-black shadow-[0_0_24px_rgba(110,231,183,0.7)]" : "border-emerald-300/15 text-emerald-200"}`}>{confirmationGlowId === item.id ? `DNA confirmed · ${item.analysis?.content_confidence ?? 0}%` : "DNA confirmed"}</span> : <button type="button" disabled={feedbackBusyId === item.id} onClick={() => void confirmDna(item)} className="mt-3 rounded-xl border border-emerald-300/20 px-3 py-2 text-xs font-black text-emerald-200">{feedbackBusyId === item.id ? "Forging confirmation…" : "Confirm DNA"}</button>}</div> : null}
              </div> : null}
            </article>;
          })}</div>}
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.03] p-2 text-xs"><p className="text-white/30">{label}</p><p className="mt-1 font-black text-white/70">{value}</p></div>;
}
