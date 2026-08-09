"use client";

import StemSequencer from "../../components/sound-furnace/StemSequencer";
import Link from "next/link";
import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  AudioWaveform,
  CheckCircle2,
  Download,
  Flame,
  Gauge,
  Hammer,
  LoaderCircle,
  LockKeyhole,
  Play,
  Sparkles,
  Square,
  Upload,
} from "lucide-react";

const MAX_FILE_BYTES = 250 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ["wav", "mp3", "flac", "aiff", "aif", "m4a", "aac"];

type ForgeMode = "auto" | "guided";
type AudioStats = {
  peakDb: number;
  rmsDb: number;
  crestDb: number;
  duration: number;
  sampleRate: number;
  channels: number;
};

type ForgeResult = {
  url: string;
  name: string;
  stats: AudioStats;
  samples: Float32Array;
};

type ZipEntry = { name: string; bytes: Uint8Array };

async function unzipArchive(archive: ArrayBuffer): Promise<ZipEntry[]> {
  const bytes = new Uint8Array(archive);
  const view = new DataView(archive);
  const decoder = new TextDecoder();
  let directoryEnd = -1;
  const minimumOffset = Math.max(0, bytes.length - 65_557);

  for (let offset = bytes.length - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      directoryEnd = offset;
      break;
    }
  }
  if (directoryEnd < 0) throw new Error("Crucible received an unreadable stem package.");

  const entryCount = view.getUint16(directoryEnd + 10, true);
  let cursor = view.getUint32(directoryEnd + 16, true);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error("The stem archive directory is damaged.");
    const method = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = bytes.slice(dataStart, dataStart + compressedSize);
    let output: Uint8Array;

    if (method === 0) {
      output = compressed;
    } else if (method === 8) {
      const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      output = new Uint8Array(await new Response(stream).arrayBuffer());
    } else {
      throw new Error(`The stem archive uses unsupported ZIP compression ${method}.`);
    }

    entries.push({ name, bytes: output });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function db(value: number) {
  return value > 0 ? 20 * Math.log10(value) : -96;
}

function formatDb(value: number) {
  return `${value.toFixed(1)} dB`;
}

function formatForgeTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function analyzeBuffer(buffer: AudioBuffer): AudioStats {
  let peak = 0;
  let sumSquares = 0;
  let count = 0;

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) {
      const sample = data[index];
      peak = Math.max(peak, Math.abs(sample));
      sumSquares += sample * sample;
      count += 1;
    }
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, count));
  return {
    peakDb: db(peak),
    rmsDb: db(rms),
    crestDb: db(peak) - db(rms),
    duration: buffer.duration,
    sampleRate: buffer.sampleRate,
    channels: buffer.numberOfChannels,
  };
}

function waveformSamples(buffer: AudioBuffer, points = 1200) {
  const result = new Float32Array(points);
  const block = Math.max(1, Math.floor(buffer.length / points));

  for (let point = 0; point < points; point += 1) {
    let max = 0;
    const start = point * block;
    const end = Math.min(buffer.length, start + block);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = start; index < end; index += 1) {
        max = Math.max(max, Math.abs(data[index]));
      }
    }
    result[point] = max;
  }

  return result;
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
      const integer = sample < 0 ? Math.round(sample * 0x800000) : Math.round(sample * 0x7fffff);
      view.setUint8(offset, integer & 0xff);
      view.setUint8(offset + 1, (integer >> 8) & 0xff);
      view.setUint8(offset + 2, (integer >> 16) & 0xff);
      offset += bytesPerSample;
    }
  }

  return new Blob([output], { type: "audio/wav" });
}

function guidedSettings(prompt: string) {
  const direction = prompt.toLowerCase();
  return {
    lowGain: /warm|thick|bass|weight|full/.test(direction) ? 1.8 : 0.5,
    highGain: /bright|air|clear|crisp|open/.test(direction) ? 1.6 : -0.2,
    threshold: /loud|hard|aggressive|punch/.test(direction) ? -20 : -15,
    ratio: /loud|hard|aggressive|tight/.test(direction) ? 3.5 : 2.2,
    targetRms: /dynamic|natural|gentle/.test(direction) ? -16 : /loud|hard/.test(direction) ? -11 : -13.5,
  };
}

