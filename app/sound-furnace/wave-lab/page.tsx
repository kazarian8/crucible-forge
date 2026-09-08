"use client";

import {
  ChangeEvent,
  PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AudioWaveform,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Scissors,
  Upload,
  Undo2,
  Volume2,
} from "lucide-react";

const MAX_TRACKS = 16;
const MIN_CLIP_SECONDS = 0.05;
const GAIN_MIN = -24;
const GAIN_MAX = 12;

type StemTrack = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  peaks: number[];
  startSeconds: number;
  trimStartSeconds: number;
  trimEndSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  gainDb: number;
  pan: number;
  muted: boolean;
  solo: boolean;
};

type DragMode = "clip" | "trim-left" | "trim-right" | "fade-in" | "fade-out";

type DragState = {
  pointerId: number;
  trackId: string;
  mode: DragMode;
  startX: number;
  startY: number;
  startTrack: StemTrack;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));
}

function dbToGain(value: number) {
  return Math.pow(10, value / 20);
}

function durationOf(track: StemTrack) {
  return Math.max(MIN_CLIP_SECONDS, track.trimEndSeconds - track.trimStartSeconds);
}

function projectDuration(tracks: StemTrack[]) {
  return Math.max(1, ...tracks.map((track) => track.startSeconds + durationOf(track)));
}

function formatTime(value: number) {
  const safe = Math.max(0, value);
  const minutes = Math.floor(safe / 60);
  const seconds = safe - minutes * 60;
  return `${minutes}:${seconds.toFixed(1).padStart(4, "0")}`;
}

function waveformPeaks(buffer: AudioBuffer, count = 360) {
  const peaks = Array.from({ length: count }, () => 0);
  const block = Math.max(1, Math.floor(buffer.length / count));
  for (let point = 0; point < count; point += 1) {
    const start = point * block;
    const end = Math.min(buffer.length, start + block);
    let peak = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = start; index < end; index += 1) {
        peak = Math.max(peak, Math.abs(data[index]));
      }
    }
    peaks[point] = peak;
  }
  return peaks;
}

function visiblePeaks(track: StemTrack) {
  const total = Math.max(0.001, track.buffer.duration);
  const first = Math.floor((track.trimStartSeconds / total) * track.peaks.length);
  const last = Math.ceil((track.trimEndSeconds / total) * track.peaks.length);
  return track.peaks.slice(clamp(first, 0, track.peaks.length - 1), clamp(last, first + 1, track.peaks.length));
}

