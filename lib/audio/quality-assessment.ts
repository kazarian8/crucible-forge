export type QualityFinding = { check: string; severity: "review" | "info"; detail: string; timeSeconds?: number };
export type QualityAssessment = {
  version: "quality-measurements-v1";
  score: null;
  calibration: "not-calibrated";
  coverage: "all-decoded-samples";
  samplePeakDbfs: number;
  rmsDbfs: number;
  crestDb: number;
  clippingSamples: number;
  dcOffset: number;
  quietSectionRmsDbfs: number | null;
  stereoCorrelation: number | null;
  channelBalanceDb: number | null;
  bands: { lowPercent: number; midPercent: number; highPercent: number };
  findings: QualityFinding[];
  limitations: string[];
};
export type QualityComparison = { peakChangeDb: number; rmsChangeDb: number; crestChangeDb: number; clippingSampleChange: number; newReviewChecks: string[]; resolvedReviewChecks: string[]; verdict: string };
type Pcm = Pick<AudioBuffer, "length" | "sampleRate" | "numberOfChannels" | "getChannelData">;
const db = (value: number) => 20 * Math.log10(Math.max(1e-9, value));

export async function assessAudioQuality(audio: Pcm): Promise<QualityAssessment> {
  const channels = Array.from({ length: audio.numberOfChannels }, (_, c) => audio.getChannelData(c));
  const block = Math.max(1, Math.round(audio.sampleRate * .1));
  const energies = channels.map(() => 0), sums = channels.map(() => 0);
  const low = channels.map(() => 0), wide = channels.map(() => 0);
  const aLow = 1 - Math.exp(-2 * Math.PI * 250 / audio.sampleRate);
  const aWide = 1 - Math.exp(-2 * Math.PI * 4000 / audio.sampleRate);
  let peak = 0, clipping = 0, cross = 0, lowEnergy = 0, midEnergy = 0, highEnergy = 0;
  const windows: number[] = [], findings: QualityFinding[] = [];
  let firstClip: number | null = null, firstPhase: number | null = null;
  for (let offset = 0; offset < audio.length; offset += block) {
    let energy = 0, leftEnergy = 0, rightEnergy = 0, windowCross = 0;
    const end = Math.min(audio.length, offset + block);
    for (let i = offset; i < end; i++) {
      for (let c = 0; c < channels.length; c++) {
        const value = channels[c][i];
        if (!Number.isFinite(value)) throw new Error("The audio contains invalid samples. Re-export the source file.");
        peak = Math.max(peak, Math.abs(value));
        if (Math.abs(value) >= .999) { clipping++; firstClip ??= i / audio.sampleRate; }
        energies[c] += value * value; sums[c] += value; energy += value * value;
        low[c] += aLow * (value - low[c]); wide[c] += aWide * (value - wide[c]);
        lowEnergy += low[c] ** 2; midEnergy += (wide[c] - low[c]) ** 2; highEnergy += (value - wide[c]) ** 2;
      }
      if (channels.length === 2) {
        const l = channels[0][i], r = channels[1][i];
        cross += l * r; windowCross += l * r; leftEnergy += l * l; rightEnergy += r * r;
      }
    }
    const level = Math.sqrt(energy / Math.max(1, (end - offset) * channels.length));
    windows.push(db(level));
    if (channels.length === 2 && leftEnergy > 1e-8 && rightEnergy > 1e-8 && windowCross / Math.sqrt(leftEnergy * rightEnergy) < -.5) firstPhase ??= offset / audio.sampleRate;
    if (offset % (block * 20) === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const total = energies.reduce((a, b) => a + b, 0);
  const rms = Math.sqrt(total / Math.max(1, audio.length * channels.length));
  const dcOffset = Math.max(0, ...sums.map((sum) => Math.abs(sum / Math.max(1, audio.length))));
  const correlation = channels.length === 2 && energies[0] * energies[1] > 1e-16 ? Math.max(-1, Math.min(1, cross / Math.sqrt(energies[0] * energies[1]))) : null;
  const balance = channels.length === 2 && energies[0] > 1e-16 && energies[1] > 1e-16 ? 10 * Math.log10(energies[0] / energies[1]) : null;
  const crest = rms > 1e-9 ? db(peak) - db(rms) : 0;
  const audibleWindows = windows.filter((value) => value > -90).sort((a, b) => a - b);
  const quiet = audibleWindows.length >= 10 ? audibleWindows[Math.floor((audibleWindows.length - 1) * .1)] : null;
  if (firstClip !== null) findings.push({ check: "clipping", severity: "review", detail: `${clipping} samples reach or approach digital full scale. Audition for clipping.`, timeSeconds: firstClip });
  if (firstPhase !== null) findings.push({ check: "phase", severity: "review", detail: "A stereo section has strong opposing polarity. Check the mix in mono for cancellation.", timeSeconds: firstPhase });
  if (dcOffset > .01) findings.push({ check: "dc", severity: "review", detail: `DC offset reaches ${(dcOffset * 100).toFixed(2)}% of full scale.` });
  if (Math.abs(balance ?? 0) > 6) findings.push({ check: "balance", severity: "review", detail: `Left/right energy differs by ${Math.abs(balance!).toFixed(1)} dB. This may be intentional panning.` });
  if (channels.length === 2 && total > 1e-12 && (energies[0] < 1e-16 || energies[1] < 1e-16)) findings.push({ check: "balance", severity: "review", detail: "One stereo channel has no measurable signal." });
  if (rms > 1e-5 && crest < 4) findings.push({ check: "dynamics", severity: "review", detail: `Peak-to-average range is only ${crest.toFixed(1)} dB. Heavy limiting or a sustained tone may explain this; listen before judging.` });
  if (quiet !== null) findings.push({ check: "quiet-sections", severity: "info", detail: `Quieter 100 ms sections measure about ${quiet.toFixed(1)} dBFS RMS. This includes musical content and is not a measured noise floor.` });
  const bandTotal = Math.max(1e-20, lowEnergy + midEnergy + highEnergy);
  return { version: "quality-measurements-v1", score: null, calibration: "not-calibrated", coverage: "all-decoded-samples", samplePeakDbfs: db(peak), rmsDbfs: db(rms), crestDb: crest, clippingSamples: clipping, dcOffset, quietSectionRmsDbfs: quiet, stereoCorrelation: correlation, channelBalanceDb: balance,
    bands: { lowPercent: lowEnergy / bandTotal * 100, midPercent: midEnergy / bandTotal * 100, highPercent: highEnergy / bandTotal * 100 }, findings,
    limitations: ["No calibrated sound-quality percentage is available. Passing technical checks does not mean a perfect recording.", "RMS is not integrated LUFS. Sample peak is not oversampled true peak.", "Background noise, baked-in distortion, vocal clarity, and aesthetic mix balance need a validated perceptual model or listening review.", "Broad tonal bands use approximate filters. They describe this file, not an ideal genre-independent tonal balance."] };
}

export function compareAudioQuality(before: QualityAssessment, after: QualityAssessment): QualityComparison {
  const oldChecks = new Set(before.findings.filter((finding) => finding.severity === "review").map((finding) => finding.check));
  const newChecks = new Set(after.findings.filter((finding) => finding.severity === "review").map((finding) => finding.check));
  return { peakChangeDb: after.samplePeakDbfs - before.samplePeakDbfs, rmsChangeDb: after.rmsDbfs - before.rmsDbfs, crestChangeDb: after.crestDb - before.crestDb, clippingSampleChange: after.clippingSamples - before.clippingSamples,
    newReviewChecks: [...newChecks].filter((check) => !oldChecks.has(check)), resolvedReviewChecks: [...oldChecks].filter((check) => !newChecks.has(check)),
    verdict: "Measured changes only. Louder audio or fewer technical warnings do not establish better sound quality; audition both versions." };
}
