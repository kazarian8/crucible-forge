export type FileDnaAnalysis = {
  duration: number;
  sampleRate: number;
  channels: number;
  peakDb: number;
  rmsDb: number;
  silencePercent: number;
  clippingCount: number;
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  status: "verified" | "warning" | "failed";
  notes: string[];
  contentType: "one-shot" | "loop" | "sample" | "stem" | "track";
  suggestedCategory: "beat" | "loop" | "sample" | "one-shot" | "track" | "other";
  contentTags: string[];
  contentConfidence: number;
  estimatedBpm: number | null;
  bpmConfidence: number;
  estimatedKey: string | null;
  keyConfidence: number;
  transientRate: number;
  rhythmicity: number;
  tonality: number;
  modelVersion: "dna-signal-v2";
  learnedFromExamples: number;
  confidenceSource: "signal" | "signal+community";
};

type MusicalContent = Pick<FileDnaAnalysis,
  | "contentType"
  | "suggestedCategory"
  | "contentTags"
  | "contentConfidence"
  | "estimatedBpm"
  | "bpmConfidence"
  | "estimatedKey"
  | "keyConfidence"
  | "transientRate"
  | "rhythmicity"
  | "tonality"
>;

const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const MAJOR_PROFILE = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const MINOR_PROFILE = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

function clampPercent(value: number) {
  return Math.max(0, Math.min(99, Math.round(value)));
}

