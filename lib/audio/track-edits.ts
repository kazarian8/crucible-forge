/** Offline clip edits. Inputs are immutable so the sequencer can undo every edit. */
export type AudioEdit = "stretch" | "transpose" | "reverse" | "denoise";
type Progress = (fraction: number) => void;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

export async function processTrackAudio(source: AudioBuffer, start: number, end: number, edit: AudioEdit, amount: number, signal?: AbortSignal, progress: Progress = () => {}) {
  if (![start, end, amount].every(Number.isFinite)) throw new Error("Enter a valid edit value.");
  if (edit === "stretch" && (amount < 50 || amount > 200)) throw new Error("Choose a length between 50% and 200%.");
  if (edit === "transpose" && (amount < -12 || amount > 12)) throw new Error("Choose between -12 and +12 semitones.");
  if (edit === "denoise" && (amount < 0 || amount > 100)) throw new Error("Choose noise reduction between 0 and 100%.");
  const first = Math.max(0, Math.round(start * source.sampleRate));
  const last = Math.min(source.length, Math.round(end * source.sampleRate));
  if (last <= first) throw new Error("This clip has no audio to edit.");
  const channels = Array.from({ length: source.numberOfChannels }, (_, channel) => source.getChannelData(channel).subarray(first, last));
  const length = last - first;
  const outputLength = edit === "stretch" ? Math.max(1, Math.round(length * amount / 100)) : length;
  if (outputLength * channels.length * 4 > 192 * 1024 * 1024) throw new Error("Trim this clip before processing it on this device.");
  const output = new AudioBuffer({ length: outputLength, numberOfChannels: channels.length, sampleRate: source.sampleRate });
  const check = async (fraction: number) => { signal?.throwIfAborted(); progress(fraction); await pause(); signal?.throwIfAborted(); };
  await check(0);
  if ((edit === "stretch" && amount === 100) || (edit === "transpose" && amount === 0)) {
    for (let c = 0; c < channels.length; c++) output.getChannelData(c).set(channels[c]);
  } else if (edit === "reverse") {
    for (let c = 0; c < channels.length; c++) {
      const target = output.getChannelData(c);
      for (let offset = 0; offset < length; offset += 65536) {
        for (let i = offset; i < Math.min(length, offset + 65536); i++) target[i] = channels[c][length - i - 1];
        await check((c + offset / length) / channels.length);
      }
    }
  } else if (edit === "denoise") {
    const { default: FFT } = await import("fft.js");
    const size = 2048, hop = 512, bins = size / 2 + 1;
    const fft = new FFT(size);
    const window = Float32Array.from({ length: size }, (_, i) => Math.sin(Math.PI * (i + 0.5) / size));
    const frame = new Float32Array(size);
    const spectra = channels.map(() => new Float64Array(size * 2));
    const inverse = new Float64Array(size * 2);
    const noise = new Float64Array(bins);
    // Estimate a stationary noise floor from the quietest 20% of sampled windows.
    const candidates: { offset: number; energy: number }[] = [];
    for (let offset = 0; offset < length; offset += Math.max(hop, Math.floor(length / 128))) {
      let energy = 0;
      for (const channel of channels) for (let i = offset; i < Math.min(length, offset + size); i++) energy += channel[i] ** 2;
      candidates.push({ offset, energy });
    }
    const quiet = candidates.sort((a, b) => a.energy - b.energy).slice(0, Math.max(1, Math.floor(candidates.length * 0.2)));
    for (const { offset } of quiet) {
      for (const channel of channels) {
        for (let i = 0; i < size; i++) frame[i] = (channel[offset + i] ?? 0) * window[i];
        fft.realTransform(spectra[0], frame);
        for (let k = 0; k < bins; k++) noise[k] += (spectra[0][2 * k] ** 2 + spectra[0][2 * k + 1] ** 2) / (quiet.length * channels.length);
      }
    }
    const weights = new Float32Array(length);
    const gains = new Float64Array(bins).fill(1);
    const power = new Float64Array(bins);
    let count = 0;
    for (let offset = -size + hop; offset < length; offset += hop) {
      power.fill(0);
      for (let c = 0; c < channels.length; c++) {
        for (let i = 0; i < size; i++) frame[i] = (channels[c][offset + i] ?? 0) * window[i];
        fft.realTransform(spectra[c], frame);
        for (let k = 0; k < bins; k++) power[k] += (spectra[c][2 * k] ** 2 + spectra[c][2 * k + 1] ** 2) / channels.length;
      }
      for (let k = 0; k < bins; k++) {
        const wanted = Math.max(0.12, Math.sqrt(Math.max(0, 1 - (amount / 100) * 1.8 * noise[k] / Math.max(1e-20, power[k]))));
        gains[k] = gains[k] * 0.65 + wanted * 0.35;
      }
      for (let c = 0; c < channels.length; c++) {
        for (let k = 0; k < bins; k++) {
          const gain = (gains[Math.max(0, k - 1)] + 2 * gains[k] + gains[Math.min(bins - 1, k + 1)]) / 4;
          spectra[c][2 * k] *= gain; spectra[c][2 * k + 1] *= gain;
        }
        fft.completeSpectrum(spectra[c]);
        fft.inverseTransform(inverse, spectra[c]);
        const target = output.getChannelData(c);
        for (let i = 0; i < size; i++) {
          const at = offset + i;
          if (at < 0 || at >= length) continue;
          target[at] += inverse[2 * i] * window[i];
          if (c === 0) weights[at] += window[i] ** 2;
        }
      }
      if (++count % 16 === 0) await check(Math.max(0, offset / length));
    }
    for (let c = 0; c < channels.length; c++) {
      const target = output.getChannelData(c);
      for (let i = 0; i < length; i++) target[i] /= Math.max(1e-12, weights[i]);
    }
  } else {
    const { SoundTouch, Stretch } = await import("@soundtouchjs/core");
    for (let c = 0; c < channels.length; c += 2) {
      const engine = edit === "stretch" ? new Stretch({ sampleRate: source.sampleRate, createBuffers: true }) : new SoundTouch({ sampleRate: source.sampleRate });
      if (engine instanceof Stretch) engine.tempo = 100 / amount;
      else engine.pitchSemitones = amount;
      const inputBuffer = engine.inputBuffer, outputBuffer = engine.outputBuffer;
      if (!inputBuffer || !outputBuffer) throw new Error("The audio processor could not initialize.");
      const input = new Float32Array(4096 * 2), extracted = new Float32Array(4096 * 2);
      const left = channels[c], right = channels[c + 1] ?? left;
      const outLeft = output.getChannelData(c), outRight = c + 1 < channels.length ? output.getChannelData(c + 1) : null;
      let written = 0, position = 0;
      // Padding drains buffered tail audio; output is cropped to the requested duration.
      while (written < outputLength && position < length + source.sampleRate * 2) {
        input.fill(0);
        for (let i = 0; i < 4096 && position + i < length; i++) { input[2 * i] = left[position + i]; input[2 * i + 1] = right[position + i]; }
        inputBuffer.putSamples(input); engine.process(); position += 4096;
        while (outputBuffer.frameCount > 0 && written < outputLength) {
          const frames = Math.min(4096, outputBuffer.frameCount, outputLength - written);
          outputBuffer.extract(extracted, 0, frames); outputBuffer.receive(frames);
          for (let i = 0; i < frames; i++) { outLeft[written + i] = extracted[2 * i]; if (outRight) outRight[written + i] = extracted[2 * i + 1]; }
          written += frames;
        }
        await check((c + 2 * written / outputLength) / (channels.length + channels.length % 2));
      }
      engine.clear();
      if (written < outputLength) throw new Error("The audio processor could not finish this clip. Try a smaller change.");
    }
  }
  progress(1);
  return output;
}
