"use client";

import { PointerEvent as ReactPointerEvent, useEffect, useId, useMemo, useState } from "react";
import { Activity, Layers3, ShieldCheck, Waves } from "lucide-react";
import { AUDIO_PARAMETER_COLORS } from "../../lib/audio/visual-theme";

type DnaFrame = {
  time: number;
  peak: number;
  rmsDb: number;
  pan: number;
  stereoWidth: number;
  phase: number;
  crestDb: number;
  bands: [number, number, number, number, number];
};

type DnaVisualData = {
  duration: number;
  sampleRate: number;
  channels: number;
  frames: DnaFrame[];
};

type LayerKey = "eq" | "pan" | "stereo" | "dynamics" | "loudness" | "phase";

type Props = {
  audio: Blob | AudioBuffer;
  mode?: "analysis" | "workstation";
  onInspect?: (time: number) => void;
  trimRange?: [number, number];
  title: string;
  grade?: string | null;
  score?: number | null;
  verified?: boolean;
};

const LAYERS: Array<{ key: LayerKey; label: string }> = [
  { key: "eq", label: "EQ" },
  { key: "pan", label: "Pan" },
  { key: "stereo", label: "Stereo" },
  { key: "dynamics", label: "Dynamics" },
  { key: "loudness", label: "Loudness" },
  { key: "phase", label: "Phase" },
];

const BAND_LABELS = ["Low", "Low-mid", "Mid", "Presence", "Air"] as const;
const BAND_FREQUENCIES = [100, 350, 1200, 3500, 8000] as const;
const WIDTH = 1000;
const HEIGHT = 320;

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function db(value: number) {
  return 20 * Math.log10(Math.max(value, 1e-9));
}

function formatTime(value: number) {
  const seconds = Math.max(0, value);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, "0")}.${Math.floor((seconds % 1) * 10)}`;
}

function audioContextConstructor() {
  const browserWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext || browserWindow.webkitAudioContext;
}

function goertzelDb(
  left: Float32Array,
  right: Float32Array | null,
  start: number,
  length: number,
  sampleRate: number,
  frequency: number,
) {
  if (frequency >= sampleRate / 2 || length <= 1) return -100;
  const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / sampleRate);
  let s1 = 0;
  let s2 = 0;
  for (let index = 0; index < length; index += 1) {
    const position = start + index;
    const leftValue = left[position] ?? 0;
    const sample = right ? (leftValue + (right[position] ?? 0)) * 0.5 : leftValue;
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * index) / Math.max(1, length - 1));
    const next = sample * window + coefficient * s1 - s2;
    s2 = s1;
    s1 = next;
  }
  const power = Math.max(1e-12, s1 * s1 + s2 * s2 - coefficient * s1 * s2);
  return clamp(10 * Math.log10(power / Math.max(1, length * length)), -100, 0);
}

async function analyzeVisualAudio(blob: Blob | AudioBuffer): Promise<DnaVisualData> {
  const AudioContextCtor = audioContextConstructor();
  if (!AudioContextCtor) throw new Error("This browser cannot open the CrucibleStar analyzer.");
  const context = blob instanceof Blob ? new AudioContextCtor() : null;
  try {
    const buffer = blob instanceof Blob ? await context!.decodeAudioData(await blob.arrayBuffer()) : blob;
    const left = buffer.getChannelData(0);
    const right = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;
    const frameCount = Math.min(180, Math.max(72, Math.ceil(buffer.duration * 1.15)));
    const frames: DnaFrame[] = [];

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex += 1) {
      const start = Math.floor((frameIndex / frameCount) * buffer.length);
      const end = Math.max(start + 1, Math.floor(((frameIndex + 1) / frameCount) * buffer.length));
      const stride = Math.max(1, Math.floor((end - start) / 1800));
      let peak = 0;
      let leftEnergy = 0;
      let rightEnergy = 0;
      let midEnergy = 0;
      let sideEnergy = 0;
      let cross = 0;
      let samples = 0;

      for (let index = start; index < end; index += stride) {
        const l = left[index] ?? 0;
        const r = right ? (right[index] ?? 0) : l;
        const mono = (l + r) * 0.5;
        peak = Math.max(peak, Math.abs(l), Math.abs(r));
        leftEnergy += l * l;
        rightEnergy += r * r;
        const mid = (l + r) * 0.5;
        const side = (l - r) * 0.5;
        midEnergy += mid * mid;
        sideEnergy += side * side;
        cross += l * r;
        void mono;
        samples += 1;
      }

      const safeSamples = Math.max(1, samples);
      const lRms = Math.sqrt(leftEnergy / safeSamples);
      const rRms = Math.sqrt(rightEnergy / safeSamples);
      const totalRms = Math.sqrt((leftEnergy + rightEnergy) / (safeSamples * 2));
      const pan = right ? clamp((rRms - lRms) / Math.max(1e-9, rRms + lRms), -1, 1) : 0;
      const stereoWidth = right ? clamp(sideEnergy / Math.max(1e-9, sideEnergy + midEnergy), 0, 1) : 0;
      const phase = right
        ? clamp(cross / Math.sqrt(Math.max(1e-12, leftEnergy * rightEnergy)), -1, 1)
        : 1;
      const rmsDb = db(totalRms);
      const crestDb = clamp(db(peak) - rmsDb, 0, 36);

      const spectralLength = Math.min(1024, end - start);
      const spectralStart = Math.max(start, Math.min(end - spectralLength, Math.floor((start + end - spectralLength) / 2)));
      const bands = BAND_FREQUENCIES.map((frequency) =>
        goertzelDb(left, right, spectralStart, spectralLength, buffer.sampleRate, frequency),
      ) as DnaFrame["bands"];

      frames.push({
        time: (start / buffer.sampleRate),
        peak,
        rmsDb,
        pan,
        stereoWidth,
        phase,
        crestDb,
        bands,
      });
    }

    return {
      duration: buffer.duration,
      sampleRate: buffer.sampleRate,
      channels: buffer.numberOfChannels,
      frames,
    };
  } finally {
    await context?.close();
  }
}

function pointsPath(frames: DnaFrame[], value: (frame: DnaFrame) => number, y: (value: number) => number, height = HEIGHT) {
  if (frames.length === 0) return "";
  return frames.map((frame, index) => {
    const x = (index / Math.max(1, frames.length - 1)) * WIDTH;
    const pointY = clamp(y(value(frame)), 0, height);
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${pointY.toFixed(1)}`;
  }).join(" ");
}

