"use client";

import {
  ChangeEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Download,
  Layers3,
  LoaderCircle,
  Pause,
  Play,
  Plus,
  Scissors,
  Trash2,
  WandSparkles,
} from "lucide-react";

const MAX_TRACKS = 16;
const MAX_FILE_BYTES = 250 * 1024 * 1024;
const SILENCE_THRESHOLD_DB = -52;
const TRIM_PADDING_SECONDS = 0.025;
const ACCEPTED_EXTENSIONS = new Set([
  "wav",
  "mp3",
  "flac",
  "aiff",
  "aif",
  "m4a",
  "aac",
]);

type StemTrack = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  startSeconds: number;
  trimStartSeconds: number;
  trimEndSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  gainDb: number;
  muted: boolean;
  solo: boolean;
};

type StemSequencerProps = {
  onMixReady: (buffer: AudioBuffer, name: string) => void;
};

function dbToGain(value: number) {
  return Math.pow(10, value / 20);
}

function seconds(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function detectAudibleRange(buffer: AudioBuffer) {
  const threshold = dbToGain(SILENCE_THRESHOLD_DB);
  let first = buffer.length;
  let last = -1;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    let channelFirst = 0;
    while (channelFirst < data.length && Math.abs(data[channelFirst]) < threshold) {
      channelFirst += 1;
    }

    let channelLast = data.length - 1;
    while (channelLast >= 0 && Math.abs(data[channelLast]) < threshold) {
      channelLast -= 1;
    }

    first = Math.min(first, channelFirst);
    last = Math.max(last, channelLast);
  }

  if (last < first) {
    return { start: 0, end: buffer.duration };
  }

  return {
    start: Math.max(0, first / buffer.sampleRate - TRIM_PADDING_SECONDS),
    end: Math.min(buffer.duration, (last + 1) / buffer.sampleRate + TRIM_PADDING_SECONDS),
  };
}

function trackDuration(track: StemTrack) {
  return Math.max(0, track.trimEndSeconds - track.trimStartSeconds);
}

function projectDuration(tracks: StemTrack[]) {
  let duration = 0;
  for (const track of tracks) {
    duration = Math.max(duration, track.startSeconds + trackDuration(track));
  }
  return duration;
}

function activeTracks(tracks: StemTrack[]) {
  const hasSolo = tracks.some((track) => track.solo);
  return tracks.filter((track) => !track.muted && (!hasSolo || track.solo));
}

async function renderMix(tracks: StemTrack[]) {
  const active = activeTracks(tracks);
  if (active.length === 0) throw new Error("Unmute at least one stem before mixing.");

  let sampleRate = 44100;
  let channels = 1;
  for (const track of active) {
    sampleRate = Math.max(sampleRate, track.buffer.sampleRate);
    channels = Math.max(channels, Math.min(2, track.buffer.numberOfChannels));
  }

  const duration = projectDuration(active);
  if (duration <= 0) throw new Error("The active stems do not contain audible material.");

  const context = new OfflineAudioContext(
    channels,
    Math.ceil((duration + 0.05) * sampleRate),
    sampleRate,
  );

  for (const track of active) {
    const clipDuration = trackDuration(track);
    if (clipDuration <= 0) continue;

    const source = context.createBufferSource();
    const gain = context.createGain();
    const startAt = seconds(track.startSeconds);
    const fadeIn = Math.min(seconds(track.fadeInSeconds), clipDuration / 2);
    const fadeOut = Math.min(seconds(track.fadeOutSeconds), clipDuration / 2);
    const level = dbToGain(track.gainDb);
    const fadeOutAt = startAt + clipDuration - fadeOut;

    source.buffer = track.buffer;
    gain.gain.setValueAtTime(fadeIn > 0 ? 0 : level, startAt);
    if (fadeIn > 0) {
      gain.gain.linearRampToValueAtTime(level, startAt + fadeIn);
    }
    gain.gain.setValueAtTime(level, Math.max(startAt + fadeIn, fadeOutAt));
    if (fadeOut > 0) {
      gain.gain.linearRampToValueAtTime(0, startAt + clipDuration);
    }

    source.connect(gain).connect(context.destination);
    source.start(startAt, track.trimStartSeconds, clipDuration);
  }

  const rendered = await context.startRendering();
  let peak = 0;
  for (let channel = 0; channel < rendered.numberOfChannels; channel += 1) {
    const data = rendered.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
  }

  const ceiling = dbToGain(-1);
  const scale = peak > ceiling ? ceiling / peak : 1;
  if (scale < 1) {
    for (let channel = 0; channel < rendered.numberOfChannels; channel += 1) {
      const data = rendered.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) data[index] *= scale;
    }
  }

  return rendered;
}

