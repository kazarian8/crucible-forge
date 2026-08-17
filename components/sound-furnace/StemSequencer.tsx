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
  CircleStop,
  Download,
  Layers3,
  LoaderCircle,
  Magnet,
  Mic,
  Pause,
  Play,
  Plus,
  Scissors,
  Trash2,
  WandSparkles,
  ZoomIn,
  ZoomOut,
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
  "webm",
  "ogg",
]);
const MUSICAL_NOTES = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"] as const;
const EFFECT_PRESETS = [
  { id: "warm", label: "Warm", detail: "Body and analog weight" },
  { id: "clear", label: "Clear", detail: "Presence and definition" },
  { id: "air", label: "Air", detail: "Open top end" },
  { id: "bass", label: "Bass", detail: "Focused low-end punch" },
  { id: "echo", label: "Echo", detail: "Tempo-safe depth" },
  { id: "space", label: "Space", detail: "Natural room tail" },
] as const;

type EffectPreset = typeof EFFECT_PRESETS[number]["id"];
type MusicalNote = typeof MUSICAL_NOTES[number];

type TrackEffects = {
  enabled: boolean;
  preset: EffectPreset;
  intensity: number;
  focusNote: MusicalNote;
  octave: number;
};

type StemTrack = {
  id: string;
  name: string;
  buffer: AudioBuffer;
  startSeconds: number;
  originalStartSeconds: number;
  trimStartSeconds: number;
  trimEndSeconds: number;
  fadeInSeconds: number;
  fadeOutSeconds: number;
  gainDb: number;
  muted: boolean;
  solo: boolean;
  effects: TrackEffects;
};

type StemSequencerProps = {
  onMixReady: (buffer: AudioBuffer, name: string) => void;
  initialFiles?: File[];
  onTrackCountChange?: (count: number) => void;
};

type CadenceProfile = {
  bpm: number;
  confidence: number;
  onsets: number[];
};

type CadenceSuggestion = {
  nudgeSeconds: number;
  confidence: number;
};

type ClipDrag = {
  trackId: string;
  startX: number;
  startSeconds: number;
  timelineWidth: number;
};

type PinchStart = {
  distance: number;
  zoom: number;
};

function dbToGain(value: number) {
  return Math.pow(10, value / 20);
}

