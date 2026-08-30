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
};

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