function encodeWav24(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels;
  const bytesPerSample = 3;
  const dataLength = buffer.length * channels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataLength);
  const view = new DataView(output);

  function writeText(offset: number, value: string) {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  }

  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 24, true);
  writeText(36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let frame = 0; frame < buffer.length; frame += 1) {
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame]));
      const integer =
        sample < 0
          ? Math.round(sample * 0x800000)
          : Math.round(sample * 0x7fffff);
      view.setUint8(offset, integer & 0xff);
      view.setUint8(offset + 1, (integer >> 8) & 0xff);
      view.setUint8(offset + 2, (integer >> 16) & 0xff);
      offset += bytesPerSample;
    }
  }

  return new Blob([output], { type: "audio/wav" });
}

function formatTime(value: number) {
  const minutes = Math.floor(value / 60);
  const remaining = value - minutes * 60;
  return `${minutes}:${remaining.toFixed(1).padStart(4, "0")}`;
}

function StemWaveform({ track }: { track: StemTrack }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(ratio, ratio);
    context.clearRect(0, 0, width, height);

    const safeDuration = Math.max(0.001, track.buffer.duration);
    const keptDuration = Math.max(0.001, trackDuration(track));
    const trimStartX = (track.trimStartSeconds / safeDuration) * width;
    const trimEndX = (track.trimEndSeconds / safeDuration) * width;
    const activeWidth = Math.max(1, trimEndX - trimStartX);
    const fadeInX = trimStartX + (track.fadeInSeconds / keptDuration) * activeWidth;
    const fadeOutX = trimEndX - (track.fadeOutSeconds / keptDuration) * activeWidth;
    const points = Math.max(240, Math.floor(width));
    const block = Math.max(1, Math.floor(track.buffer.length / points));

    context.fillStyle = "#080706";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,255,255,.055)";
    for (let line = 1; line < 8; line += 1) {
      const x = (line / 8) * width;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    context.strokeStyle = "rgba(255,255,255,.1)";
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    for (let point = 0; point < points; point += 1) {
      let peak = 0;
      const start = point * block;
      const end = Math.min(track.buffer.length, start + block);
      for (let channel = 0; channel < track.buffer.numberOfChannels; channel += 1) {
        const data = track.buffer.getChannelData(channel);
        for (let sample = start; sample < end; sample += 1) {
          peak = Math.max(peak, Math.abs(data[sample]));
        }
      }
      const x = (point / points) * width;
      const bar = Math.max(1, peak * (height - 12));
      const inside = x >= trimStartX && x <= trimEndX;
      context.fillStyle = inside ? "rgba(251,146,60,.88)" : "rgba(248,113,113,.28)";
      context.fillRect(x, (height - bar) / 2, Math.max(1, width / points), bar);
    }

    context.fillStyle = "rgba(0,0,0,.58)";
    context.fillRect(0, 0, trimStartX, height);
    context.fillRect(trimEndX, 0, width - trimEndX, height);

    context.fillStyle = "rgba(251,191,36,.17)";
    context.beginPath();
    context.moveTo(trimStartX, height);
    context.lineTo(fadeInX, 0);
    context.lineTo(fadeInX, height);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(fadeOutX, 0);
    context.lineTo(trimEndX, height);
    context.lineTo(fadeOutX, height);
    context.closePath();
    context.fill();

    context.strokeStyle = "rgba(251,191,36,.95)";
    context.setLineDash([4, 4]);
    for (const x of [trimStartX, trimEndX]) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    context.setLineDash([]);
  }, [track]);

  return (
    <div className="mt-3">
      <canvas
        ref={canvasRef}
        className="h-24 w-full rounded-xl border border-white/8 bg-black/50"
        aria-label={`${track.name} waveform showing silence cuts and edge fades`}
      />
      <div className="mt-1 flex flex-wrap justify-between gap-2 text-[9px] font-bold uppercase tracking-wider">
        <span className="text-red-300/55">Dim = removed dead space</span>
        <span className="text-amber-200/60">Gold = edge fades</span>
        <span className="text-orange-200/60">Orange = kept audio</span>
      </div>
    </div>
  );
}