function seconds(value: number) {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

function noteFrequency(note: MusicalNote, octave: number) {
  const noteIndex = MUSICAL_NOTES.indexOf(note);
  const midi = (octave + 1) * 12 + noteIndex;
  return 440 * Math.pow(2, (midi - 69) / 12);
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

function median(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function analyzeCadence(buffer: AudioBuffer): CadenceProfile {
  const frameSize = 1024;
  const hopSize = 512;
  const envelope: number[] = [];
  let previousEnergy = 0;

  for (let start = 0; start < buffer.length; start += hopSize) {
    let sum = 0;
    let count = 0;
    const end = Math.min(buffer.length, start + frameSize);
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let index = start; index < end; index += 1) {
        sum += data[index] * data[index];
        count += 1;
      }
    }
    const energy = Math.sqrt(sum / Math.max(1, count));
    envelope.push(Math.max(0, energy - previousEnergy * 0.82));
    previousEnergy = energy;
  }

  const mean = envelope.reduce((sum, value) => sum + value, 0) / Math.max(1, envelope.length);
  const variance =
    envelope.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    Math.max(1, envelope.length);
  const threshold = mean + Math.sqrt(variance) * 1.15;
  const minimumFrames = Math.max(1, Math.round((0.075 * buffer.sampleRate) / hopSize));
  const onsets: number[] = [];
  let lastFrame = -minimumFrames;

  for (let frame = 1; frame < envelope.length - 1; frame += 1) {
    const value = envelope[frame];
    if (
      value >= threshold &&
      value >= envelope[frame - 1] &&
      value > envelope[frame + 1] &&
      frame - lastFrame >= minimumFrames
    ) {
      onsets.push((frame * hopSize) / buffer.sampleRate);
      lastFrame = frame;
    }
  }

  const tempoVotes = new Map<number, number>();
  for (let index = 1; index < onsets.length; index += 1) {
    for (let back = Math.max(0, index - 4); back < index; back += 1) {
      const interval = onsets[index] - onsets[back];
      if (interval <= 0) continue;
      let bpm = 60 / interval;
      while (bpm < 70) bpm *= 2;
      while (bpm > 180) bpm /= 2;
      const bucket = Math.round(bpm);
      tempoVotes.set(bucket, (tempoVotes.get(bucket) ?? 0) + 1 / (index - back));
    }
  }

  let bpm = 120;
  let winningVotes = 0;
  let totalVotes = 0;
  for (const [candidate, votes] of tempoVotes) {
    totalVotes += votes;
    if (votes > winningVotes) {
      bpm = candidate;
      winningVotes = votes;
    }
  }

  return {
    bpm,
    confidence: totalVotes > 0 ? Math.min(1, winningVotes / totalVotes * 3) : 0,
    onsets,
  };
}

function learnCadenceSuggestions(
  tracks: StemTrack[],
  profiles: Record<string, CadenceProfile>,
  referenceId: string,
) {
  const reference = tracks.find((track) => track.id === referenceId);
  const referenceProfile = profiles[referenceId];
  if (!reference || !referenceProfile) return {};

  const referenceOnsets = referenceProfile.onsets
    .filter((time) => time >= reference.trimStartSeconds && time <= reference.trimEndSeconds)
    .map((time) => reference.startSeconds + time - reference.trimStartSeconds);
  const gridSeconds = 60 / Math.max(1, referenceProfile.bpm) / 4;
  const matchWindow = Math.max(0.08, Math.min(0.2, gridSeconds * 0.85));
  const suggestions: Record<string, CadenceSuggestion> = {};

  for (const track of tracks) {
    if (track.id === referenceId) {
      suggestions[track.id] = { nudgeSeconds: 0, confidence: 1 };
      continue;
    }
    const profile = profiles[track.id];
    if (!profile) continue;
    const corrections: number[] = [];
    const trackOnsets = profile.onsets
      .filter((time) => time >= track.trimStartSeconds && time <= track.trimEndSeconds)
      .map((time) => track.startSeconds + time - track.trimStartSeconds);

    for (const onset of trackOnsets) {
      let nearestCorrection = Number.POSITIVE_INFINITY;
      for (const referenceOnset of referenceOnsets) {
        const correction = referenceOnset - onset;
        if (Math.abs(correction) < Math.abs(nearestCorrection)) {
          nearestCorrection = correction;
        }
      }
      if (Math.abs(nearestCorrection) <= matchWindow) corrections.push(nearestCorrection);
    }

    if (corrections.length === 0 && referenceOnsets.length > 0 && trackOnsets.length > 0) {
      const origin = referenceOnsets[0];
      for (const onset of trackOnsets) {
        const target = origin + Math.round((onset - origin) / gridSeconds) * gridSeconds;
        const correction = target - onset;
        if (Math.abs(correction) <= matchWindow) corrections.push(correction);
      }
    }

    suggestions[track.id] = {
      nudgeSeconds: median(corrections),
      confidence: trackOnsets.length > 0
        ? Math.min(1, corrections.length / Math.min(12, trackOnsets.length))
        : 0,
    };
  }

  return suggestions;
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
  const effectTail = active.some((track) => track.effects.enabled && track.effects.preset === "space")
    ? 3
    : active.some((track) => track.effects.enabled && track.effects.preset === "echo")
      ? 1.5
      : 0.05;

  const context = new OfflineAudioContext(
    channels,
    Math.ceil((duration + effectTail) * sampleRate),
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

    source.connect(gain);

    if (!track.effects.enabled) {
      gain.connect(context.destination);
    } else {
      const amount = Math.max(0, Math.min(1, track.effects.intensity / 100));
      const focus = context.createBiquadFilter();
      focus.type = "peaking";
      focus.frequency.value = noteFrequency(track.effects.focusNote, track.effects.octave);
      focus.Q.value = 1.2 + amount * 5;
      focus.gain.value = amount * 7;
      gain.connect(focus);

      const tone = context.createBiquadFilter();
      if (track.effects.preset === "warm") {
        tone.type = "lowshelf";
        tone.frequency.value = 320;
        tone.gain.value = amount * 8;
      } else if (track.effects.preset === "clear") {
        tone.type = "peaking";
        tone.frequency.value = 3_200;
        tone.Q.value = 0.75;
        tone.gain.value = amount * 7;
      } else if (track.effects.preset === "air") {
        tone.type = "highshelf";
        tone.frequency.value = 8_500;
        tone.gain.value = amount * 9;
      } else if (track.effects.preset === "bass") {
        tone.type = "lowshelf";
        tone.frequency.value = 140;
        tone.gain.value = amount * 10;
      } else {
        tone.type = "allpass";
        tone.frequency.value = 1_000;
      }
      focus.connect(tone);
      tone.connect(context.destination);

      if (track.effects.preset === "echo") {
        const delay = context.createDelay(1);
        const feedback = context.createGain();
        const wet = context.createGain();
        delay.delayTime.value = 0.12 + amount * 0.28;
        feedback.gain.value = 0.12 + amount * 0.38;
        wet.gain.value = amount * 0.55;
        tone.connect(delay);
        delay.connect(feedback).connect(delay);
        delay.connect(wet).connect(context.destination);
      }

      if (track.effects.preset === "space") {
        const convolver = context.createConvolver();
        const wet = context.createGain();
        const seconds = 0.35 + amount * 2.2;
        const impulse = context.createBuffer(2, Math.ceil(context.sampleRate * seconds), context.sampleRate);
        for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
          const data = impulse.getChannelData(channel);
          for (let index = 0; index < data.length; index += 1) {
            data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, 2.4);
          }
        }
        convolver.buffer = impulse;
        wet.gain.value = amount * 0.6;
        tone.connect(convolver).connect(wet).connect(context.destination);
      }
    }
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

function TimelineWaveform({ track }: { track: StemTrack }) {
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

    const startFrame = Math.floor(track.trimStartSeconds * track.buffer.sampleRate);
    const endFrame = Math.min(
      track.buffer.length,
      Math.ceil(track.trimEndSeconds * track.buffer.sampleRate),
    );
    const points = Math.max(160, Math.floor(width));
    const block = Math.max(1, Math.floor((endFrame - startFrame) / points));

    context.fillStyle = "rgba(124,45,18,.96)";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,255,255,.12)";
    context.beginPath();
    context.moveTo(0, height / 2);
    context.lineTo(width, height / 2);
    context.stroke();

    for (let point = 0; point < points; point += 1) {
      let peak = 0;
      const start = startFrame + point * block;
      const end = Math.min(endFrame, start + block);
      for (let channel = 0; channel < track.buffer.numberOfChannels; channel += 1) {
        const data = track.buffer.getChannelData(channel);
        for (let sample = start; sample < end; sample += 1) {
          peak = Math.max(peak, Math.abs(data[sample]));
        }
      }
      const x = (point / points) * width;
      const bar = Math.max(1, peak * (height - 10));
      context.fillStyle = "rgba(255,190,92,.96)";
      context.fillRect(x, (height - bar) / 2, Math.max(1, width / points), bar);
    }

    const clipDuration = Math.max(0.001, trackDuration(track));
    const fadeInX = Math.min(width, (track.fadeInSeconds / clipDuration) * width);
    const fadeOutX = Math.max(0, width - (track.fadeOutSeconds / clipDuration) * width);
    context.fillStyle = "rgba(253,224,71,.2)";
    context.beginPath();
    context.moveTo(0, height);
    context.lineTo(fadeInX, 0);
    context.lineTo(fadeInX, height);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(fadeOutX, 0);
    context.lineTo(width, height);
    context.lineTo(fadeOutX, height);
    context.closePath();
    context.fill();
  }, [track]);

  return <canvas ref={canvasRef} className="h-full w-full" aria-label={`${track.name} timeline waveform`} />;
}