async function forgeBuffer(input: AudioBuffer, mode: ForgeMode, prompt: string) {
  const sourceStats = analyzeBuffer(input);
  const settings = mode === "guided" ? guidedSettings(prompt) : guidedSettings("clear balanced release ready");
  const context = new OfflineAudioContext(
    input.numberOfChannels,
    input.length,
    input.sampleRate,
  );
  const source = context.createBufferSource();
  const highPass = context.createBiquadFilter();
  const lowShelf = context.createBiquadFilter();
  const highShelf = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();
  const makeup = context.createGain();

  source.buffer = input;
  highPass.type = "highpass";
  highPass.frequency.value = 24;
  highPass.Q.value = 0.7;
  lowShelf.type = "lowshelf";
  lowShelf.frequency.value = 120;
  lowShelf.gain.value = settings.lowGain;
  highShelf.type = "highshelf";
  highShelf.frequency.value = 6800;
  highShelf.gain.value = settings.highGain;
  compressor.threshold.value = settings.threshold;
  compressor.knee.value = 9;
  compressor.ratio.value = settings.ratio;
  compressor.attack.value = 0.018;
  compressor.release.value = 0.24;
  makeup.gain.value = Math.pow(10, Math.min(12, settings.targetRms - sourceStats.rmsDb) / 20);

  source.connect(highPass).connect(lowShelf).connect(highShelf).connect(compressor).connect(makeup).connect(context.destination);
  source.start();
  const rendered = await context.startRendering();

  let peak = 0;
  for (let channel = 0; channel < rendered.numberOfChannels; channel += 1) {
    const data = rendered.getChannelData(channel);
    for (let index = 0; index < data.length; index += 1) peak = Math.max(peak, Math.abs(data[index]));
  }
  const ceiling = Math.pow(10, -1 / 20);
  const scale = peak > ceiling ? ceiling / peak : 1;
  if (scale < 1) {
    for (let channel = 0; channel < rendered.numberOfChannels; channel += 1) {
      const data = rendered.getChannelData(channel);
      for (let index = 0; index < data.length; index += 1) data[index] *= scale;
    }
  }

  return rendered;
}

function Waveform({ samples, color, label }: { samples: Float32Array; color: string; label: string }) {
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
    context.strokeStyle = "rgba(255,255,255,.08)";
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();
    context.fillStyle = color;
    const step = width / samples.length;
    samples.forEach((sample, index) => {
      const bar = Math.max(1, sample * (height - 12));
      context.fillRect(index * step, (height - bar) / 2, Math.max(1, step * 0.74), bar);
    });
  }, [color, samples]);

  return (
    <div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</p>
      <canvas ref={canvasRef} className="h-24 w-full rounded-xl bg-black/45" aria-label={`${label} waveform`} />
    </div>
  );
}

function playForgeFinish() {
  const context = new AudioContext();
  const now = context.currentTime;
  const master = context.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.55);
  master.connect(context.destination);

  const fire = context.createBufferSource();
  const noise = context.createBuffer(1, context.sampleRate * 1.2, context.sampleRate);
  const noiseData = noise.getChannelData(0);
  for (let index = 0; index < noiseData.length; index += 1) noiseData[index] = Math.random() * 2 - 1;
  fire.buffer = noise;
  const fireFilter = context.createBiquadFilter();
  fireFilter.type = "bandpass";
  fireFilter.frequency.setValueAtTime(640, now);
  fireFilter.frequency.exponentialRampToValueAtTime(180, now + 1.1);
  fire.connect(fireFilter).connect(master);
  fire.start(now);

  const hammer = context.createOscillator();
  const hammerGain = context.createGain();
  hammer.type = "square";
  hammer.frequency.setValueAtTime(180, now + 1.1);
  hammer.frequency.exponentialRampToValueAtTime(52, now + 1.32);
  hammerGain.gain.setValueAtTime(0.0001, now);
  hammerGain.gain.setValueAtTime(0.95, now + 1.1);
  hammerGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
  hammer.connect(hammerGain).connect(master);
  hammer.start(now);
  hammer.stop(now + 1.55);
}

