"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Gauge, Music2, Play, Send, ShieldCheck, Sparkles, Upload } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import { analyzeAudioFile, createWatermarkedPreview, type FileDnaAnalysis } from "../../lib/audio/file-dna";
import { storageAudioMimeType } from "../../lib/audio/mime";

type StarFile = {
  id: string;
  title: string;
  original_filename: string;
  storage_path: string;
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
  description: string | null;
  price_cents: number;
  license_type: string;
  marketplace_item_id: string | null;
  analysis: {
    content_type?: string;
    content_tags?: string[];
    content_confidence?: number;
    estimated_bpm?: number | null;
    estimated_key?: string | null;
    model_version?: string;
    feature_vector?: Record<string, unknown>;
  };
  created_at: string;
};

export default function CrucibleStarPage() {
  const [files, setFiles] = useState<StarFile[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("auto");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [price, setPrice] = useState("0");
  const [licenseType, setLicenseType] = useState("standard");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lastAnalysis, setLastAnalysis] = useState<FileDnaAnalysis | null>(null);
  const [playUrl, setPlayUrl] = useState<Record<string, string>>({});
  const [publishingId, setPublishingId] = useState("");
  const [feedbackBusyId, setFeedbackBusyId] = useState("");
  const [correctingId, setCorrectingId] = useState("");
  const [correctedType, setCorrectedType] = useState("sample");
  const [correctedCategory, setCorrectedCategory] = useState("sample");
  const [correctedBpm, setCorrectedBpm] = useState("");
  const [correctedKey, setCorrectedKey] = useState("");
  const [correctedTags, setCorrectedTags] = useState("");

  async function load() {
    const sb = createClient();
    const { data } = await sb
      .from("star_music_files")
      .select("id,title,original_filename,storage_path,category,bpm,musical_key,size_bytes,duration_seconds,sample_rate,channels,peak_dbfs,rms_dbfs,silence_percent,clipping_count,analysis_score,grade,verification_status,publish_status,description,price_cents,license_type,marketplace_item_id,analysis,created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    setFiles((data ?? []) as StarFile[]);
  }

  useEffect(() => {
    void load();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!audioFile) return setMessage("Choose a music file first.");
    setBusy(true);
    setMessage("Analyzing and verifying file…");
    setLastAnalysis(null);

    const sb = createClient();
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Sign in before uploading to Crucible Star.");
      if (audioFile.size > 250 * 1024 * 1024) throw new Error("Star currently accepts files up to 250 MB.");

      const { analysis: signalAnalysis, hash } = await analyzeAudioFile(audioFile);
      let analysis = signalAnalysis;
      const featureVector = {
        duration: analysis.duration,
        transient_rate: analysis.transientRate,
        rhythmicity: analysis.rhythmicity,
        tonality: analysis.tonality,
        estimated_bpm: analysis.estimatedBpm,
        tags: analysis.contentTags,
      };
      const calibrationResponse = await fetch("/api/file-dna/calibrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelVersion: analysis.modelVersion,
          contentType: analysis.contentType,
          suggestedCategory: analysis.suggestedCategory,
          contentConfidence: analysis.contentConfidence,
          featureVector,
        }),
      });
      if (calibrationResponse.ok) {
        const calibrated = await calibrationResponse.json() as Partial<Pick<FileDnaAnalysis, "contentType" | "suggestedCategory" | "contentConfidence" | "learnedFromExamples" | "confidenceSource">>;
        analysis = { ...analysis, ...calibrated };
        if (analysis.learnedFromExamples > 0) {
          analysis.notes = [...analysis.notes, `Confidence calibrated against ${analysis.learnedFromExamples} similar artist-confirmed File DNA entr${analysis.learnedFromExamples === 1 ? "y" : "ies"}.`];
        }
      }
      setLastAnalysis(analysis);
      if (analysis.status === "failed") throw new Error(analysis.notes[0] || "Audio verification failed.");
      const detectedCategory = category === "auto" ? analysis.suggestedCategory : category;
      const detectedBpm = bpm ? Number(bpm) : analysis.estimatedBpm;
      const detectedKey = musicalKey.trim() || analysis.estimatedKey;

      const cleanName = audioFile.name.replace(/[^A-Za-z0-9._-]+/g, "-").slice(-120);
      const path = `${user.id}/${crypto.randomUUID()}-${cleanName}`;
      const storageMimeType = storageAudioMimeType(audioFile);
      setMessage("Uploading verified master to the private Star vault…");
      const { error: uploadError } = await sb.storage.from("star-music").upload(path, audioFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: storageMimeType,
      });
      if (uploadError) throw uploadError;

      const cents = Math.max(0, Math.round(Number(price || 0) * 100));
      const { error: insertError } = await sb.from("star_music_files").insert({
        user_id: user.id,
        title: title.trim() || audioFile.name.replace(/\.[^.]+$/, ""),
        original_filename: audioFile.name,
        storage_path: path,
        mime_type: storageMimeType,
        size_bytes: audioFile.size,
        sha256: hash,
        category: detectedCategory,
        bpm: detectedBpm,
        musical_key: detectedKey,
        description: description.trim() || null,
        price_cents: cents,
        license_type: licenseType,
        duration_seconds: analysis.duration,
        sample_rate: analysis.sampleRate,
        channels: analysis.channels,
        peak_dbfs: analysis.peakDb,
        rms_dbfs: analysis.rmsDb,
        silence_percent: analysis.silencePercent,
        clipping_count: analysis.clippingCount,
        analysis_score: analysis.score,
        grade: analysis.grade,
        verification_status: analysis.status,
        verification_notes: analysis.notes,
        analysis: {
          engine: "crucible-file-dna-browser-v2",
          sha256: hash,
          analyzed_at: new Date().toISOString(),
          content_type: analysis.contentType,
          content_tags: analysis.contentTags,
          content_confidence: analysis.contentConfidence,
          estimated_bpm: analysis.estimatedBpm,
          bpm_confidence: analysis.bpmConfidence,
          estimated_key: analysis.estimatedKey,
          key_confidence: analysis.keyConfidence,
          transient_rate: analysis.transientRate,
          rhythmicity: analysis.rhythmicity,
          tonality: analysis.tonality,
          model_version: analysis.modelVersion,
          learned_from_examples: analysis.learnedFromExamples,
          confidence_source: analysis.confidenceSource,
          feature_vector: featureVector,
        },
        publish_status: analysis.status === "verified" ? "ready" : "draft",
      });
      if (insertError) {
        await sb.storage.from("star-music").remove([path]);
        throw insertError;
      }

      setMessage(`Uploaded as ${detectedCategory}. Detected ${analysis.contentType} · ${analysis.contentConfidence}% confidence · Grade ${analysis.grade} ${analysis.score}/100.`);
      setAudioFile(null);
      setTitle("");
      setDescription("");
      setBpm("");
      setMusicalKey("");
      setPrice("0");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Star upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function play(item: StarFile) {
    if (playUrl[item.id]) return;
    const sb = createClient();
    const { data, error } = await sb.storage.from("star-music").createSignedUrl(item.storage_path, 600);
    if (error || !data?.signedUrl) return setMessage(error?.message || "Could not open audio preview.");
    setPlayUrl((current) => ({ ...current, [item.id]: data.signedUrl }));
  }

  async function publish(item: StarFile) {
    if (item.marketplace_item_id || item.publish_status === "published") return;
    setPublishingId(item.id);
    setMessage("Preparing a protected marketplace listing…");
    const sb = createClient();
    let previewPath: string | null = null;
    try {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Sign in before publishing to the marketplace.");
      if (item.price_cents > 0) {
        setMessage("Creating a 30-second watermarked preview. The paid master stays private…");
        const { data: master, error: downloadError } = await sb.storage.from("star-music").download(item.storage_path);
        if (downloadError) throw downloadError;
        const preview = await createWatermarkedPreview(master);
        previewPath = `${user.id}/marketplace-previews/${item.id}.wav`;
        const { error: previewError } = await sb.storage.from("star-music").upload(previewPath, preview, {
          contentType: "audio/wav",
          cacheControl: "3600",
          upsert: true,
        });
        if (previewError) throw previewError;
      }

      const response = await fetch("/api/marketplace/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starFileId: item.id, previewPath }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Marketplace publishing failed.");
      setMessage(`Published “${item.title}” to the Sound Library. The master remains in the private vault.`);
      await load();
    } catch (error) {
      if (previewPath) await sb.storage.from("star-music").remove([previewPath]);
      setMessage(error instanceof Error ? error.message : "Marketplace publishing failed.");
    } finally {
      setPublishingId("");
    }
  }

  function beginCorrection(item: StarFile) {
    setCorrectingId(item.id);
    setCorrectedType(item.analysis?.content_type || "sample");
    setCorrectedCategory(item.category || "sample");
    setCorrectedBpm(item.bpm ? String(item.bpm) : "");
    setCorrectedKey(item.musical_key || "");
    setCorrectedTags((item.analysis?.content_tags ?? []).join(", "));
  }

  async function saveDnaFeedback(item: StarFile, confirmed: boolean) {
    const dna = item.analysis;
    if (!dna?.content_type || !dna.model_version) return setMessage("This older upload needs to be re-analyzed before it can train File DNA.");
    setFeedbackBusyId(item.id);
    setMessage(confirmed ? "Saving your File DNA confirmation…" : "Saving your correction and teaching File DNA…");
    try {
      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) throw new Error("Sign in before confirming File DNA.");
      const finalType = confirmed ? dna.content_type : correctedType;
      const finalCategory = confirmed ? item.category : correctedCategory;
      const finalBpm = confirmed ? item.bpm : correctedBpm ? Number(correctedBpm) : null;
      const finalKey = confirmed ? item.musical_key : correctedKey.trim() || null;
      const finalTags = confirmed ? dna.content_tags ?? [] : correctedTags.split(",").map((tag) => tag.trim()).filter(Boolean);
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
        corrected_type: finalType,
        corrected_category: finalCategory,
        corrected_tags: finalTags,
        corrected_bpm: finalBpm,
        corrected_key: finalKey,
        confirmed: true,
        feature_vector: dna.feature_vector ?? {},
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,star_file_id,model_version" });
      if (feedbackError) throw feedbackError;

      if (!confirmed) {
        const { error: updateError } = await sb.from("star_music_files").update({
          category: finalCategory,
          bpm: finalBpm,
          musical_key: finalKey,
          analysis: { ...dna, corrected_type: finalType, content_tags: finalTags, artist_corrected: true },
          updated_at: new Date().toISOString(),
        }).eq("id", item.id);
        if (updateError) throw updateError;
      }
      setCorrectingId("");
      setMessage(confirmed ? "DNA confirmed. This example will improve similar future analyses." : "Correction saved. File DNA will learn from this labeled example.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save File DNA feedback.");
    } finally {
      setFeedbackBusyId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-6xl px-4 py-7">
        <header className="rounded-3xl border border-orange-300/15 bg-gradient-to-br from-[#17100a] to-[#080605] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-orange-500 text-black"><Sparkles size={24} /></div>
            <div><p className="text-[10px] font-black uppercase tracking-[.28em] text-orange-300">Crucible Star</p><h1 className="text-3xl font-black">Music Intake Lab</h1></div>
            </div>
            <div className="flex gap-2"><Link href="/workstation" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Workstation</Link><Link href="/sound-library" className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Marketplace</Link></div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/50">Analyze → verify → grade → upload. Masters stay private in the Star vault until you decide they are ready for the Crucible marketplace.</p>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <form onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#0d0a08] p-5">
            <h2 className="text-lg font-black">Load a music file</h2>
            <label className="mt-4 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-orange-300/25 bg-black/20 p-5 text-center">
              <Upload className="mb-2 text-orange-300" />
              <span className="text-sm font-black">{audioFile ? audioFile.name : "Choose WAV, MP3, FLAC, AAC, M4A or OGG"}</span>
              <span className="mt-1 text-xs text-white/35">Private upload · up to 250 MB</span>
              <input className="hidden" type="file" accept="audio/*,.wav,.mp3,.flac,.aac,.m4a,.ogg" onChange={(e) => { const file = e.target.files?.[0] ?? null; setAudioFile(file); if (file && !title) setTitle(file.name.replace(/\.[^.]+$/, "")); }} />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm" />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm"><option value="auto">Auto-detect category</option><option value="beat">Beat</option><option value="loop">Loop</option><option value="sample">Sample</option><option value="one-shot">One-shot</option><option value="preset">Preset</option><option value="track">Track</option><option value="other">Other</option></select>
              <input value={bpm} onChange={(e) => setBpm(e.target.value)} inputMode="numeric" placeholder="BPM · auto if blank" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm" />
              <input value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} placeholder="Key · auto if blank" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm" />
              <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="Marketplace price · 0 = free" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm" />
              <input value={licenseType} onChange={(e) => setLicenseType(e.target.value)} placeholder="License type" className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description / notes" className="min-h-24 rounded-xl border border-white/10 bg-black/30 p-3 text-sm sm:col-span-2" />
            </div>
            <button disabled={busy || !audioFile} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-black text-black disabled:opacity-40"><ShieldCheck size={17} />{busy ? "Processing…" : "Analyze, verify & upload"}</button>
            {message ? <p className="mt-4 rounded-xl border border-orange-300/15 bg-orange-500/10 p-3 text-sm text-orange-100">{message}</p> : null}
          </form>

          <div className="rounded-3xl border border-white/10 bg-[#0d0a08] p-5">
            <h2 className="flex items-center gap-2 text-lg font-black"><Gauge size={19} />Latest grade</h2>
            {lastAnalysis ? <div className="mt-4"><div className="flex items-end gap-3"><span className="text-7xl font-black text-orange-300">{lastAnalysis.grade}</span><span className="pb-2 text-xl font-black text-white/60">{lastAnalysis.score}/100</span></div><div className="mt-3 flex flex-wrap gap-2">{lastAnalysis.contentTags.map((tag) => <span key={tag} className="rounded-full border border-orange-300/20 bg-orange-500/10 px-2.5 py-1 text-[10px] font-black uppercase text-orange-200">{tag}</span>)}</div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><Metric label="Detected type" value={`${lastAnalysis.contentType} · ${lastAnalysis.contentConfidence}%`} /><Metric label="Suggested category" value={lastAnalysis.suggestedCategory} /><Metric label="Estimated tempo" value={lastAnalysis.estimatedBpm ? `${lastAnalysis.estimatedBpm} BPM · ${lastAnalysis.bpmConfidence}%` : "No confident tempo"} /><Metric label="Estimated key" value={lastAnalysis.estimatedKey ? `${lastAnalysis.estimatedKey} · ${lastAnalysis.keyConfidence}%` : "No confident key"} /><Metric label="Peak" value={`${lastAnalysis.peakDb.toFixed(1)} dBFS`} /><Metric label="RMS" value={`${lastAnalysis.rmsDb.toFixed(1)} dBFS`} /><Metric label="Sample rate" value={`${lastAnalysis.sampleRate} Hz`} /><Metric label="Channels" value={String(lastAnalysis.channels)} /><Metric label="Duration" value={`${lastAnalysis.duration.toFixed(2)} sec`} /><Metric label="Silence" value={`${lastAnalysis.silencePercent.toFixed(1)}%`} /></div><div className="mt-4 space-y-2">{lastAnalysis.notes.map((note) => <p key={note} className="flex gap-2 text-xs leading-5 text-white/50"><CheckCircle2 size={14} className="mt-0.5 shrink-0 text-orange-300" />{note}</p>)}</div></div> : <div className="mt-8 text-center text-sm text-white/30"><Music2 className="mx-auto mb-3" />File DNA will identify the likely content, type, tempo, and key after you upload.</div>}
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-white/10 bg-[#0d0a08] p-5">
          <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-orange-300">Private vault</p><h2 className="mt-1 text-xl font-black">Star uploads</h2></div><span className="text-xs text-white/35">{files.length} files</span></div>
          <div className="mt-4 space-y-3">
            {files.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-black">{item.title}</h3><p className="mt-1 text-xs text-white/35">{item.category}{item.bpm ? ` · ${item.bpm} BPM` : ""}{item.musical_key ? ` · ${item.musical_key}` : ""}{item.price_cents > 0 ? ` · $${(item.price_cents / 100).toFixed(2)}` : " · free"}</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-black uppercase text-white/55">{item.verification_status}</span><span className="rounded-xl bg-orange-500 px-3 py-1 text-sm font-black text-black">{item.grade ?? "—"} {item.analysis_score ?? ""}</span></div></div>
                {item.analysis?.content_type ? <div className="mt-3 rounded-xl border border-sky-300/15 bg-sky-400/[0.04] p-3"><p className="text-[10px] font-black uppercase tracking-wider text-sky-200">File DNA · {item.analysis.content_type} · {item.analysis.content_confidence ?? 0}%</p><p className="mt-1 text-xs text-white/45">{(item.analysis.content_tags ?? []).join(" + ") || "No content tags"}</p></div> : null}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-white/35"><span>{item.sample_rate ? `${item.sample_rate} Hz` : "rate n/a"}</span><span>{item.channels ? `${item.channels} ch` : "channels n/a"}</span><span>{item.duration_seconds ? `${Number(item.duration_seconds).toFixed(1)} sec` : "duration n/a"}</span><span>{(item.size_bytes / 1024 / 1024).toFixed(1)} MB</span><span>{item.publish_status}</span></div>
                <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void play(item)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-black"><Play size={14} />Private preview</button>{item.analysis?.content_type ? <><button type="button" disabled={feedbackBusyId === item.id} onClick={() => void saveDnaFeedback(item, true)} className="rounded-xl border border-emerald-300/20 px-3 py-2 text-xs font-black text-emerald-200">DNA is right</button><button type="button" onClick={() => beginCorrection(item)} className="rounded-xl border border-sky-300/20 px-3 py-2 text-xs font-black text-sky-200">Correct DNA</button></> : null}{item.marketplace_item_id || item.publish_status === "published" ? <Link href="/sound-library" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black"><CheckCircle2 size={14} />Published</Link> : <button type="button" disabled={publishingId === item.id || item.verification_status === "failed"} onClick={() => void publish(item)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black disabled:opacity-40"><Send size={14} />{publishingId === item.id ? "Publishing…" : "Publish to marketplace"}</button>}</div>
                {correctingId === item.id ? <div className="mt-3 grid gap-2 rounded-2xl border border-sky-300/15 bg-sky-400/[0.04] p-3 sm:grid-cols-2"><select aria-label="Corrected content type" value={correctedType} onChange={(event) => setCorrectedType(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"><option value="one-shot">One-shot</option><option value="loop">Loop</option><option value="sample">Sample</option><option value="stem">Stem</option><option value="track">Track</option></select><select aria-label="Corrected category" value={correctedCategory} onChange={(event) => setCorrectedCategory(event.target.value)} className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"><option value="beat">Beat</option><option value="loop">Loop</option><option value="sample">Sample</option><option value="one-shot">One-shot</option><option value="track">Track</option><option value="other">Other</option></select><input aria-label="Corrected BPM" value={correctedBpm} onChange={(event) => setCorrectedBpm(event.target.value)} inputMode="numeric" placeholder="Correct BPM" className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"/><input aria-label="Corrected key" value={correctedKey} onChange={(event) => setCorrectedKey(event.target.value)} placeholder="Correct key" className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"/><input aria-label="Corrected content tags" value={correctedTags} onChange={(event) => setCorrectedTags(event.target.value)} placeholder="vocals, drums, bass…" className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm sm:col-span-2"/><div className="flex gap-2 sm:col-span-2"><button type="button" disabled={feedbackBusyId === item.id} onClick={() => void saveDnaFeedback(item, false)} className="rounded-xl bg-sky-300 px-3 py-2 text-xs font-black text-black">Save correction</button><button type="button" onClick={() => setCorrectingId("")} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black">Cancel</button></div></div> : null}
                {playUrl[item.id] ? <audio className="mt-3 w-full" controls src={playUrl[item.id]} /> : null}
              </article>
            ))}
            {files.length === 0 ? <p className="py-10 text-center text-sm text-white/30">No Star uploads yet.</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white/[0.035] p-3"><p className="text-white/30">{label}</p><p className="mt-1 font-black text-white/80">{value}</p></div>;
}