export default function StemSequencer({ onMixReady, initialFiles = [], onTrackCountChange }: StemSequencerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLAudioElement>(null);
  const previewUrlRef = useRef("");
  const importedBatchRef = useRef("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const clipDragRef = useRef<ClipDrag | null>(null);
  const pinchPointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchStartRef = useRef<PinchStart | null>(null);
  const [tracks, setTracks] = useState<StemTrack[]>([]);
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [cadenceReferenceId, setCadenceReferenceId] = useState("");
  const [cadenceStrength, setCadenceStrength] = useState(65);
  const [cadenceProfiles, setCadenceProfiles] = useState<Record<string, CadenceProfile>>({});
  const [cadenceSuggestions, setCadenceSuggestions] = useState<Record<string, CadenceSuggestion>>({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("Add stems to build a clean master-ready mix.");
  const [selectedTrackId, setSelectedTrackId] = useState("");
  const [playheadSeconds, setPlayheadSeconds] = useState(0);
  const [effectsTrackId, setEffectsTrackId] = useState("");
  const [recording, setRecording] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [timelineZoom, setTimelineZoom] = useState(1);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    if (initialFiles.length === 0) return;
    const batch = initialFiles
      .map((file) => `${file.name}:${file.size}:${file.lastModified}`)
      .join("|");
    if (batch === importedBatchRef.current) return;
    importedBatchRef.current = batch;
    void addFiles(initialFiles);
  }, [initialFiles]);

  useEffect(() => {
    onTrackCountChange?.(tracks.length);
  }, [onTrackCountChange, tracks.length]);

  const duration = useMemo(() => projectDuration(tracks), [tracks]);
  const hasSolo = tracks.some((track) => track.solo);
  const selectedTrack = tracks.find((track) => track.id === selectedTrackId) ?? tracks[0] ?? null;
  const rulerDuration = Math.max(1, duration);
  const rulerMarks = useMemo(
    () => Array.from({ length: 9 }, (_, index) => (rulerDuration * index) / 8),
    [rulerDuration],
  );

  function replaceTrack(id: string, patch: Partial<StemTrack>) {
    setTracks((current) =>
      current.map((track) => (track.id === id ? { ...track, ...patch } : track)),
    );
  }

  function beginClipDrag(event: ReactPointerEvent<HTMLElement>, track: StemTrack) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const timeline = event.currentTarget.parentElement;
    clipDragRef.current = {
      trackId: track.id,
      startX: event.clientX,
      startSeconds: track.startSeconds,
      timelineWidth: Math.max(1, timeline?.clientWidth ?? event.currentTarget.clientWidth),
    };
    setSelectedTrackId(track.id);
  }

  function moveClip(event: ReactPointerEvent<HTMLElement>) {
    const drag = clipDragRef.current;
    if (!drag) return;
    const raw = Math.max(0, drag.startSeconds + ((event.clientX - drag.startX) / drag.timelineWidth) * rulerDuration);
    const next = snapEnabled ? Math.round(raw / 0.5) * 0.5 : Math.round(raw * 100) / 100;
    replaceTrack(drag.trackId, { startSeconds: next });
  }

  function endClipDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    clipDragRef.current = null;
  }

  function pinchDistance() {
    const points = Array.from(pinchPointersRef.current.values());
    if (points.length < 2) return 0;
    return Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
  }

  function handleTimelinePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    pinchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchPointersRef.current.size === 2) {
      pinchStartRef.current = { distance: pinchDistance(), zoom: timelineZoom };
      clipDragRef.current = null;
    }
  }

  function handleTimelinePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pinchPointersRef.current.has(event.pointerId)) return;
    pinchPointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pinchPointersRef.current.size < 2 || !pinchStartRef.current) return;
    event.preventDefault();
    const ratio = pinchDistance() / Math.max(1, pinchStartRef.current.distance);
    setTimelineZoom(Math.max(1, Math.min(6, pinchStartRef.current.zoom * ratio)));
  }

  function handleTimelinePointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    pinchPointersRef.current.delete(event.pointerId);
    if (pinchPointersRef.current.size < 2) pinchStartRef.current = null;
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

      for (const [index, file] of candidates.entries()) {
        const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
        if (!ACCEPTED_EXTENSIONS.has(extension) || file.size > MAX_FILE_BYTES) {
          throw new Error(`${file.name} is unsupported or larger than 250 MB.`);
        }

        setStatus(`Opening stem ${index + 1} of ${candidates.length}: ${file.name}…`);
        const bytes = await file.arrayBuffer();
        const buffer = await context.decodeAudioData(bytes.slice(0));
        const audible = detectAudibleRange(buffer);
        const addition: StemTrack = {
          id: crypto.randomUUID(),
          name: file.name,
          buffer,
          startSeconds: audible.start,
          originalStartSeconds: audible.start,
          trimStartSeconds: audible.start,
          trimEndSeconds: audible.end,
          fadeInSeconds: Math.min(0.02, (audible.end - audible.start) / 2),
          fadeOutSeconds: Math.min(0.04, (audible.end - audible.start) / 2),
          gainDb: 0,
          muted: false,
          solo: false,
          effects: {
            enabled: false,
            preset: "clear",
            intensity: 50,
            focusNote: "A",
            octave: 3,
          },
        };
        additions.push(addition);

        // Reveal each decoded stem immediately so mobile users see the
        // sequencer filling instead of waiting for the entire batch.
        setTracks((current) => current.length >= MAX_TRACKS ? current : [...current, addition]);
        setSelectedTrackId((current) => current || addition.id);
        setCadenceReferenceId((current) => current || addition.id);
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }

      await context.close();
      setCadenceProfiles({});
      setCadenceSuggestions({});
      setStatus(
        `Loaded ${additions.length} stem${additions.length === 1 ? "" : "s"}. Dead space was clipped with a safe 25 ms edge and every original timestamp was preserved.`,
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

  async function startVocalRecording() {
    if (tracks.length >= MAX_TRACKS) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const preferredType = ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]
        .find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = preferredType
        ? new MediaRecorder(stream, { mimeType: preferredType })
        : new MediaRecorder(stream);
      recorderRef.current = recorder;
      recordingStreamRef.current = stream;
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || preferredType || "audio/webm";
        const extension = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const blob = new Blob(recordingChunksRef.current, { type });
        const vocal = new File([blob], `Crucible-Vocal-${Date.now()}.${extension}`, { type });
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        recorderRef.current = null;
        setRecording(false);
        setStatus("Vocal captured. Loading it into a new sequencer lane…");
        void addFiles([vocal]);
      };
      recorder.start(250);
      setRecording(true);
      setStatus("Recording a new vocal track locally…");
    } catch {
      setError("Microphone access is required to create a vocal track.");
      setStatus("Vocal recording did not start.");
    }
  }

  function stopVocalRecording() {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function restoreOriginalTiming() {
    setTracks((current) =>
      current.map((track) => ({
        ...track,
        startSeconds: track.originalStartSeconds,
      })),
    );
    setStatus("Every stem was restored to its original source timestamp.");
  }

  function scanCadence() {
    if (tracks.length === 0) return;
    setBusy(true);
    setError("");
    setStatus("Scanning transients, tempo, phrase spacing, and human timing pocket…");
    window.setTimeout(() => {
      try {
        const profiles: Record<string, CadenceProfile> = {};
        for (const track of tracks) {
          profiles[track.id] = analyzeCadence(track.buffer);
        }
        const referenceId = cadenceReferenceId || tracks[0].id;
        setCadenceReferenceId(referenceId);
        setCadenceProfiles(profiles);
        setCadenceSuggestions(
          learnCadenceSuggestions(tracks, profiles, referenceId),
        );
        const reference = profiles[referenceId];
        setStatus(
          `Cadence learned from the reference stem: about ${reference.bpm} BPM with ${reference.onsets.length} detected timing events. Review the visual nudges before applying.`,
        );
      } catch {
        setError("Cadence analysis could not finish on this device.");
        setStatus("The original stem timing remains unchanged.");
      } finally {
        setBusy(false);
      }
    }, 20);
  }

  function applyCadenceSuggestions() {
    setTracks((current) =>
      current.map((track) => {
        const suggestion = cadenceSuggestions[track.id];
        if (!suggestion || track.id === cadenceReferenceId) return track;
        const applied = suggestion.nudgeSeconds * (cadenceStrength / 100);
        return {
          ...track,
          startSeconds: Math.max(0, track.startSeconds + applied),
        };
      }),
    );
    setStatus(
      `Applied Smart Cadence at ${cadenceStrength}% strength. Internal vocal timing was preserved; only phase-safe stem placement moved.`,
    );
    setCadenceSuggestions({});
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
    <section className="mt-3 rounded-[22px] border border-orange-300/20 bg-[#0d0a08] p-3 shadow-[0_30px_100px_rgba(0,0,0,.45)] sm:mt-10 sm:rounded-[28px] sm:p-7">
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
            accept="audio/*,.wav,.mp3,.flac,.aiff,.aif,.m4a,.aac,.webm,.ogg"
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
            onClick={recording ? stopVocalRecording : () => void startVocalRecording()}
            disabled={busy || tracks.length >= MAX_TRACKS}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black disabled:opacity-40 ${recording ? "border-red-400/40 bg-red-500/15 text-red-100" : "border-emerald-300/20 bg-emerald-400/[0.06] text-emerald-100"}`}
          >
            {recording ? <CircleStop size={15} fill="currentColor" /> : <Mic size={15} />}
            {recording ? "Stop vocal" : "New vocal track"}
          </button>
          <button
            type="button"
            onClick={restoreOriginalTiming}
            disabled={busy || tracks.length === 0}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/65 disabled:opacity-40"
          >
            Restore timestamps
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
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-[#080706]">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/55 px-3 py-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePreview}
                disabled={!previewUrl}
                aria-label={playing ? "Pause sequence" : "Play sequence"}
                className="grid size-9 place-items-center rounded-full bg-orange-500 text-black disabled:opacity-30"
              >
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
              </button>
              <p className="font-mono text-sm font-black tabular-nums text-orange-100">{formatTime(playheadSeconds)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-pressed={snapEnabled}
                onClick={() => setSnapEnabled((enabled) => !enabled)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-[9px] font-black uppercase tracking-wider ${snapEnabled ? "bg-orange-400 text-black" : "bg-white/8 text-white/50"}`}
              >
                <Magnet size={13} /> {snapEnabled ? "Snap .5s" : "Free"}
              </button>
              <button type="button" aria-label="Zoom timeline out" onClick={() => setTimelineZoom((zoom) => Math.max(1, zoom - 0.5))} className="grid size-8 place-items-center rounded-lg bg-white/8 text-white/55"><ZoomOut size={14} /></button>
              <span className="min-w-9 text-center font-mono text-[9px] text-white/40">{Math.round(timelineZoom * 100)}%</span>
              <button type="button" aria-label="Zoom timeline in" onClick={() => setTimelineZoom((zoom) => Math.min(6, zoom + 0.5))} className="grid size-8 place-items-center rounded-lg bg-white/8 text-white/55"><ZoomIn size={14} /></button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div
              className="touch-pan-x"
              style={{ width: `${Math.round(760 * timelineZoom)}px`, minWidth: "760px" }}
              onPointerDownCapture={handleTimelinePointerDown}
              onPointerMoveCapture={handleTimelinePointerMove}
              onPointerUpCapture={handleTimelinePointerEnd}
              onPointerCancelCapture={handleTimelinePointerEnd}
            >
              <div className="grid grid-cols-[150px_1fr] border-b border-white/10 bg-[#0d0b0a]">
                <div className="border-r border-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white/30">Tracks</div>
                <div className="relative h-9">
                  {rulerMarks.map((mark, index) => (
                    <div key={mark} className="absolute inset-y-0 border-l border-white/10" style={{ left: `${(index / 8) * 100}%` }}>
                      <span className="ml-1 font-mono text-[9px] text-white/35">{formatTime(mark)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div
                  className="pointer-events-none absolute bottom-0 top-0 z-20 w-px bg-orange-300 shadow-[0_0_10px_rgba(253,186,116,.8)]"
                  style={{ left: `calc(150px + (100% - 150px) * ${Math.min(1, playheadSeconds / rulerDuration)})` }}
                />
                {tracks.map((track, index) => {
                  const inactive = track.muted || (hasSolo && !track.solo);
                  const selected = selectedTrack?.id === track.id;
                  const clipLeft = (track.startSeconds / rulerDuration) * 100;
                  const clipWidth = Math.max(1.5, (trackDuration(track) / rulerDuration) * 100);
                  return (
                    <article key={track.id} className={`grid h-[84px] grid-cols-[150px_1fr] border-b border-white/[0.07] last:border-b-0 ${inactive ? "opacity-45" : ""}`}>
                      <div className={`border-r px-2 py-2 ${selected ? "border-orange-400/50 bg-orange-500/10" : "border-white/10 bg-black/35"}`}>
                        <button type="button" onClick={() => setSelectedTrackId(track.id)} className="block w-full text-left">
                          <span className="text-[9px] font-black uppercase tracking-wider text-orange-300/70">{String(index + 1).padStart(2, "0")}</span>
                          <span className="block truncate text-[11px] font-bold text-white/80" title={track.name}>{track.name}</span>
                        </button>
                        <div className="mt-2 flex gap-1">
                          <button type="button" aria-label={`Mute ${track.name}`} aria-pressed={track.muted} onClick={() => replaceTrack(track.id, { muted: !track.muted })} className={`grid size-7 place-items-center rounded text-[9px] font-black ${track.muted ? "bg-red-500 text-white" : "bg-white/8 text-white/45"}`}>M</button>
                          <button type="button" aria-label={`Solo ${track.name}`} aria-pressed={track.solo} onClick={() => replaceTrack(track.id, { solo: !track.solo })} className={`grid size-7 place-items-center rounded text-[9px] font-black ${track.solo ? "bg-amber-300 text-black" : "bg-white/8 text-white/45"}`}>S</button>
                          <button type="button" aria-label={`Compare ${track.name}`} aria-pressed={compareIds.includes(track.id)} onClick={() => toggleCompare(track.id)} className={`grid size-7 place-items-center rounded text-[9px] font-black ${compareIds.includes(track.id) ? "bg-sky-300 text-black" : "bg-white/8 text-white/45"}`}>A/B</button>
                          <button
                            type="button"
                            aria-label={`Open effects for ${track.name}`}
                            aria-pressed={effectsTrackId === track.id}
                            onClick={() => {
                              setSelectedTrackId(track.id);
                              setEffectsTrackId((current) => current === track.id ? "" : track.id);
                            }}
                            className={`grid size-7 place-items-center rounded text-[9px] font-black ${track.effects.enabled ? "bg-violet-300 text-violet-950" : "bg-white/8 text-white/45"}`}
                          >FX</button>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedTrackId(track.id)}
                        className={`relative overflow-hidden text-left ${selected ? "ring-1 ring-inset ring-orange-300/45" : ""}`}
                        style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent calc(12.5% - 1px), rgba(255,255,255,.05) 12.5%)" }}
                        aria-label={`Select ${track.name} on timeline`}
                      >
                        <span
                          className="absolute inset-y-2 touch-none cursor-grab overflow-hidden rounded-md border border-orange-300/30 shadow-[0_4px_18px_rgba(0,0,0,.35)] active:cursor-grabbing"
                          style={{ left: `${clipLeft}%`, width: `${Math.min(100 - clipLeft, clipWidth)}%` }}
                          onPointerDown={(event) => beginClipDrag(event, track)}
                          onPointerMove={moveClip}
                          onPointerUp={endClipDrag}
                          onPointerCancel={endClipDrag}
                        >
                          <TimelineWaveform track={track} />
                        </span>
                      </button>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTrack && effectsTrackId === selectedTrack.id ? (
        <section className="mt-4 overflow-hidden rounded-2xl border border-violet-300/20 bg-[#101014]">
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-200/65">Per-stem effects</p>
              <h3 className="truncate text-sm font-black text-white/90">{selectedTrack.name}</h3>
            </div>
            <button
              type="button"
              onClick={() => replaceTrack(selectedTrack.id, { effects: { ...selectedTrack.effects, enabled: !selectedTrack.effects.enabled } })}
              className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wider ${selectedTrack.effects.enabled ? "bg-emerald-400 text-emerald-950" : "bg-white/8 text-white/45"}`}
            >
              {selectedTrack.effects.enabled ? "FX on" : "Enable FX"}
            </button>
          </div>

          <div className="grid gap-5 p-4 lg:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-black/30 p-5">
              <div
                className="relative grid size-40 place-items-center rounded-full"
                style={{ background: `conic-gradient(#a78bfa 0 ${selectedTrack.effects.intensity * 3.6}deg, #27272a ${selectedTrack.effects.intensity * 3.6}deg 360deg)` }}
              >
                <div className="grid size-[132px] place-items-center rounded-full bg-[#202126] shadow-inner">
                  <div className="h-12 w-1 origin-bottom rounded-full bg-white" style={{ transform: `rotate(${-135 + selectedTrack.effects.intensity * 2.7}deg) translateY(-22px)` }} />
                </div>
              </div>
              <p className="mt-3 text-sm font-black text-white/85">Intensity {selectedTrack.effects.intensity}%</p>
              <input
                aria-label={`${selectedTrack.name} effect intensity`}
                type="range"
                min="0"
                max="100"
                value={selectedTrack.effects.intensity}
                onChange={(event) => replaceTrack(selectedTrack.id, { effects: { ...selectedTrack.effects, intensity: event.target.valueAsNumber } })}
                className="mt-3 w-full accent-violet-400"
              />
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Effect character</p>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {EFFECT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => replaceTrack(selectedTrack.id, { effects: { ...selectedTrack.effects, preset: preset.id, enabled: true } })}
                    className={`rounded-xl border px-2 py-3 text-center ${selectedTrack.effects.preset === preset.id ? "border-violet-300/55 bg-violet-300 text-violet-950" : "border-white/8 bg-white/[0.035] text-white/55"}`}
                    title={preset.detail}
                  >
                    <span className="block text-xs font-black">{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                  Focused note
                  <select
                    value={selectedTrack.effects.focusNote}
                    onChange={(event) => replaceTrack(selectedTrack.id, { effects: { ...selectedTrack.effects, focusNote: event.target.value as MusicalNote } })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/45 px-3 py-3 text-sm font-bold text-white"
                  >
                    {MUSICAL_NOTES.map((note) => <option key={note} value={note}>{note}</option>)}
                  </select>
                </label>
                <label className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">
                  Focus octave
                  <select
                    value={selectedTrack.effects.octave}
                    onChange={(event) => replaceTrack(selectedTrack.id, { effects: { ...selectedTrack.effects, octave: Number(event.target.value) } })}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/45 px-3 py-3 text-sm font-bold text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map((octave) => <option key={octave} value={octave}>Octave {octave}</option>)}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-xl border border-orange-300/15 bg-orange-400/[0.05] p-3 text-xs leading-5 text-orange-100/60">
                Manual FX are included and processed on this device. AI Quick FX presets will display their coin price before running and will only charge after a cloud processor accepts the job.
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {selectedTrack ? (
        <section className="mt-4 rounded-2xl border border-orange-300/15 bg-orange-500/[0.035] p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-orange-300/70">Selected track inspector</p>
              <h3 className="truncate text-sm font-black text-white/85">{selectedTrack.name}</h3>
            </div>
            <button
              type="button"
              aria-label={`Remove ${selectedTrack.name}`}
              onClick={() => {
                setTracks((current) => current.filter((item) => item.id !== selectedTrack.id));
                setSelectedTrackId("");
              }}
              className="rounded-lg border border-white/10 p-2 text-white/35 hover:text-red-300"
            >
              <Trash2 size={15} />
            </button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Start", selectedTrack.startSeconds, 0, rulerDuration, (value: number) => ({ startSeconds: seconds(value) })],
              ["Trim in", selectedTrack.trimStartSeconds, 0, selectedTrack.trimEndSeconds, (value: number) => ({ trimStartSeconds: Math.min(selectedTrack.trimEndSeconds, seconds(value)) })],
              ["Trim out", selectedTrack.trimEndSeconds, selectedTrack.trimStartSeconds, selectedTrack.buffer.duration, (value: number) => ({ trimEndSeconds: Math.max(selectedTrack.trimStartSeconds, Math.min(selectedTrack.buffer.duration, seconds(value))) })],
              ["Fade in", selectedTrack.fadeInSeconds, 0, trackDuration(selectedTrack) / 2, (value: number) => ({ fadeInSeconds: seconds(value) })],
              ["Fade out", selectedTrack.fadeOutSeconds, 0, trackDuration(selectedTrack) / 2, (value: number) => ({ fadeOutSeconds: seconds(value) })],
              ["Gain dB", selectedTrack.gainDb, -24, 12, (value: number) => ({ gainDb: value || 0 })],
            ].map(([label, value, min, max, patch]) => (
              <label key={label as string} className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                {label as string}
                <input
                  type="number"
                  min={min as number}
                  max={max as number}
                  step={label === "Gain dB" ? 0.5 : 0.01}
                  value={value as number}
                  onChange={(event) => replaceTrack(selectedTrack.id, (patch as (value: number) => Partial<StemTrack>)(event.target.valueAsNumber))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/45 px-2 py-2 text-xs text-white"
                />
              </label>
            ))}
          </div>
        </section>
      ) : null}

      {tracks.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-violet-300/20 bg-violet-400/[0.045] p-4">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200/75">Smart Cadence Quantize</p>
              <h3 className="mt-1 text-lg font-black text-white/90">Learn the pocket—don’t erase it.</h3>
              <p className="mt-1 text-xs leading-5 text-white/42">Choose a reference stem, scan the timing pocket, then approve any suggested lane nudges.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(150px,1fr)_minmax(180px,1fr)_auto_auto]">
              <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                Learn from
                <select value={cadenceReferenceId} onChange={(event) => { setCadenceReferenceId(event.target.value); setCadenceSuggestions({}); }} className="mt-1 w-full rounded-lg border border-white/10 bg-black/55 px-3 py-2.5 text-xs text-white">
                  {tracks.map((track) => <option key={track.id} value={track.id}>{track.name}</option>)}
                </select>
              </label>
              <label className="text-[9px] font-bold uppercase tracking-wider text-white/35">
                Strength {cadenceStrength}%
                <input type="range" min="0" max="100" step="5" value={cadenceStrength} onChange={(event) => setCadenceStrength(event.target.valueAsNumber)} className="mt-3 w-full accent-violet-400" />
              </label>
              <button type="button" onClick={scanCadence} disabled={busy} className="self-end rounded-xl border border-violet-300/25 px-4 py-2.5 text-xs font-black text-violet-100 disabled:opacity-40">Scan cadence</button>
              <button type="button" onClick={applyCadenceSuggestions} disabled={busy || Object.keys(cadenceSuggestions).length === 0} className="self-end rounded-xl bg-violet-300 px-4 py-2.5 text-xs font-black text-violet-950 disabled:opacity-35">Apply nudges</button>
            </div>
          </div>
          {cadenceProfiles[cadenceReferenceId] ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full bg-black/30 px-3 py-1.5 text-violet-100/70">Estimated {cadenceProfiles[cadenceReferenceId].bpm} BPM</span>
              <span className="rounded-full bg-black/30 px-3 py-1.5 text-violet-100/70">{cadenceProfiles[cadenceReferenceId].onsets.length} timing events</span>
              <span className="rounded-full bg-black/30 px-3 py-1.5 text-violet-100/70">{Math.round(cadenceProfiles[cadenceReferenceId].confidence * 100)}% confidence</span>
            </div>
          ) : null}
        </section>
      ) : null}

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
                onTimeUpdate={(event) => setPlayheadSeconds(event.currentTarget.currentTime)}
                onEnded={() => {
                  setPlaying(false);
                  setPlayheadSeconds(0);
                }}
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