function waveformPath(frames: DnaFrame[]) {
  if (frames.length === 0) return "";
  const center = HEIGHT / 2;
  const scale = HEIGHT * 0.42;
  const upper = frames.map((frame, index) => {
    const x = (index / Math.max(1, frames.length - 1)) * WIDTH;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${(center - frame.peak * scale).toFixed(1)}`;
  }).join(" ");
  const lower = [...frames].reverse().map((frame, reverseIndex) => {
    const index = frames.length - 1 - reverseIndex;
    const x = (index / Math.max(1, frames.length - 1)) * WIDTH;
    return `L${x.toFixed(1)},${(center + frame.peak * scale).toFixed(1)}`;
  }).join(" ");
  return `${upper} ${lower} Z`;
}

function rmsNorm(value: number) {
  return clamp((value + 72) / 72);
}

function bandNorm(value: number) {
  return clamp((value + 90) / 80);
}

function LayerButton({ layer, enabled, onClick }: { layer: LayerKey; enabled: boolean; onClick: () => void }) {
  const color = AUDIO_PARAMETER_COLORS[layer];
  const label = LAYERS.find((item) => item.key === layer)?.label ?? layer;
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={onClick}
      className="rounded-full border px-3 py-2 text-sm font-black uppercase tracking-wider transition"
      style={{
        borderColor: enabled ? color : "rgba(255,255,255,.1)",
        color: enabled ? color : "rgba(255,255,255,.38)",
        background: enabled ? `${color}16` : "rgba(255,255,255,.02)",
        boxShadow: enabled ? `0 0 18px ${color}22` : "none",
      }}
    >
      {label}
    </button>
  );
}

function StackGraph({
  label,
  color,
  frames,
  getter,
  mapY,
  selectedIndex,
  onPointer,
}: {
  label: string;
  color: string;
  frames: DnaFrame[];
  getter: (frame: DnaFrame) => number;
  mapY: (value: number) => number;
  selectedIndex: number;
  onPointer: (event: ReactPointerEvent<HTMLDivElement>) => void;
}) {
  const height = 92;
  const selectedX = (selectedIndex / Math.max(1, frames.length - 1)) * WIDTH;
  return (
    <div className="grid grid-cols-[76px_1fr] items-center gap-2">
      <div>
        <p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{label}</p>
      </div>
      <div onPointerDown={onPointer} onPointerMove={onPointer} className="touch-none overflow-hidden rounded-xl border border-white/8 bg-black/35">
        <svg viewBox={`0 0 ${WIDTH} ${height}`} className="block h-20 w-full" preserveAspectRatio="none" role="img" aria-label={`${label} analysis over time`}>
          <line x1="0" y1={height / 2} x2={WIDTH} y2={height / 2} stroke="rgba(255,255,255,.08)" />
          <path d={pointsPath(frames, getter, mapY, height)} fill="none" stroke={color} strokeWidth="2.3" vectorEffect="non-scaling-stroke" />
          <line x1={selectedX} y1="0" x2={selectedX} y2={height} stroke="rgba(255,255,255,.72)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
    </div>
  );
}

export default function StarDnaAnalyzer({ audio, title, grade, score, verified = false, mode = "analysis", onInspect, trimRange }: Props) {
  const gradientId = useId().replace(/:/g, "");
  const [data, setData] = useState<DnaVisualData | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [view, setView] = useState<"wave" | "stack">("wave");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>({
    eq: true,
    pan: true,
    stereo: true,
    dynamics: false,
    loudness: true,
    phase: false,
  });

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    setError("");
    void analyzeVisualAudio(audio)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setSelectedIndex(0);
      })
      .catch((caught) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "The DNA visualization could not be calculated.");
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => { cancelled = true; };
  }, [audio]);

  const selected = data?.frames[selectedIndex] ?? null;
  const wave = useMemo(() => data ? waveformPath(data.frames) : "", [data]);

  function inspect(event: ReactPointerEvent<HTMLDivElement>) {
    if (!data?.frames.length) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = clamp((event.clientX - rect.left) / Math.max(1, rect.width));
    const index = Math.round(ratio * (data.frames.length - 1));
    setSelectedIndex(index);
    if (event.type === "pointerdown" || event.buttons === 1) onInspect?.(data.frames[index].time);
  }

  if (busy) {
    return <div className="grid min-h-72 place-items-center rounded-3xl border border-sky-300/15 bg-sky-400/[0.035] text-sm font-black text-sky-100"><Activity className="mb-2 animate-pulse" />Building real audio DNA…</div>;
  }

  if (error || !data || data.frames.length === 0) {
    return <div className="rounded-3xl border border-red-300/15 bg-red-400/[0.035] p-5 text-sm text-red-100">{error || "No analyzable waveform data was found."}</div>;
  }

  const cursorX = (selectedIndex / Math.max(1, data.frames.length - 1)) * WIDTH;
  const panText = selected ? selected.pan < -0.03 ? `${Math.round(Math.abs(selected.pan) * 100)}% L` : selected.pan > 0.03 ? `${Math.round(selected.pan * 100)}% R` : "Center" : "—";

  return (
    <section className="overflow-hidden rounded-3xl border border-sky-300/15 bg-[#06090f] shadow-[0_0_60px_rgba(56,189,248,.06)]">
      <div className="border-b border-white/8 bg-gradient-to-r from-sky-400/[0.08] via-transparent to-violet-400/[0.06] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[.24em] text-sky-300">{mode === "workstation" ? "Crucible Forge · Track DNA" : "CrucibleStar · Audio DNA"}</p>
            <h2 className="mt-1 truncate text-xl font-black text-white">{title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-white/60">
              <span>{data.sampleRate.toLocaleString()} Hz</span><span>•</span><span>{data.channels} ch</span><span>•</span><span>{formatTime(data.duration)}</span>
              <span>•</span><span>Measured from the exact audio file</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {verified ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1.5 text-sm font-black uppercase text-emerald-200"><ShieldCheck size={13} />Verified</span> : null}
            {grade ? <span className="rounded-xl bg-orange-400 px-3 py-1.5 text-sm font-black text-black">Technical checklist {grade}{typeof score === "number" ? ` · ${score}/100` : ""}</span> : null}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-xl border border-white/10 bg-black/25 p-1">
            <button type="button" onClick={() => setView("wave")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black uppercase ${view === "wave" ? "bg-white text-black" : "text-white/45"}`}><Waves size={14} />DNA Wave</button>
            <button type="button" onClick={() => setView("stack")} className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-black uppercase ${view === "stack" ? "bg-white text-black" : "text-white/45"}`}><Layers3 size={14} />Analyzer Stack</button>
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white/60">{mode === "workstation" ? "Source audio · select a point to edit" : "Analysis · exact file"}</span>
        </div>
      </div>

      <div className="p-3 sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LAYERS.map(({ key }) => <LayerButton key={key} layer={key} enabled={layers[key]} onClick={() => setLayers((current) => ({ ...current, [key]: !current[key] }))} />)}
        </div>

        {view === "wave" ? (
          <div onPointerDown={inspect} onPointerMove={inspect} className="mt-2 touch-none overflow-hidden rounded-2xl border border-white/10 bg-black/45">
            <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="block h-80 w-full sm:h-[420px]" preserveAspectRatio="none" role="img" aria-label="Interactive CrucibleStar DNA waveform">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fde68a" /><stop offset="24%" stopColor="#38bdf8" />
                  <stop offset="52%" stopColor="#67e8f9" /><stop offset="78%" stopColor="#818cf8" /><stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
              {Array.from({ length: 9 }, (_, index) => <line key={index} x1={(index / 8) * WIDTH} y1="0" x2={(index / 8) * WIDTH} y2={HEIGHT} stroke="rgba(255,255,255,.045)" />)}
              <line x1="0" y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} stroke="rgba(255,255,255,.10)" />
              <path d={wave} fill={`url(#${gradientId})`} fillOpacity=".12" stroke="#38bdf8" strokeOpacity=".35" strokeWidth="1" />
              {data.frames.map((frame, index) => <rect key={index} x={index / data.frames.length * WIDTH} y={HEIGHT / 2 - frame.peak * HEIGHT * .42} width={Math.max(1, WIDTH / data.frames.length * .55)} height={Math.max(.5, frame.peak * HEIGHT * .84)} rx="1" fill={`url(#${gradientId})`} opacity=".9" />)}

              {layers.pan ? <path d={pointsPath(data.frames, (frame) => frame.pan, (value) => HEIGHT / 2 - value * 90)} fill="none" stroke={AUDIO_PARAMETER_COLORS.pan} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
              {layers.stereo ? <path d={pointsPath(data.frames, (frame) => frame.stereoWidth, (value) => HEIGHT - 28 - value * 170)} fill="none" stroke={AUDIO_PARAMETER_COLORS.stereo} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
              {layers.dynamics ? <path d={pointsPath(data.frames, (frame) => frame.crestDb, (value) => HEIGHT - 26 - clamp(value / 30) * 190)} fill="none" stroke={AUDIO_PARAMETER_COLORS.dynamics} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
              {layers.loudness ? <path d={pointsPath(data.frames, (frame) => frame.rmsDb, (value) => HEIGHT - 26 - rmsNorm(value) * 220)} fill="none" stroke={AUDIO_PARAMETER_COLORS.loudness} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
              {layers.phase ? <path d={pointsPath(data.frames, (frame) => frame.phase, (value) => HEIGHT / 2 - value * 100)} fill="none" stroke={AUDIO_PARAMETER_COLORS.phase} strokeWidth="2" vectorEffect="non-scaling-stroke" /> : null}
              {layers.eq ? data.frames[0]?.bands.map((_, bandIndex) => (
                <path key={bandIndex} d={pointsPath(data.frames, (frame) => frame.bands[bandIndex], (value) => HEIGHT - 25 - bandNorm(value) * 235)} fill="none" stroke={AUDIO_PARAMETER_COLORS.eq} strokeOpacity={0.28 + bandIndex * 0.13} strokeWidth={bandIndex === 2 ? 2.2 : 1.2} vectorEffect="non-scaling-stroke" />
              )) : null}

              {trimRange ? <g aria-label="Kept audio range">
                <rect x="0" y="0" width={clamp(trimRange[0] / data.duration) * WIDTH} height={HEIGHT} fill="#020617" opacity=".8" />
                <rect x={clamp(trimRange[1] / data.duration) * WIDTH} y="0" width={(1 - clamp(trimRange[1] / data.duration)) * WIDTH} height={HEIGHT} fill="#020617" opacity=".8" />
                {trimRange.map((time, index) => <line key={index} x1={clamp(time / data.duration) * WIDTH} x2={clamp(time / data.duration) * WIDTH} y1="0" y2={HEIGHT} stroke="#fb923c" strokeWidth="3" vectorEffect="non-scaling-stroke" />)}
              </g> : null}
              <line x1={cursorX} y1="0" x2={cursorX} y2={HEIGHT} stroke="rgba(255,255,255,.88)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
        ) : (
          <div className="mt-3 space-y-2 rounded-2xl border border-white/8 bg-black/20 p-3">
            <StackGraph label="Wave" color={AUDIO_PARAMETER_COLORS.waveform} frames={data.frames} getter={(frame) => frame.peak} mapY={(value) => 84 - value * 72} selectedIndex={selectedIndex} onPointer={inspect} />
            {layers.eq ? <StackGraph label="EQ / Mid" color={AUDIO_PARAMETER_COLORS.eq} frames={data.frames} getter={(frame) => frame.bands[2]} mapY={(value) => 84 - bandNorm(value) * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
            {layers.pan ? <StackGraph label="Pan" color={AUDIO_PARAMETER_COLORS.pan} frames={data.frames} getter={(frame) => frame.pan} mapY={(value) => 46 - value * 34} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
            {layers.stereo ? <StackGraph label="Stereo" color={AUDIO_PARAMETER_COLORS.stereo} frames={data.frames} getter={(frame) => frame.stereoWidth} mapY={(value) => 84 - value * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
            {layers.dynamics ? <StackGraph label="Dynamics" color={AUDIO_PARAMETER_COLORS.dynamics} frames={data.frames} getter={(frame) => frame.crestDb} mapY={(value) => 84 - clamp(value / 30) * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
            {layers.loudness ? <StackGraph label="RMS level" color={AUDIO_PARAMETER_COLORS.loudness} frames={data.frames} getter={(frame) => frame.rmsDb} mapY={(value) => 84 - rmsNorm(value) * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
            {layers.phase ? <StackGraph label="Phase" color={AUDIO_PARAMETER_COLORS.phase} frames={data.frames} getter={(frame) => frame.phase} mapY={(value) => 46 - value * 34} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
          </div>
        )}

        <div className="mt-2 flex justify-between font-mono text-xs text-slate-400">{[0, .25, .5, .75, 1].map((ratio) => <span key={ratio}>{formatTime(data.duration * ratio)}</span>)}</div>
        <label className="mt-3 block text-sm text-sky-200">Inspect position
          <input type="range" min="0" max={data.frames.length - 1} value={selectedIndex} onChange={(event) => { const index = event.target.valueAsNumber; setSelectedIndex(index); onInspect?.(data.frames[index].time); }} className="mt-2 w-full accent-sky-300" />
        </label>
        {view === "wave" ? <div className="mt-4 grid gap-2 lg:grid-cols-2">
          {layers.eq ? <StackGraph label="EQ / Mid" color={AUDIO_PARAMETER_COLORS.eq} frames={data.frames} getter={(frame) => frame.bands[2]} mapY={(value) => 84 - bandNorm(value) * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
          {layers.pan ? <StackGraph label="Pan" color={AUDIO_PARAMETER_COLORS.pan} frames={data.frames} getter={(frame) => frame.pan} mapY={(value) => 46 - value * 34} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
          {layers.stereo ? <StackGraph label="Width" color={AUDIO_PARAMETER_COLORS.stereo} frames={data.frames} getter={(frame) => frame.stereoWidth} mapY={(value) => 84 - value * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
          {layers.loudness ? <StackGraph label="RMS" color={AUDIO_PARAMETER_COLORS.loudness} frames={data.frames} getter={(frame) => frame.rmsDb} mapY={(value) => 84 - rmsNorm(value) * 72} selectedIndex={selectedIndex} onPointer={inspect} /> : null}
        </div> : null}
        {selected ? (
          <div className="mt-3 grid gap-2 rounded-2xl border border-white/8 bg-white/[0.025] p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1"><p className="text-xs font-black uppercase tracking-wider text-sky-300">Inspection point</p><p className="mt-1 font-mono text-2xl font-black">{formatTime(selected.time)}</p></div>
            <Readout label="Pan balance" value={panText} color={AUDIO_PARAMETER_COLORS.pan} />
            <Readout label="Stereo width" value={`${Math.round(selected.stereoWidth * 100)}%`} color={AUDIO_PARAMETER_COLORS.stereo} />
            <Readout label="RMS level" value={`${selected.rmsDb.toFixed(1)} dBFS`} color={AUDIO_PARAMETER_COLORS.loudness} />
            <Readout label="Crest / dynamics" value={`${selected.crestDb.toFixed(1)} dB`} color={AUDIO_PARAMETER_COLORS.dynamics} />
            <Readout label="Phase correlation" value={selected.phase.toFixed(2)} color={AUDIO_PARAMETER_COLORS.phase} />
            <div className="sm:col-span-2">
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: AUDIO_PARAMETER_COLORS.eq }}>Frequency energy</p>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-white/55">{selected.bands.map((value, index) => <span key={BAND_LABELS[index]}>{BAND_LABELS[index]} {value.toFixed(1)} dB</span>)}</div>
            </div>
          </div>
        ) : null}

        <div className="mt-3 rounded-xl border border-violet-300/10 bg-violet-400/[0.035] px-3 py-2 text-sm leading-5 text-white/60">
          Reverb / delay: effect data unavailable for this source file.
        </div>
      </div>
    </section>
  );
}

function Readout({ label, value, color }: { label: string; value: string; color: string }) {
  return <div className="rounded-xl bg-black/30 p-3"><p className="text-xs font-black uppercase tracking-wider" style={{ color }}>{label}</p><p className="mt-1 font-mono text-sm font-black text-white/85">{value}</p></div>;
}