export function analyzeMusicalContent(buffer: AudioBuffer, filename: string): MusicalContent {
  const source = buffer.getChannelData(0);
  const analysisLength = Math.min(source.length, Math.floor(buffer.sampleRate * 180));
  const frameSize = Math.min(2048, Math.max(32, analysisLength));
  const hop = Math.max(16, Math.floor(frameSize / 2));
  const envelope: number[] = [];
  let zeroCrossings = 0;
  let comparedSamples = 0;

  for (let start = 0; start + frameSize <= analysisLength; start += hop) {
    let energy = 0;
    let previous = source[start] ?? 0;
    for (let index = start; index < start + frameSize; index += 1) {
      const value = source[index] ?? 0;
      energy += value * value;
      if ((value >= 0) !== (previous >= 0)) zeroCrossings += 1;
      previous = value;
      comparedSamples += 1;
    }
    envelope.push(Math.sqrt(energy / frameSize));
  }

  const rawOnsetEnvelope = envelope.map((value, index) => index === 0 ? 0 : Math.max(0, value - envelope[index - 1]));
  const envelopeMean = envelope.reduce((sum, value) => sum + value, 0) / Math.max(1, envelope.length);
  const onsetMean = rawOnsetEnvelope.reduce((sum, value) => sum + value, 0) / Math.max(1, rawOnsetEnvelope.length);
  const onsetVariance = rawOnsetEnvelope.reduce((sum, value) => sum + ((value - onsetMean) ** 2), 0) / Math.max(1, rawOnsetEnvelope.length);
  const onsetThreshold = Math.max(0.002, envelopeMean * 0.12, onsetMean + Math.sqrt(onsetVariance) * 1.25);
  const onsetEnvelope = rawOnsetEnvelope.map((value) => value > onsetThreshold ? value : 0);
  const transientCount = onsetEnvelope.filter((value) => value > 0).length;
  const analyzedSeconds = analysisLength / buffer.sampleRate;
  const transientRate = transientCount / Math.max(0.02, analyzedSeconds);
  const framesPerSecond = buffer.sampleRate / hop;

  let bestBpm: number | null = null;
  let bestRhythmicity = 0;
  const onsetPower = onsetEnvelope.reduce((sum, value) => sum + value * value, 0);
  if (onsetEnvelope.length >= 8 && onsetPower > 1e-8 && transientRate >= 0.2) {
    for (let bpm = 60; bpm <= 200; bpm += 1) {
      const lag = Math.max(1, Math.round((framesPerSecond * 60) / bpm));
      if (lag >= onsetEnvelope.length) continue;
      let correlation = 0;
      let leftPower = 0;
      let rightPower = 0;
      for (let index = lag; index < onsetEnvelope.length; index += 1) {
        const left = onsetEnvelope[index];
        const right = onsetEnvelope[index - lag];
        correlation += left * right;
        leftPower += left * left;
        rightPower += right * right;
      }
      const normalized = correlation / Math.sqrt(Math.max(1e-12, leftPower * rightPower));
      if (normalized > bestRhythmicity) {
        bestRhythmicity = normalized;
        bestBpm = bpm;
      }
    }
  }
  const bpmConfidence = clampPercent(bestRhythmicity * 105);
  if (bestBpm && bestBpm < 75) bestBpm *= 2;
  if (bpmConfidence < 18) bestBpm = null;

  const chroma = Array.from({ length: 12 }, () => 0);
  let bassEnergy = 0;
  let tonalEnergy = 0;
  const spectralFrame = Math.min(4096, analysisLength);
  const windowCount = spectralFrame >= 64 ? Math.min(10, Math.max(1, Math.floor(analysisLength / spectralFrame))) : 0;
  for (let windowIndex = 0; windowIndex < windowCount; windowIndex += 1) {
    const start = windowCount === 1 ? 0 : Math.floor(((analysisLength - spectralFrame) * windowIndex) / (windowCount - 1));
    for (let midi = 36; midi <= 95; midi += 1) {
      const frequency = 440 * (2 ** ((midi - 69) / 12));
      const coefficient = 2 * Math.cos((2 * Math.PI * frequency) / buffer.sampleRate);
      let first = 0;
      let second = 0;
      for (let sampleIndex = 0; sampleIndex < spectralFrame; sampleIndex += 1) {
        const next = (source[start + sampleIndex] ?? 0) + coefficient * first - second;
        second = first;
        first = next;
      }
      const power = Math.max(0, second * second + first * first - coefficient * first * second);
      chroma[midi % 12] += power;
      tonalEnergy += power;
      if (midi < 52) bassEnergy += power;
    }
  }

  const chromaMean = chroma.reduce((sum, value) => sum + value, 0) / 12;
  const chromaPeak = Math.max(...chroma);
  const tonality = chromaMean > 0 ? chromaPeak / chromaMean : 0;
  const keyCandidates: Array<{ name: string; score: number }> = [];
  for (let root = 0; root < 12; root += 1) {
    const major = MAJOR_PROFILE.reduce((sum, weight, index) => sum + weight * chroma[(root + index) % 12], 0);
    const minor = MINOR_PROFILE.reduce((sum, weight, index) => sum + weight * chroma[(root + index) % 12], 0);
    keyCandidates.push({ name: `${NOTE_NAMES[root]} major`, score: major }, { name: `${NOTE_NAMES[root]} minor`, score: minor });
  }
  keyCandidates.sort((left, right) => right.score - left.score);
  const keyMargin = keyCandidates[0]?.score > 0 ? (keyCandidates[0].score - (keyCandidates[1]?.score ?? 0)) / keyCandidates[0].score : 0;
  const activePitchClasses = chroma.filter((value) => value >= chromaPeak * 0.15).length;
  const rawKeyConfidence = clampPercent(Math.max(0, tonality - 1) * 22 + keyMargin * 220);
  const keyConfidence = activePitchClasses >= 3 ? rawKeyConfidence : Math.min(15, rawKeyConfidence);
  const estimatedKey = keyConfidence >= 18 ? keyCandidates[0]?.name ?? null : null;

  const lowerName = filename.toLowerCase();
  const tags = new Set<string>();
  if ((transientRate >= 1.2 && bestRhythmicity >= 0.08) || /drum|beat|perc|kick|snare|hat/.test(lowerName)) tags.add("drums/percussion");
  if ((tonalEnergy > 0 && bassEnergy / tonalEnergy >= 0.19) || /bass|808/.test(lowerName)) tags.add("bass");
  if (tonality >= 1.3) tags.add("melodic/tonal");
  const averageZeroCrossingRate = zeroCrossings / Math.max(1, comparedSamples);
  const voiceLike = tonality >= 1.2 && averageZeroCrossingRate >= 0.015 && averageZeroCrossingRate <= 0.22 && transientRate < 5 && buffer.duration > 0.5;
  if (voiceLike || /vocal|vox|voice|acapella|verse|hook/.test(lowerName)) tags.add("possible vocals");
  if (tags.size === 0) tags.add("mixed audio");

  const beatCount = bestBpm ? (buffer.duration * bestBpm) / 60 : 0;
  const nearWholeBeat = bestBpm ? Math.abs(beatCount - Math.round(beatCount)) <= 0.18 : false;
  let contentType: MusicalContent["contentType"];
  let contentConfidence: number;
  if (buffer.duration < 1.5) {
    contentType = "one-shot";
    contentConfidence = 96;
  } else if (/loop/.test(lowerName) || (buffer.duration <= 20 && nearWholeBeat && bpmConfidence >= 22)) {
    contentType = "loop";
    contentConfidence = /loop/.test(lowerName) ? 88 : clampPercent(48 + bpmConfidence * 0.45);
  } else if (/stem|vocal|vox|drum|bass|instrumental/.test(lowerName) && buffer.duration >= 4) {
    contentType = "stem";
    contentConfidence = 82;
  } else if (buffer.duration >= 45 || tags.size >= 3) {
    contentType = "track";
    contentConfidence = buffer.duration >= 45 ? 82 : 68;
  } else {
    contentType = "sample";
    contentConfidence = 64;
  }

  let suggestedCategory: MusicalContent["suggestedCategory"] = contentType === "stem" ? "sample" : contentType;
  if (/beat|instrumental/.test(lowerName) || (tags.has("drums/percussion") && contentType === "track")) suggestedCategory = "beat";

  return {
    contentType,
    suggestedCategory,
    contentTags: Array.from(tags),
    contentConfidence,
    estimatedBpm: bestBpm,
    bpmConfidence,
    estimatedKey,
    keyConfidence,
    transientRate,
    rhythmicity: bestRhythmicity,
    tonality,
  };
}