export default function ForgeWaveLabPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const liveGainsRef = useRef(new Map<string, GainNode>());
  const animationRef = useRef<number | null>(null);
  const playbackOriginRef = useRef({ contextTime: 0, playhead: 0 });
  const dragRef = useRef<DragState | null>(null);
  const undoRef = useRef<StemTrack[][]>([]);
  const redoRef = useRef<StemTrack[][]>([]);
  const tracksRef = useRef<StemTrack[]>([]);

  const [tracks, setTracks] = useState<StemTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState("Upload stems to test the direct-edit waveform.");
  const [error, setError] = useState("");
  const [undoDepth, setUndoDepth] = useState(0);
  const [redoDepth, setRedoDepth] = useState(0);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => () => {
    stopPlayback(false);
    if (audioContextRef.current?.state !== "closed") void audioContextRef.current?.close();
  }, []);

  const duration = useMemo(() => projectDuration(tracks), [tracks]);
  const pixelsPerSecond = 36 * zoom;
  const timelineWidth = Math.max(780, duration * pixelsPerSecond + 80);
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null;
  const canUndo = historyVersion >= 0 && undoRef.current.length > 0;
  const canRedo = historyVersion >= 0 && redoRef.current.length > 0;

  function recordHistory() {
    undoRef.current.push(tracksRef.current.map((track) => ({ ...track })));
    if (undoRef.current.length > 60) undoRef.current.shift();
    redoRef.current = [];
    setHistoryVersion((value) => value + 1);
  }

  function replaceTrack(id: string, patch: Partial<StemTrack>, addHistory = true) {
    if (addHistory) recordHistory();
    setTracks((current) => current.map((track) => track.id === id ? { ...track, ...patch } : track));
    if (patch.gainDb !== undefined) {
      const node = liveGainsRef.current.get(id);
      const context = audioContextRef.current;
      if (node && context) node.gain.setTargetAtTime(dbToGain(patch.gainDb), context.currentTime, 0.015);
    }
  }

  function undo() {
    const previous = undoRef.current.pop();
    if (!previous) return;
    redoRef.current.push(tracksRef.current.map((track) => ({ ...track })));
    setTracks(previous);
    setHistoryVersion((value) => value + 1);
    setStatus("Undid the last waveform edit.");
  }

  function redo() {
    const next = redoRef.current.pop();
    if (!next) return;
    undoRef.current.push(tracksRef.current.map((track) => ({ ...track })));
    setTracks(next);
    setHistoryVersion((value) => value + 1);
    setStatus("Redid the waveform edit.");
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, MAX_TRACKS - tracks.length);
    if (!files.length) return;
    setError("");
    setStatus(`Opening ${files.length} stem${files.length === 1 ? "" : "s"} locally…`);
    try {
      const context = new AudioContext();
      const additions: StemTrack[] = [];
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(bytes.slice(0));
        additions.push({
          id: crypto.randomUUID(),
          name: file.name,
          buffer,
          peaks: waveformPeaks(buffer),
          startSeconds: 0,
          trimStartSeconds: 0,
          trimEndSeconds: buffer.duration,
          fadeInSeconds: Math.min(0.02, buffer.duration / 2),
          fadeOutSeconds: Math.min(0.04, buffer.duration / 2),
          gainDb: 0,
          pan: 0,
          muted: false,
          solo: false,
        });
      }
      await context.close();
      recordHistory();
      setTracks((current) => [...current, ...additions]);
      setSelectedTrackId((current) => current || additions[0]?.id || "");
      setStatus("Ready. Drag a waveform left/right for timing and up/down for volume. Use the edge handles for trims and fades.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "One of the audio files could not be decoded.");
      setStatus("Import stopped safely.");
    } finally {
      event.target.value = "";
    }
  }

  function stopPlayback(reset = false) {
    activeSourcesRef.current.forEach((source) => {
      try { source.stop(); } catch {}
    });
    activeSourcesRef.current = [];
    liveGainsRef.current.clear();
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    setPlaying(false);
    if (reset) setPlayheadSeconds(0);
  }

  function fadeFactor(track: StemTrack, clipPosition: number) {
    const clipDuration = durationOf(track);
    if (track.fadeInSeconds > 0 && clipPosition < track.fadeInSeconds) {
      return clamp(clipPosition / track.fadeInSeconds, 0, 1);
    }
    const fadeOutStart = clipDuration - track.fadeOutSeconds;
    if (track.fadeOutSeconds > 0 && clipPosition > fadeOutStart) {
      return clamp((clipDuration - clipPosition) / track.fadeOutSeconds, 0, 1);
    }
    return 1;
  }

  async function play() {
    if (!tracksRef.current.length) return;
    stopPlayback(false);
    const Context = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) {
      setError("This browser does not expose Web Audio.");
      return;
    }
    const context = audioContextRef.current && audioContextRef.current.state !== "closed"
      ? audioContextRef.current
      : new Context();
    audioContextRef.current = context;
    if (context.state === "suspended") await context.resume();

    const now = context.currentTime + 0.035;
    const startHead = clamp(playheadSeconds, 0, duration);
    playbackOriginRef.current = { contextTime: now, playhead: startHead };
    const currentTracks = tracksRef.current;
    const hasSolo = currentTracks.some((track) => track.solo);

    for (const track of currentTracks) {
      if (track.muted || (hasSolo && !track.solo)) continue;
      const clipDuration = durationOf(track);
      const clipEnd = track.startSeconds + clipDuration;
      if (clipEnd <= startHead) continue;

      const clipOffset = Math.max(0, startHead - track.startSeconds);
      const when = now + Math.max(0, track.startSeconds - startHead);
      const sourceOffset = track.trimStartSeconds + clipOffset;
      const playDuration = clipDuration - clipOffset;
      if (playDuration <= 0) continue;

      const source = context.createBufferSource();
      const gain = context.createGain();
      const panner = context.createStereoPanner();
      const base = dbToGain(track.gainDb);
      const startLevel = base * fadeFactor(track, clipOffset);
      source.buffer = track.buffer;
      gain.gain.setValueAtTime(startLevel, when);

      if (track.fadeInSeconds > clipOffset) {
        gain.gain.linearRampToValueAtTime(base, when + (track.fadeInSeconds - clipOffset));
      }
      const fadeOutStart = clipDuration - track.fadeOutSeconds;
      if (track.fadeOutSeconds > 0 && fadeOutStart >= clipOffset) {
        gain.gain.setValueAtTime(base, when + (fadeOutStart - clipOffset));
        gain.gain.linearRampToValueAtTime(0, when + playDuration);
      }

      panner.pan.value = track.pan;
      source.connect(gain).connect(panner).connect(context.destination);
      liveGainsRef.current.set(track.id, gain);
      source.start(when, sourceOffset, playDuration);
      activeSourcesRef.current.push(source);
    }

    setPlaying(true);
    setStatus("Playing all active stems from the same clock.");
    const tick = () => {
      const activeContext = audioContextRef.current;
      if (!activeContext) return;
      const origin = playbackOriginRef.current;
      const next = origin.playhead + Math.max(0, activeContext.currentTime - origin.contextTime);
      if (next >= duration) {
        stopPlayback(true);
        return;
      }
      setPlayheadSeconds(next);
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
  }

  function beginDrag(event: ReactPointerEvent<HTMLElement>, track: StemTrack, mode: DragMode) {
    event.preventDefault();
    event.stopPropagation();
    recordHistory();
    setSelectedTrackId(track.id);
    dragRef.current = {
      pointerId: event.pointerId,
      trackId: track.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      startTrack: { ...track },
    };
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch {}
  }

  function moveDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.preventDefault();
    const dxSeconds = (event.clientX - drag.startX) / pixelsPerSecond;
    const dy = event.clientY - drag.startY;
    const track = drag.startTrack;
    const currentDuration = durationOf(track);
    let patch: Partial<StemTrack> = {};

    if (drag.mode === "clip") {
      patch = {
        startSeconds: Math.max(0, track.startSeconds + dxSeconds),
        gainDb: clamp(track.gainDb - dy * 0.08, GAIN_MIN, GAIN_MAX),
      };
    } else if (drag.mode === "trim-left") {
      const maxTrim = track.trimEndSeconds - MIN_CLIP_SECONDS;
      const nextTrim = clamp(track.trimStartSeconds + dxSeconds, 0, maxTrim);
      const applied = nextTrim - track.trimStartSeconds;
      patch = {
        trimStartSeconds: nextTrim,
        startSeconds: Math.max(0, track.startSeconds + applied),
        fadeInSeconds: Math.min(track.fadeInSeconds, (currentDuration - applied) / 2),
      };
    } else if (drag.mode === "trim-right") {
      patch = {
        trimEndSeconds: clamp(track.trimEndSeconds + dxSeconds, track.trimStartSeconds + MIN_CLIP_SECONDS, track.buffer.duration),
      };
    } else if (drag.mode === "fade-in") {
      patch = { fadeInSeconds: clamp(track.fadeInSeconds + dxSeconds, 0, currentDuration / 2) };
    } else if (drag.mode === "fade-out") {
      patch = { fadeOutSeconds: clamp(track.fadeOutSeconds - dxSeconds, 0, currentDuration / 2) };
    }

    replaceTrack(drag.trackId, patch, false);
  }

  function endDrag(event: ReactPointerEvent<HTMLElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    try {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {}
    dragRef.current = null;
    setStatus("Edit applied. Undo/redo is available.");
  }

  function restartActiveMix() {
    if (!playing) return;
    const context = audioContextRef.current;
    if (context) {
      const origin = playbackOriginRef.current;
      setPlayheadSeconds(origin.playhead + Math.max(0, context.currentTime - origin.contextTime));
    }
    window.setTimeout(() => void play(), 0);
  }

  function toggleMute(track: StemTrack) {
    replaceTrack(track.id, { muted: !track.muted });
    restartActiveMix();
  }

  function toggleSolo(track: StemTrack) {
    replaceTrack(track.id, { solo: !track.solo });
    restartActiveMix();
  }

  function resetSelected() {
    if (!selectedTrack) return;
    replaceTrack(selectedTrack.id, {
      startSeconds: 0,
      trimStartSeconds: 0,
      trimEndSeconds: selectedTrack.buffer.duration,
      fadeInSeconds: Math.min(0.02, selectedTrack.buffer.duration / 2),
      fadeOutSeconds: Math.min(0.04, selectedTrack.buffer.duration / 2),
      gainDb: 0,
      pan: 0,
      muted: false,
      solo: false,
    });
    setStatus("Selected stem reset to its imported state.");
  }

  function seekFromRuler(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const next = clamp(x / pixelsPerSecond, 0, duration);
    stopPlayback(false);
    setPlayheadSeconds(next);
    setStatus(`Playhead moved to ${formatTime(next)}.`);
  }

  return (
    <main className="min-h-screen bg-[#070707] pb-24 text-white">
      <div className="border-b border-white/10 bg-black/70 px-3 py-3 sm:px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/80">
              <AudioWaveform size={14} /> Crucible Forge · Wave Lab
            </p>
            <h1 className="mt-1 text-xl font-black">Direct-edit stem workstation</h1>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-white/45">Test build: drag the wave itself to edit timing and volume. Audio stays on-device and this lab does not use credits.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input ref={fileRef} type="file" accept="audio/*,.wav,.mp3,.flac,.aiff,.aif,.m4a,.aac,.ogg,.webm" multiple className="sr-only" onChange={handleFiles} />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={tracks.length >= MAX_TRACKS} className="flex items-center gap-2 rounded-xl bg-orange-400 px-4 py-2.5 text-xs font-black text-black disabled:opacity-30"><Upload size={15} /> Add stems</button>
            <button type="button" onClick={undo} disabled={!canUndo} className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/60 disabled:opacity-25" aria-label="Undo"><Undo2 size={17} /></button>
            <button type="button" onClick={redo} disabled={!canRedo} className="grid size-10 place-items-center rounded-xl border border-white/10 text-white/60 disabled:opacity-25" aria-label="Redo"><Redo2 size={17} /></button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5">
        <section className="mb-4 grid gap-2 rounded-2xl border border-orange-300/15 bg-orange-400/[0.04] p-3 text-[11px] font-bold text-orange-100/75 sm:grid-cols-4">
          <span>↔ Drag wave: move timing</span>
          <span>↕ Drag wave: volume</span>
          <span>Gold handles: fade in/out</span>
          <span>Orange edge handles: trim</span>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b0b0c]">
          <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-black/55 p-2.5">
            <button type="button" onClick={() => playing ? stopPlayback(false) : void play()} disabled={!tracks.length} className="grid size-10 place-items-center rounded-full bg-orange-400 text-black disabled:opacity-25" aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <span className="min-w-20 font-mono text-sm font-black tabular-nums text-orange-100">{formatTime(playheadSeconds)}</span>
            <button type="button" onClick={() => { stopPlayback(true); setStatus("Returned to the beginning."); }} disabled={!tracks.length} className="grid size-9 place-items-center rounded-lg bg-white/[0.06] text-white/55 disabled:opacity-25" aria-label="Return to start"><RotateCcw size={15} /></button>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-white/35">Zoom</span>
              <input aria-label="Timeline zoom" type="range" min="0.7" max="3" step="0.1" value={zoom} onChange={(event) => setZoom(event.target.valueAsNumber)} className="w-28 accent-orange-400" />
              <span className="w-10 font-mono text-[9px] text-white/40">{Math.round(zoom * 100)}%</span>
            </div>
          </div>

          {tracks.length === 0 ? (
            <button type="button" onClick={() => fileRef.current?.click()} className="m-3 flex min-h-[420px] w-[calc(100%-1.5rem)] flex-col items-center justify-center border border-dashed border-orange-300/20 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:48px_48px] text-center">
              <span className="grid size-16 place-items-center rounded-full border border-orange-300/25 bg-orange-400/10 text-orange-200"><Scissors size={24} /></span>
              <span className="mt-4 text-sm font-black">Upload stems and touch the waves</span>
              <span className="mt-1 max-w-md text-xs leading-5 text-white/35">This is the editable version of the CrucibleStar wave concept: each stem becomes a lane you can move, trim, fade, mute, solo, pan, and gain-stage.</span>
            </button>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ width: `${timelineWidth + 150}px`, minWidth: "100%" }}>
                <div className="grid grid-cols-[150px_1fr] border-b border-white/10 bg-[#101010]">
                  <div className="border-r border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white/30">Stems</div>
                  <div className="relative h-9 cursor-crosshair" onPointerDown={seekFromRuler}>
                    {Array.from({ length: Math.ceil(duration / 5) + 1 }, (_, index) => index * 5).map((second) => (
                      <span key={second} className="absolute top-0 h-full border-l border-white/10 px-1 pt-2 font-mono text-[9px] text-white/35" style={{ left: `${second * pixelsPerSecond}px` }}>{formatTime(second)}</span>
                    ))}
                    <span className="pointer-events-none absolute inset-y-0 w-px bg-orange-300" style={{ left: `${playheadSeconds * pixelsPerSecond}px` }} />
                  </div>
                </div>

                {tracks.map((track, index) => {
                  const clipDuration = durationOf(track);
                  const peaks = visiblePeaks(track);
                  const selected = selectedTrack?.id === track.id;
                  const fadeInPx = track.fadeInSeconds * pixelsPerSecond;
                  const fadeOutPx = track.fadeOutSeconds * pixelsPerSecond;
                  return (
                    <article key={track.id} className={`grid min-h-[104px] grid-cols-[150px_1fr] border-b border-white/[0.07] ${selected ? "bg-orange-400/[0.035]" : index % 2 ? "bg-white/[0.012]" : ""}`}>
                      <div className="border-r border-white/10 p-2.5">
                        <button type="button" onClick={() => setSelectedTrackId(track.id)} className="block w-full truncate text-left text-[11px] font-black text-white/80" title={track.name}>{track.name}</button>
                        <div className="mt-2 flex gap-1">
                          <button type="button" aria-pressed={track.muted} onClick={() => toggleMute(track)} className={`grid size-8 place-items-center rounded text-[9px] font-black ${track.muted ? "bg-red-500" : "bg-white/8 text-white/50"}`}>M</button>
                          <button type="button" aria-pressed={track.solo} onClick={() => toggleSolo(track)} className={`grid size-8 place-items-center rounded text-[9px] font-black ${track.solo ? "bg-amber-300 text-black" : "bg-white/8 text-white/50"}`}>S</button>
                          <span className="ml-auto self-center font-mono text-[9px] text-orange-200/70">{track.gainDb > 0 ? "+" : ""}{track.gainDb.toFixed(1)}dB</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1 text-[9px] text-white/35"><Volume2 size={11} /> pan {track.pan.toFixed(1)}</div>
                      </div>

                      <div className="relative overflow-hidden bg-[repeating-linear-gradient(90deg,transparent_0,transparent_calc(5*var(--pps)-1px),rgba(255,255,255,.035)_calc(5*var(--pps)))]" style={{ "--pps": `${pixelsPerSecond}px` } as React.CSSProperties}>
                        <span className="pointer-events-none absolute inset-y-0 z-30 w-px bg-orange-300/90" style={{ left: `${playheadSeconds * pixelsPerSecond}px` }} />
                        <div
                          className={`absolute top-3 h-[78px] touch-none select-none overflow-visible rounded-lg border ${selected ? "border-orange-200 ring-1 ring-orange-300/40" : "border-orange-300/25"} bg-[#21130c] shadow-lg`}
                          style={{ left: `${track.startSeconds * pixelsPerSecond}px`, width: `${Math.max(18, clipDuration * pixelsPerSecond)}px` }}
                          onPointerDown={(event) => beginDrag(event, track, "clip")}
                          onPointerMove={moveDrag}
                          onPointerUp={endDrag}
                          onPointerCancel={endDrag}
                          role="button"
                          tabIndex={0}
                          aria-label={`${track.name}: drag left or right for timing, up or down for volume`}
                        >
                          <svg viewBox={`0 0 ${Math.max(1, peaks.length)} 100`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
                            <line x1="0" y1="50" x2={Math.max(1, peaks.length)} y2="50" stroke="rgba(255,255,255,.12)" strokeWidth="1" />
                            {peaks.map((peak, point) => {
                              const scaled = clamp(peak * dbToGain(track.gainDb), 0.01, 1);
                              const height = Math.max(1, scaled * 86);
                              return <rect key={point} x={point} y={50 - height / 2} width="0.8" height={height} fill={track.muted ? "rgba(248,113,113,.35)" : "rgba(251,146,60,.9)"} />;
                            })}
                          </svg>

                          {track.fadeInSeconds > 0 ? <span className="pointer-events-none absolute inset-y-0 left-0 bg-gradient-to-r from-black/55 to-transparent" style={{ width: `${fadeInPx}px` }} /> : null}
                          {track.fadeOutSeconds > 0 ? <span className="pointer-events-none absolute inset-y-0 right-0 bg-gradient-to-l from-black/55 to-transparent" style={{ width: `${fadeOutPx}px` }} /> : null}

                          <span
                            className="absolute inset-y-0 -left-1 z-20 w-3 cursor-ew-resize rounded-l bg-orange-300/70"
                            onPointerDown={(event) => beginDrag(event, track, "trim-left")}
                            onPointerMove={moveDrag}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            title="Trim start"
                          />
                          <span
                            className="absolute inset-y-0 -right-1 z-20 w-3 cursor-ew-resize rounded-r bg-orange-300/70"
                            onPointerDown={(event) => beginDrag(event, track, "trim-right")}
                            onPointerMove={moveDrag}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            title="Trim end"
                          />
                          <span
                            className="absolute -top-1 z-30 grid size-5 -translate-x-1/2 place-items-center rounded-full border border-amber-100/60 bg-amber-300 text-[8px] font-black text-black"
                            style={{ left: `${fadeInPx}px` }}
                            onPointerDown={(event) => beginDrag(event, track, "fade-in")}
                            onPointerMove={moveDrag}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            title="Fade in"
                          >F</span>
                          <span
                            className="absolute -top-1 z-30 grid size-5 translate-x-1/2 place-items-center rounded-full border border-amber-100/60 bg-amber-300 text-[8px] font-black text-black"
                            style={{ right: `${fadeOutPx}px` }}
                            onPointerDown={(event) => beginDrag(event, track, "fade-out")}
                            onPointerMove={moveDrag}
                            onPointerUp={endDrag}
                            onPointerCancel={endDrag}
                            title="Fade out"
                          >F</span>
                          <span className="pointer-events-none absolute bottom-1 left-3 z-20 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[8px] text-orange-100/80">{formatTime(track.startSeconds)} · {track.gainDb > 0 ? "+" : ""}{track.gainDb.toFixed(1)} dB</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {selectedTrack ? (
          <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300/70">Selected stem</p>
                <h2 className="truncate text-sm font-black">{selectedTrack.name}</h2>
              </div>
              <button type="button" onClick={resetSelected} className="rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-white/55">Reset stem</button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <label className="text-[9px] font-black uppercase tracking-wider text-white/35">Gain {selectedTrack.gainDb.toFixed(1)} dB<input type="range" min={GAIN_MIN} max={GAIN_MAX} step="0.1" value={selectedTrack.gainDb} onChange={(event) => replaceTrack(selectedTrack.id, { gainDb: event.target.valueAsNumber })} className="mt-2 w-full accent-orange-400" /></label>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/35">Pan {selectedTrack.pan.toFixed(2)}<input type="range" min="-1" max="1" step="0.01" value={selectedTrack.pan} onChange={(event) => replaceTrack(selectedTrack.id, { pan: event.target.valueAsNumber })} className="mt-2 w-full accent-orange-400" /></label>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/35">Fade in {selectedTrack.fadeInSeconds.toFixed(2)}s<input type="range" min="0" max={durationOf(selectedTrack) / 2} step="0.01" value={selectedTrack.fadeInSeconds} onChange={(event) => replaceTrack(selectedTrack.id, { fadeInSeconds: event.target.valueAsNumber })} className="mt-2 w-full accent-amber-300" /></label>
              <label className="text-[9px] font-black uppercase tracking-wider text-white/35">Fade out {selectedTrack.fadeOutSeconds.toFixed(2)}s<input type="range" min="0" max={durationOf(selectedTrack) / 2} step="0.01" value={selectedTrack.fadeOutSeconds} onChange={(event) => replaceTrack(selectedTrack.id, { fadeOutSeconds: event.target.valueAsNumber })} className="mt-2 w-full accent-amber-300" /></label>
            </div>
          </section>
        ) : null}

        <div className="mt-4 rounded-xl border border-white/8 bg-black/30 px-3 py-2.5 text-xs text-white/55" aria-live="polite">{status}{error ? <span className="ml-2 text-red-300">{error}</span> : null}</div>

        <section className="mt-4 rounded-2xl border border-sky-300/15 bg-sky-400/[0.035] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-sky-200/70">CrucibleStar handoff</p>
          <p className="mt-1 text-sm font-black text-white/85">Same wave, now editable.</p>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/45">This test route proves the Forge side of the loop. The next wiring step is to pass CrucibleStar finding markers into these exact stem lanes so a recommendation can select the affected stem and time range automatically.</p>
        </section>
      </div>
    </main>
  );
}
