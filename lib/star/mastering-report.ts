export type SignalReport = {
  duration: number; sampleRate: number; channels: number;
  peakDb: number; rmsDb: number; crestDb: number;
  clippingCount: number; silencePercent: number;
  wave: number[]; levels: number[];
};
export type MasteringReport = {
  version: 1; title: string; beforeHash: string; afterHash: string;
  before: SignalReport; after: SignalReport;
};
const db = (value: number) => Math.max(-120, 20 * Math.log10(Math.max(value, 0.000001)));

// Scan every channel and sample; both plots use fixed scales, never individual normalization.
export function measureSignal(buffer: AudioBuffer): SignalReport {
  const buckets = 240;
  const wave = Array<number>(buckets).fill(0);
  const energy = Array<number>(buckets).fill(0);
  const counts = Array<number>(buckets).fill(0);
  let peak = 0, squares = 0, clippingCount = 0, silent = 0;
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      const value = Math.abs(data[i]);
      const bucket = Math.min(buckets - 1, Math.floor(i * buckets / data.length));
      peak = Math.max(peak, value); squares += value * value;
      if (value >= 0.999) clippingCount++;
      if (value < 0.001) silent++;
      wave[bucket] = Math.max(wave[bucket], value);
      energy[bucket] += value * value; counts[bucket]++;
    }
  }
  const total = Math.max(1, buffer.length * buffer.numberOfChannels);
  const peakDb = db(peak), rmsDb = db(Math.sqrt(squares / total));
  return { duration: buffer.duration, sampleRate: buffer.sampleRate, channels: buffer.numberOfChannels,
    peakDb, rmsDb, crestDb: peakDb - rmsDb, clippingCount, silencePercent: silent / total * 100,
    wave, levels: energy.map((value, i) => db(Math.sqrt(value / Math.max(1, counts[i])))) };
}
export function explainMastering(report: MasteringReport): string[] {
  const b = report.before, a = report.after;
  const level = a.rmsDb - b.rmsDb, crest = a.crestDb - b.crestDb;
  return [
    `Average signal level ${level >= 0 ? "rose" : "fell"} by ${Math.abs(level).toFixed(1)} dB (${b.rmsDb.toFixed(1)} to ${a.rmsDb.toFixed(1)} dBFS RMS). Louder alone does not mean better.`,
    `Sample peak moved from ${b.peakDb.toFixed(1)} to ${a.peakDb.toFixed(1)} dBFS, leaving ${Math.max(0, -a.peakDb).toFixed(1)} dB of sample headroom.`,
    `Crest factor ${crest >= 0 ? "increased" : "decreased"} by ${Math.abs(crest).toFixed(1)} dB. ${crest < -1 ? "The master is denser; compare whether the transients still have the punch you want." : "Listen to the attacks and quieter details before choosing your version."}`,
    `${b.clippingCount.toLocaleString("en-US")} original and ${a.clippingCount.toLocaleString("en-US")} mastered samples reached the near-full-scale threshold. Lowering peaks cannot repair distortion already recorded into the source.`,
    "These are technical signal measurements, not proof of artistic quality, copyright ownership, or a guaranteed best master. LUFS, true peak, and loudness range are not measured in this report.",
  ];
}
export const reportRows = (r: SignalReport): [string, string][] => [
  ["Sample peak", `${r.peakDb.toFixed(2)} dBFS`], ["Average signal level", `${r.rmsDb.toFixed(2)} dBFS RMS`],
  ["Crest factor", `${r.crestDb.toFixed(2)} dB`], ["Near-full-scale samples (≥ 0.999)", String(r.clippingCount)],
  ["Samples below −60 dBFS", `${r.silencePercent.toFixed(2)}%`], ["Duration", `${r.duration.toFixed(2)} seconds`],
  ["Decoded sample rate", `${r.sampleRate} Hz`], ["Channels", String(r.channels)],
];
export function validReport(value: unknown): value is MasteringReport {
  if (!value || typeof value !== "object") return false;
  const r = value as MasteringReport;
  if (r.version !== 1 || typeof r.title !== "string" || !r.title.trim() || r.title.length > 160 || !/^[a-f0-9]{64}$/.test(r.beforeHash) || !/^[a-f0-9]{64}$/.test(r.afterHash)) return false;
  return [r.before, r.after].every(s => s &&
    [s.duration,s.sampleRate,s.channels,s.peakDb,s.rmsDb,s.crestDb,s.clippingCount,s.silencePercent].every(Number.isFinite) &&
    s.duration > 0 && s.duration <= 86400 && s.sampleRate >= 8000 && s.sampleRate <= 384000 && Number.isInteger(s.channels) && s.channels > 0 && s.channels <= 32 &&
    s.peakDb >= -120 && s.peakDb <= 24 && s.rmsDb >= -120 && s.rmsDb <= 24 && s.crestDb >= 0 && s.crestDb <= 144 &&
    Number.isInteger(s.clippingCount) && s.clippingCount >= 0 && s.silencePercent >= 0 && s.silencePercent <= 100 &&
    Array.isArray(s.wave) && s.wave.length === 240 && s.wave.every(n=>Number.isFinite(n) && n >= 0 && n <= 16) &&
    Array.isArray(s.levels) && s.levels.length === 240 && s.levels.every(n=>Number.isFinite(n) && n >= -120 && n <= 24));
}
const escape = (s: string) => s.replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export function reportEmailHtml(r: MasteringReport): string {
  return `<div style="font-family:Arial,sans-serif;color:#17202b;max-width:700px;margin:auto"><h1>CrucibleStar · Before / After</h1><h2>${escape(r.title)}</h2><p>Your original and finished master were measured separately. Your two full-page visual reports are attached.</p><table cellpadding="10" style="border-collapse:collapse;width:100%"><tr><th align="left">Measurement</th><th>Before</th><th>After</th></tr>${reportRows(r.before).map(([label,value],i)=>`<tr><td style="border-bottom:1px solid #ddd">${escape(label)}</td><td>${escape(value)}</td><td>${escape(reportRows(r.after)[i][1])}</td></tr>`).join("")}</table><h2>What changed</h2>${explainMastering(r).map(t=>`<p>${escape(t)}</p>`).join("")}<p>Compare both versions in Forge before confirming the one you want to keep.</p><p style="font-size:12px">Analysis source: the uploading browser, scanning all decoded samples. Original SHA-256: ${r.beforeHash}<br>Master SHA-256: ${r.afterHash}</p></div>`;
}