export default function StemSequencer({ onMixReady }: StemSequencerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const previewUrlRef = useRef("");
  const [tracks, setTracks] = useState<StemTrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Add stems to build a clean master-ready mix.");

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const duration = useMemo(() => projectDuration(tracks), [tracks]);
  const hasSolo = tracks.some((track) => track.solo);

  function replaceTrack(id: string, patch: Partial<StemTrack>) {
    setTracks((current) =>
      current.map((track) => (track.id === id ? { ...track, ...patch } : track)),
    );
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length < 2) return [...current, id];
      return [current[1], id];
    });
  }

  async function prepareTrackPreview(track: StemTrack) {
    setBusy(true);
    setError("");
    setStatus(`Preparing ${track.name} for one-at-a-time comparison…`);
    try {
      const rendered = await renderMix([
        { ...track, startSeconds: 0, muted: false, solo: false },
      ]);
      const blob = encodeWav24(rendered);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setPlaying(false);
      setStatus(`${track.name} is loaded in the comparison player.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "That stem could not be prepared.");
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(files: FileList | File[]) {
    const candidates = Array.from(files).slice(0, MAX_TRACKS - tracks.length);
    if (candidates.length === 0) return;

    setBusy(true);
    setError("");
    setStatus(`Analyzing ${candidates.length} stem${candidates.length === 1 ? "" : "s"}…`);

    try {
      const context = new AudioContext();
      const additions: StemTrack[] = [];

      for (const file of candidates) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ACCEPTED_EXTENSIONS.has(extension) || file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name} is unsupported or larger than 250 MB.`);
        }

        const bytes = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(bytes.slice(0));
        const audible = detectAudibleRange(buffer);
        additions.push({
          id: crypto.randomUUID(),
          name: file.name,
          buffer,
          startSeconds: 0,
          trimStartSeconds: audible.start,
          trimEndSeconds: audible.end,
          fadeInSeconds: Math.min(0.02, (audible.end - audible.start) / 2),
          fadeOutSeconds: Math.min(0.04, (audible.end - audible.start) / 2),
          gainDb: 0,
          muted: false,
          solo: false,
        });
      }

      await context.close();
      setTracks((current) => [...current, ...additions]);
      setStatus(
        `Loaded ${additions.length} stem${additions.length === 1 ? "" : "s"}. Dead space was trimmed with a safe 25 ms edge.`,
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The stems could not be decoded.");
      setStatus("Stem import stopped safely.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void addFiles(event.target.files);
  }

  function autoAlign() {
    setTracks((current) =>
      current.map((track) => ({
        ...track,
        startSeconds: 0,
      })),
    );
    setStatus("All stems aligned to the same zero point.");
  }

  async function buildMix(sendToForge: boolean) {
    setBusy(true);
    setError("");
    setStatus(sendToForge ? "Building the cleaned stem mix for Forge…" : "Rendering the 24-bit stem mix…");

    try {
      const mixed = await renderMix(tracks);
      const blob = encodeWav24(mixed);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPlaying(false);

      if (sendToForge) {
        onMixReady(mixed, "crucible-stem-mix.wav");
        setStatus("Clean stem mix loaded into the mastering Forge below.");
      } else {
        setStatus("Stem mix ready. Audition it or download the 24-bit WAV.");
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The stem mix could not be rendered.");
      setStatus("Mix render stopped safely.");
    } finally {
      setBusy(false);
    }
  }

  function togglePreview() {
    const player = previewRef.current;
    if (!player) return;
    if (playing) {
      player.pause();
      setPlaying(false);
    } else {
      void player.play();
      setPlaying(true);
    }
  }

  return (
    <section className="mt-10 rounded-[28px] border border-orange-300/20 bg-[#0d0a08] p-5 shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:p-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-orange-300">
            <Layers3 size={16} /> 16-track preparation
          </p>
          <h2 className="mt-2 text-3xl font-black">Stem Sequencer</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/48">
            Clean the edges, align the parts, balance the stems, then send one controlled mix into the mastering Forge.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.wav,.mp3,.flac,.aiff,.aif,.m4a,.aac"
            onChange={handleFiles}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy || tracks.length >= MAX_TRACKS}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-black text-black disabled:opacity-40"
          >
            <Plus size={15} /> Add stems
          </button>
          <button
            type="button"
            onClick={autoAlign}
            disabled={busy || tracks.length === 0}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/65 disabled:opacity-40"
          >
            Align starts
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Tracks", `${tracks.length} / ${MAX_TRACKS}`],
          ["Timeline", formatTime(duration)],
          ["Trim gate", `${SILENCE_THRESHOLD_DB} dB`],
          ["Active", `${activeTracks(tracks).length}`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/8 bg-black/30 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</p>
            <p className="mt-1 text-sm font-black text-white/80">{value}</p>
          </div>
        ))}
      </div>

      {tracks.length === 0 ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-5 flex min-h-36 w-full items-center justify-center rounded-2xl border border-dashed border-orange-400/25 bg-orange-500/[0.035] text-sm font-bold text-orange-100/65"
        >
          <Scissors className="mr-2" size={18} /> Drop in synchronized stems or choose up to 16 files
        </button>
      ) : (
        <div className="mt-5 space-y-3">
          {tracks.map((track, index) => {
            const clipDuration = trackDuration(track);
            const inactive = track.muted || (hasSolo && !track.solo);
            return (
              <article
                key={track.id}
                className={`rounded-2xl border p-4 transition ${inactive ? "border-white/5 bg-black/20 opacity-55" : "border-white/10 bg-black/35"}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="min-w-0 lg:w-64">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-300/70">
                      Track {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="truncate text-sm font-bold text-white/85" title={track.name}>{track.name}</p>
                    <p className="mt-1 text-[10px] text-white/35">
                      {formatTime(clipDuration)} after trim
                    </p>
                  </div>

                  <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Start
                      <input
                        aria-label={`${track.name} timeline start in seconds`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={track.startSeconds}
                        onChange={(event) => replaceTrack(track.id, { startSeconds: seconds(event.target.valueAsNumber) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Trim in
                      <input
                        aria-label={`${track.name} trim start in seconds`}
                        type="number"
                        min="0"
                        max={track.trimEndSeconds}
                        step="0.01"
                        value={track.trimStartSeconds}
                        onChange={(event) => replaceTrack(track.id, {
                          trimStartSeconds: Math.min(track.trimEndSeconds, seconds(event.target.valueAsNumber)),
                        })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Trim out
                      <input
                        aria-label={`${track.name} trim end in seconds`}
                        type="number"
                        min={track.trimStartSeconds}
                        max={track.buffer.duration}
                        step="0.01"
                        value={track.trimEndSeconds}
                        onChange={(event) => replaceTrack(track.id, {
                          trimEndSeconds: Math.max(
                            track.trimStartSeconds,
                            Math.min(track.buffer.duration, seconds(event.target.valueAsNumber)),
                          ),
                        })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Fade in
                      <input
                        aria-label={`${track.name} fade in seconds`}
                        type="number"
                        min="0"
                        max={clipDuration / 2}
                        step="0.01"
                        value={track.fadeInSeconds}
                        onChange={(event) => replaceTrack(track.id, { fadeInSeconds: seconds(event.target.valueAsNumber) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Fade out
                      <input
                        aria-label={`${track.name} fade out seconds`}
                        type="number"
                        min="0"
                        max={clipDuration / 2}
                        step="0.01"
                        value={track.fadeOutSeconds}
                        onChange={(event) => replaceTrack(track.id, { fadeOutSeconds: seconds(event.target.valueAsNumber) })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      Gain dB
                      <input
                        aria-label={`${track.name} gain in decibels`}
                        type="number"
                        min="-24"
                        max="12"
                        step="0.5"
                        value={track.gainDb}
                        onChange={(event) => replaceTrack(track.id, { gainDb: event.target.valueAsNumber || 0 })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-2 text-xs text-white"
                      />
                    </label>
                    <div className="flex items-end gap-1">
                      <button
                        type="button"
                        aria-pressed={track.muted}
                        onClick={() => replaceTrack(track.id, { muted: !track.muted })}
                        className={`flex-1 rounded-lg border px-2 py-2 text-[10px] font-black ${track.muted ? "border-red-400/30 bg-red-500/15 text-red-200" : "border-white/10 text-white/45"}`}
                      >
                        Mute
                      </button>
                      <button
                        type="button"
                        aria-pressed={track.solo}
                        onClick={() => replaceTrack(track.id, { solo: !track.solo })}
                        className={`flex-1 rounded-lg border px-2 py-2 text-[10px] font-black ${track.solo ? "border-amber-300/35 bg-amber-400/15 text-amber-100" : "border-white/10 text-white/45"}`}
                      >
                        Solo
                      </button>
                      <button
                        type="button"
                        aria-pressed={compareIds.includes(track.id)}
                        onClick={() => toggleCompare(track.id)}
                        className={`flex-1 rounded-lg border px-2 py-2 text-[10px] font-black ${compareIds.includes(track.id) ? "border-sky-300/35 bg-sky-400/15 text-sky-100" : "border-white/10 text-white/45"}`}
                      >
                        A/B
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${track.name}`}
                    onClick={() => setTracks((current) => current.filter((item) => item.id !== track.id))}
                    className="self-start rounded-lg border border-white/10 p-2 text-white/35 hover:text-red-300 lg:self-center"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <StemWaveform track={track} />
              </article>
            );
          })}
        </div>
      )}

      {compareIds.length > 0 ? (
        <section className="mt-5 rounded-2xl border border-sky-300/15 bg-sky-400/[0.035] p-4">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-200/70">Track comparison</p>
              <p className="mt-1 text-xs text-white/45">Choose up to two stems. Playback always switches to one track at a time.</p>
            </div>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="self-start text-[10px] font-bold uppercase tracking-wider text-white/35"
            >
              Clear A/B
            </button>
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            {compareIds.map((id, index) => {
              const track = tracks.find((item) => item.id === id);
              if (!track) return null;
              return (
                <div key={track.id} className="rounded-xl border border-white/8 bg-black/25 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-sky-200">SIDE {index === 0 ? "A" : "B"}</p>
                      <p className="truncate text-xs font-bold text-white/75">{track.name}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void prepareTrackPreview(track)}
                      disabled={busy}
                      className="shrink-0 rounded-lg border border-sky-300/20 px-3 py-2 text-[10px] font-black text-sky-100 disabled:opacity-40"
                    >
                      Load {index === 0 ? "A" : "B"}
                    </button>
                  </div>
                  <StemWaveform track={track} />
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/25 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold text-white/65" aria-live="polite">{status}</p>
          {error ? <p role="alert" className="mt-1 text-xs text-red-300">{error}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {previewUrl ? (
            <>
              <audio
                ref={previewRef}
                src={previewUrl}
                onEnded={() => setPlaying(false)}
                preload="metadata"
              />
              <button
                type="button"
                onClick={togglePreview}
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
                {playing ? "Pause mix" : "Play mix"}
              </button>
              <a
                href={previewUrl}
                download="crucible-stem-mix-24bit.wav"
                className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70"
              >
                <Download size={14} /> 24-bit mix
              </a>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => void buildMix(false)}
            disabled={busy || tracks.length === 0}
            className="rounded-xl border border-orange-300/20 px-4 py-2.5 text-xs font-black text-orange-100 disabled:opacity-40"
          >
            Render mix
          </button>
          <button
            type="button"
            onClick={() => void buildMix(true)}
            disabled={busy || tracks.length === 0}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-4 py-2.5 text-xs font-black text-black disabled:opacity-40"
          >
            {busy ? <LoaderCircle className="animate-spin" size={15} /> : <WandSparkles size={15} />}
            Send mix to Forge
          </button>
        </div>
      </div>
    </section>
  );
}