function db(value: number) {
  return 20 * Math.log10(Math.max(value, 1e-9));
}

function gradeFor(score: number): FileDnaAnalysis["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function audioContextConstructor() {
  const browserWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  return window.AudioContext || browserWindow.webkitAudioContext;
}

export async function analyzeAudioFile(file: Blob): Promise<{ analysis: FileDnaAnalysis; hash: string }> {
  const bytes = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes.slice(0));
  const hash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  const AudioContextCtor = audioContextConstructor();
  if (!AudioContextCtor) throw new Error("This browser cannot analyze audio files.");

  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData(bytes.slice(0));
    const filename = file instanceof File ? file.name : "audio";
    const musicalContent = analyzeMusicalContent(decoded, filename);
    const stride = Math.max(1, Math.floor(decoded.length / 1_000_000));
    let peak = 0;
    let sumSquares = 0;
    let samples = 0;
    let silent = 0;
    let clipping = 0;

    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
      const data = decoded.getChannelData(channel);
      for (let index = 0; index < data.length; index += stride) {
        const value = data[index];
        const absolute = Math.abs(value);
        peak = Math.max(peak, absolute);
        sumSquares += value * value;
        samples += 1;
        if (absolute < 0.001) silent += 1;
        if (absolute >= 0.999) clipping += 1;
      }
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, samples));
    const peakDb = db(peak);
    const rmsDb = db(rms);
    const silencePercent = (silent / Math.max(1, samples)) * 100;
    const notes: string[] = [];
    let score = 100;

    if (decoded.duration < 0.02 || decoded.length < 2) {
      score = 0;
      notes.push("The file decoded without enough audio samples to verify.");
    } else if (decoded.duration < 0.5) {
      score -= 5;
      notes.push("Very short audio detected. It can still be saved as a one-shot or short clip.");
    }
    if (clipping > 0) {
      const penalty = Math.min(30, Math.max(5, Math.round((clipping / Math.max(1, samples)) * 5000)));
      score -= penalty;
      notes.push("Clipped or near-clipped samples were detected.");
    }
    if (peakDb > -0.1) {
      score -= 8;
      notes.push("Peak level is extremely close to digital full scale.");
    } else if (peakDb < -18) {
      score -= 10;
      notes.push("Peak level is unusually low.");
    }
    if (rmsDb > -5) {
      score -= 12;
      notes.push("Average level is very hot and may have limited dynamics.");
    } else if (rmsDb < -32) {
      score -= 8;
      notes.push("Average level is unusually quiet.");
    }
    if (silencePercent > 45) {
      score -= 12;
      notes.push("A large portion of the file is near silence.");
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    const unusable = decoded.duration < 0.02 || decoded.length < 2;
    const status: FileDnaAnalysis["status"] = unusable ? "failed" : score >= 85 ? "verified" : "warning";
    if (notes.length === 0) notes.push("File decoded successfully with no major technical warnings.");
    notes.push(`Detected ${musicalContent.contentType} · ${musicalContent.contentTags.join(" + ")} · ${musicalContent.contentConfidence}% classification confidence.`);
    if (musicalContent.estimatedBpm) notes.push(`Estimated tempo ${musicalContent.estimatedBpm} BPM · ${musicalContent.bpmConfidence}% confidence.`);
    if (musicalContent.estimatedKey) notes.push(`Estimated key ${musicalContent.estimatedKey} · ${musicalContent.keyConfidence}% confidence.`);

    return {
      hash,
      analysis: {
        duration: decoded.duration,
        sampleRate: decoded.sampleRate,
        channels: decoded.numberOfChannels,
        peakDb,
        rmsDb,
        silencePercent,
        clippingCount: clipping,
        score,
        grade: gradeFor(score),
        status,
        notes,
        ...musicalContent,
        modelVersion: "dna-signal-v2",
        learnedFromExamples: 0,
        confidenceSource: "signal",
      },
    };
  } finally {
    void context.close();
  }
}