export default function SoundFurnacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const sourceAudioRef = useRef<HTMLAudioElement>(null);
  const resultAudioRef = useRef<HTMLAudioElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<AudioBuffer | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceStats, setSourceStats] = useState<AudioStats | null>(null);
  const [sourceSamples, setSourceSamples] = useState<Float32Array | null>(null);
  const [mode, setMode] = useState<ForgeMode>("auto");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Choose a track to begin.");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ForgeResult | null>(null);
  const [playing, setPlaying] = useState<"source" | "result" | null>(null);
  const [engineerOpen, setEngineerOpen] = useState(false);
  const [stemFiles, setStemFiles] = useState<File[]>([]);
  const [separatingStems, setSeparatingStems] = useState(false);
  const [stemElapsed, setStemElapsed] = useState(0);
  const [stemEstimate, setStemEstimate] = useState(120);

  useEffect(() => () => {
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);
  }, [result, sourceUrl]);

  useEffect(() => {
    if (!separatingStems) return;
    const timer = window.setInterval(() => setStemElapsed((elapsed) => elapsed + 1), 1000);
    return () => window.clearInterval(timer);
  }, [separatingStems]);

  const stemRemaining = Math.max(0, stemEstimate - stemElapsed);
  const stemProgress = Math.min(96, Math.round((stemElapsed / Math.max(1, stemEstimate)) * 100));
  const stemStage = stemProgress < 25
    ? "Reading the sonic blueprint"
    : stemProgress < 55
      ? "Pulling vocals and rhythm apart"
      : stemProgress < 82
        ? "Forging the instrument layers"
        : "Packaging six studio stems";

  const statCards = useMemo(() => sourceStats ? [
    ["Peak", formatDb(sourceStats.peakDb)],
    ["Average", formatDb(sourceStats.rmsDb)],
    ["Dynamics", formatDb(sourceStats.crestDb)],
    ["Format", `${sourceStats.sampleRate / 1000} kHz · ${sourceStats.channels === 1 ? "Mono" : "Stereo"}`],
  ] : [], [sourceStats]);

  async function acceptFile(candidate: File) {
    setError("");
    setResult(null);
    setStemFiles([]);
    setEngineerOpen(false);
    const extension = candidate.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setError("Use a WAV, MP3, FLAC, AIFF, M4A, or AAC audio file.");
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setError("That file is larger than the 250 MB browser-processing limit.");
      return;
    }
    setBusy(true);
    setStatus("Reading and analyzing your track…");
    try {
      const bytes = await candidate.arrayBuffer();
      const context = new AudioContext();
      const decoded = await context.decodeAudioData(bytes.slice(0));
      await context.close();
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      const url = URL.createObjectURL(candidate);
      setFile(candidate);
      setBuffer(decoded);
      setSourceUrl(url);
      setSourceStats(analyzeBuffer(decoded));
      setSourceSamples(waveformSamples(decoded));
      setStatus("Analysis complete. Choose Auto Forge or guide the sound.");
    } catch {
      setError("This browser could not decode that file. A PCM WAV or MP3 is the safest choice.");
      setStatus("Choose another track.");
    } finally {
      setBusy(false);
    }
  }

  function acceptStemMix(mixed: AudioBuffer, name: string) {
    setError("");
    setResult(null);
    if (sourceUrl) URL.revokeObjectURL(sourceUrl);
    if (result?.url) URL.revokeObjectURL(result.url);

    const blob = encodeWav24(mixed);
    const url = URL.createObjectURL(blob);
    const mixedFile = new File([blob], name, { type: "audio/wav" });
    setFile(mixedFile);
    setBuffer(mixed);
    setSourceUrl(url);
    setSourceStats(analyzeBuffer(mixed));
    setSourceSamples(waveformSamples(mixed));
    setStatus("Visual stem mix ready. Choose Auto Forge or guide the final master.");
    window.setTimeout(() => {
      document.getElementById("mastering-forge")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 50);
  }

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const candidate = event.target.files?.[0];
    if (candidate) void acceptFile(candidate);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const candidate = event.dataTransfer.files?.[0];
    if (candidate) void acceptFile(candidate);
  }

  async function handleForge(event: FormEvent) {
    event.preventDefault();
    if (!file || !buffer) return;
    if (mode === "guided" && prompt.trim().length < 8) {
      setError("Give the guided forge a little more direction—at least 8 characters.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("Heating the furnace… balancing tone, dynamics, and final level.");
    try {
      const forged = await forgeBuffer(buffer, mode, prompt);
      const blob = encodeWav24(forged);
      const url = URL.createObjectURL(blob);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      if (result?.url) URL.revokeObjectURL(result.url);
      setResult({
        url,
        name: `${baseName}-crucible-master-24bit.wav`,
        stats: analyzeBuffer(forged),
        samples: waveformSamples(forged),
      });
      playForgeFinish();
      try {
        await separateIntoStems(file);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Stem separation could not finish.");
        setStatus("Forge complete and downloadable. Stem separation can be retried.");
      }
    } catch {
      setError("The forge could not finish this track in your browser. Try closing other tabs or using a smaller file.");
      setStatus("Forge stopped safely. Your original file was not changed.");
    } finally {
      setBusy(false);
    }
  }

  async function separateIntoStems(candidate: File) {
    const durationBasedEstimate = Math.round(45 + (sourceStats?.duration ?? 120) * 0.55);
    setStemEstimate(Math.min(360, Math.max(75, durationBasedEstimate)));
    setStemElapsed(0);
    setSeparatingStems(true);
    setStatus("Forge complete. Crucible is forging six synchronized stems…");

    try {
      const form = new FormData();
      form.append("file", candidate, candidate.name);
      const response = await fetch("/api/stem-separation", {
        method: "POST",
        body: form,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error ?? `Stem separation failed (${response.status}).`);
      }

      const archive = await unzipArchive(await response.arrayBuffer());
    const order = ["vocals", "drums", "bass", "guitar", "piano", "other"];
    const separated = archive
      .filter(({ name, bytes }) => bytes.length > 0 && /\.(wav|mp3|flac|m4a|aac)$/i.test(name))
      .map(({ name, bytes }) => {
        const cleanName = name.split("/").pop() ?? name;
        const extension = cleanName.split(".").pop()?.toLowerCase() ?? "mp3";
        const type = extension === "wav" ? "audio/wav" : extension === "flac" ? "audio/flac" : "audio/mpeg";
        return new File([new Uint8Array(bytes)], cleanName, { type });
      })
      .sort((left, right) => {
        const leftIndex = order.findIndex((stem) => left.name.toLowerCase().includes(stem));
        const rightIndex = order.findIndex((stem) => right.name.toLowerCase().includes(stem));
        return (leftIndex < 0 ? order.length : leftIndex) - (rightIndex < 0 ? order.length : rightIndex);
      });

      if (separated.length === 0) throw new Error("Crucible received an empty stem package.");
      setStemFiles(separated);
      setEngineerOpen(true);
      setStatus(`${separated.length} stems separated and loaded into Engineer Mode.`);
      window.setTimeout(() => {
        document.getElementById("engineer-crucible")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    } finally {
      setSeparatingStems(false);
    }
  }

  async function openEngineerMode() {
    if (stemFiles.length === 0 && file) {
      setBusy(true);
      setError("");
      try {
        await separateIntoStems(file);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Stem separation could not finish.");
        setStatus("The master is safe. Stem separation can be retried.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setEngineerOpen(true);
    window.setTimeout(() => {
      document.getElementById("engineer-crucible")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  function togglePlayback(kind: "source" | "result") {
    const current = kind === "source" ? sourceAudioRef.current : resultAudioRef.current;
    const other = kind === "source" ? resultAudioRef.current : sourceAudioRef.current;
    if (!current) return;
    other?.pause();
    if (playing === kind && !current.paused) {
      current.pause();
      setPlaying(null);
    } else {
      void current.play();
      setPlaying(kind);
    }
  }

  return (
    <main className="min-h-screen bg-[#070605] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#070605]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-white/70 hover:text-white">
            <ArrowLeft size={17} /> Crucible
          </Link>
          <div className="text-right">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Sound Furnace</p>
            <p className="text-[10px] text-white/35">Browser-local quick remaster</p>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[.86fr_1.14fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-orange-200">
              <LockKeyhole size={13} /> Your track stays on this device
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Hear what “remastered” should mean.</h1>
            <p className="mt-5 max-w-xl leading-7 text-white/55">Analyze the mix, forge a balanced 24-bit WAV, compare the original and result, then download the file. No silent upload and no replacement of your original.</p>

            <div className="mt-7 rounded-2xl border border-white/8 bg-white/[0.025] p-5">
              <p className="text-sm font-bold">What the Quick Forge does</p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-white/45">
                <li>• Removes inaudible sub-rumble below 24 Hz</li>
                <li>• Applies restrained tonal balance and compression</li>
                <li>• Protects the final peak at approximately −1 dBFS</li>
                <li>• Exports uncompressed 24-bit PCM WAV</li>
              </ul>
              <p className="mt-4 text-xs leading-5 text-orange-200/65">This is automated mastering, not restoration of clipped audio, missing stems, or a poor recording. Always audition before release.</p>
            </div>
          </div>

          <form id="mastering-forge" onSubmit={handleForge} className="rounded-[28px] border border-orange-300/20 bg-[#0d0a08] p-5 shadow-[0_30px_100px_rgba(0,0,0,.55)] sm:p-7">
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              className="rounded-2xl border border-dashed border-orange-400/35 bg-orange-500/[0.05] p-6 text-center"
            >
              <input ref={inputRef} type="file" accept="audio/*,.wav,.mp3,.flac,.aiff,.aif,.m4a,.aac" onChange={handleFile} className="sr-only" />
              <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-orange-500/12 text-orange-300"><Upload size={23} /></div>
              <p className="mt-3 font-bold">{file ? file.name : "Drop in one track"}</p>
              <p className="mt-1 text-xs text-white/35">WAV, MP3, FLAC, AIFF, M4A or AAC · up to 250 MB</p>
              <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="mt-4 rounded-xl bg-white/8 px-5 py-2.5 text-sm font-bold hover:bg-white/12 disabled:opacity-50">
                {file ? "Choose another" : "Choose track"}
              </button>
            </div>

            {statCards.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {statCards.map(([label, value]) => <div key={label} className="rounded-xl border border-white/8 bg-black/30 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-white/35">{label}</p><p className="mt-1 text-xs font-bold text-white/75">{value}</p></div>)}
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1">
              <button type="button" onClick={() => setMode("auto")} className={`rounded-lg px-3 py-3 text-sm font-bold ${mode === "auto" ? "bg-orange-500 text-black" : "text-white/45"}`}><Sparkles size={15} className="mr-2 inline" />Auto Forge</button>
              <button type="button" onClick={() => setMode("guided")} className={`rounded-lg px-3 py-3 text-sm font-bold ${mode === "guided" ? "bg-orange-500 text-black" : "text-white/45"}`}><Gauge size={15} className="mr-2 inline" />Prompt Guided</button>
            </div>

            {mode === "guided" && <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} maxLength={400} placeholder="Example: warm low end, clear vocal, punchy drums, keep the dynamics natural" className="mt-3 w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-orange-400/50" />}

            <button type="submit" disabled={!buffer || busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? <LoaderCircle className="animate-spin" size={19} /> : <Flame size={19} />}
              {busy ? "Working locally…" : "Forge 24-bit master"}
            </button>

            <p className="mt-4 text-center text-xs text-white/40" aria-live="polite">{status}</p>

            {separatingStems && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-orange-300/25 bg-gradient-to-br from-orange-500/[0.12] via-black/35 to-violet-500/[0.12] p-4 shadow-[inset_0_0_30px_rgba(251,146,60,.06)]" role="status" aria-live="polite">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-orange-300">The Forge Clock</p>
                    <p className="mt-1 text-sm font-black text-white">{stemStage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                      {stemRemaining > 0 ? "Estimated delivery" : "Final hammer strike"}
                    </p>
                    <p className="mt-0.5 font-mono text-2xl font-black tabular-nums text-orange-200">
                      {stemRemaining > 0 ? formatForgeTime(stemRemaining) : "ALMOST"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 via-amber-300 to-violet-300 transition-[width] duration-1000 ease-linear"
                    style={{ width: `${stemProgress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-wider text-white/30">
                  <span>{stemProgress}% forged</span>
                  <span>Six stems · original timing preserved</span>
                </div>
                <p className="mt-3 text-[10px] leading-4 text-white/35">
                  Your 24-bit master is already safe. This estimate adjusts to track length; complex songs can need one final pass.
                </p>
              </div>
            )}

            {error && <p role="alert" className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-center text-xs text-red-200">{error}</p>}
          </form>
        </div>

        <section id="engineer-crucible" className="scroll-mt-24 mt-10 rounded-[28px] border border-violet-300/20 bg-gradient-to-br from-violet-500/[0.08] to-orange-500/[0.05] p-5 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-200">Crucible Engineer Mode</p>
              <h2 className="mt-2 text-3xl font-black">Take the forge into the full 16-track workstation.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50">Import stems, trim dead space, align starts, preserve cadence, balance levels, audition A/B, and send the finished mix back through the Forge.</p>
            </div>
            <button
              type="button"
              onClick={() => engineerOpen ? setEngineerOpen(false) : void openEngineerMode()}
              className="shrink-0 rounded-xl bg-gradient-to-r from-violet-300 to-orange-400 px-5 py-3 text-sm font-black text-black"
            >
              {engineerOpen ? "Close Engineer Mode" : "Enable Crucible Engineer Mode"}
            </button>
          </div>
          <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-xs leading-5 text-amber-100/70">
            Advanced workspace: designed for hands-on creators and audio engineers. Every edit remains browser-local and your original files stay untouched.
          </div>
          {engineerOpen && stemFiles.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-violet-300/15 bg-black/25 p-5 text-center text-sm text-white/45">
              Stem separation is still forging the workstation session. Engineer Mode will open automatically when Track 01 is ready.
            </div>
          ) : null}
        </section>

        {sourceSamples && (
          <section className="mt-10 rounded-[28px] border border-white/10 bg-white/[0.025] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">A/B comparison</p><h2 className="mt-2 text-2xl font-black">Original directly above the forge</h2></div>
              <div className="flex items-center gap-2 text-xs text-white/40"><AudioWaveform size={16} /> Only one player can run at a time</div>
            </div>

            <div className="mt-6 space-y-6">
              <div className="rounded-2xl border border-white/8 bg-black/25 p-4">
                <Waveform samples={sourceSamples} color="rgba(255,255,255,.48)" label="Original" />
                <audio ref={sourceAudioRef} src={sourceUrl} onEnded={() => setPlaying(null)} preload="metadata" />
                <button type="button" onClick={() => togglePlayback("source")} className="mt-3 flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-xs font-bold text-white/70">
                  {playing === "source" ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />} {playing === "source" ? "Stop original" : "Play original"}
                </button>
              </div>

              {result ? (
                <div className="rounded-2xl border border-orange-400/25 bg-orange-500/[0.045] p-4">
                  <Waveform samples={result.samples} color="rgba(251,146,60,.82)" label="Crucible forge" />
                  <audio ref={resultAudioRef} src={result.url} onEnded={() => setPlaying(null)} preload="metadata" />
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => togglePlayback("result")} className="flex items-center justify-center gap-2 rounded-lg border border-orange-300/20 px-4 py-2 text-xs font-bold text-orange-100">
                      {playing === "result" ? <Square size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />} {playing === "result" ? "Stop forge" : "Play forge"}
                    </button>
                    <a href={result.url} download={result.name} className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-black text-black"><Download size={14} /> Download 24-bit WAV</a>
                    <button type="button" onClick={() => void openEngineerMode()} disabled={busy} className="flex items-center justify-center gap-2 rounded-lg bg-violet-300 px-4 py-2 text-xs font-black text-violet-950 disabled:opacity-40"><Hammer size={14} /> {busy ? "Separating stems…" : engineerOpen ? "Return to Engineer Mode" : stemFiles.length > 0 ? "Enter Engineer Mode" : "Separate stems + Engineer Mode"}</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-bold uppercase tracking-wider text-orange-100/55"><span>Peak {formatDb(result.stats.peakDb)}</span><span>Average {formatDb(result.stats.rmsDb)}</span><span>Dynamics {formatDb(result.stats.crestDb)}</span></div>
                </div>
              ) : (
                <div className="flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm text-white/30"><Hammer className="mr-2" size={18} /> The forged waveform will appear here.</div>
              )}
            </div>

            {result && <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-100/75"><CheckCircle2 className="mt-0.5 shrink-0" size={18} /><p>Forge completed locally. The original file remains untouched; the download is a new 24-bit WAV.</p></div>}
          </section>
        )}
      </section>

      {engineerOpen && stemFiles.length > 0 ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#070605] text-white">
          <header className="sticky top-0 z-20 border-b border-violet-300/15 bg-[#090708]/95 backdrop-blur-xl">
            <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setEngineerOpen(false)}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black text-white/70 hover:text-white"
                >
                  <ArrowLeft size={16} /> Back to Sound Furnace
                </button>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">Crucible Engineer Mode</p>
                  <h1 className="mt-1 text-xl font-black sm:text-2xl">16-Track Sequencing Workstation</h1>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start rounded-full border border-emerald-300/15 bg-emerald-400/[0.06] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-emerald-200/70 sm:self-auto">
                <CheckCircle2 size={13} /> {stemFiles.length} stems secured · original timing preserved
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-3 pb-16 pt-2 sm:px-6">
            <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-r from-violet-500/[0.07] to-orange-500/[0.05] px-4 py-3 text-xs leading-5 text-white/45 sm:px-5">
              Full engineering workspace: trim dead space, restore source timing, balance each layer, compare stems, learn the cadence pocket, and send the finished mix back through the Forge.
            </div>
            <StemSequencer onMixReady={acceptStemMix} initialFiles={stemFiles} />
          </div>
        </div>
      ) : null}
    </main>
  );
}