function encodePreviewWav(buffer: AudioBuffer, seconds: number) {
  const channels = Math.min(2, buffer.numberOfChannels);
  const frames = Math.max(1, Math.min(buffer.length, Math.floor(seconds * buffer.sampleRate)));
  const bytesPerSample = 2;
  const dataSize = frames * channels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  writeText(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * channels * bytesPerSample, true);
  view.setUint16(32, channels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < frames; frame += 1) {
    const elapsed = frame / buffer.sampleRate;
    const pulsePosition = elapsed % 5;
    const watermark = pulsePosition < 0.18
      ? Math.sin(2 * Math.PI * 880 * elapsed) * 0.065 * Math.sin(Math.PI * (pulsePosition / 0.18))
      : 0;
    for (let channel = 0; channel < channels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[frame] * 0.82 + watermark));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += bytesPerSample;
    }
  }
  return new Blob([output], { type: "audio/wav" });
}

export async function createWatermarkedPreview(file: Blob, maxSeconds = 30) {
  const AudioContextCtor = audioContextConstructor();
  if (!AudioContextCtor) throw new Error("This browser cannot create a marketplace preview.");
  const context = new AudioContextCtor();
  try {
    const decoded = await context.decodeAudioData((await file.arrayBuffer()).slice(0));
    return encodePreviewWav(decoded, Math.min(maxSeconds, decoded.duration));
  } finally {
    void context.close();
  }
}
