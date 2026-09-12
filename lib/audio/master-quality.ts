import type { FileDnaAnalysis } from "./file-dna";

type Measurement = Pick<FileDnaAnalysis, "duration" | "channels" | "sampleRate" | "score" | "peakDb" | "rmsDb" | "clippingCount" | "status">;
export function compareMasterQuality(before: Measurement, after: Measurement) {
  const reasons: string[] = [];
  const finite = [before, after].every((m) => [m.duration, m.channels, m.sampleRate, m.score, m.peakDb, m.rmsDb, m.clippingCount].every(Number.isFinite) && m.duration > 0 && m.channels > 0 && m.sampleRate > 0);
  if (!finite) reasons.push("The comparison contains incomplete measurements.");
  if (after.status === "failed") reasons.push("The master failed its audio checks.");
  if (after.score < before.score) reasons.push("The technical score decreased.");
  const clipRate = (m: Measurement) => m.clippingCount / Math.max(1, Math.round(m.duration * m.sampleRate) * m.channels);
  if (clipRate(after) > clipRate(before)) reasons.push("The proportion of near-clipped samples increased.");
  if (Math.abs(after.duration - before.duration) > Math.max(0.1, before.duration * 0.001)) reasons.push("Track length changed; check for lost audio.");
  if (after.channels !== before.channels) reasons.push("Channel count changed; check the stereo image.");
  if (after.peakDb - after.rmsDb < before.peakDb - before.rmsDb - 3) reasons.push("Crest factor fell by over 3 dB; listen for flattened transients.");
  const outcome = reasons.length ? "review_required" : after.score > before.score ? "technical_improvement" : "no_measured_improvement";
  if (outcome === "no_measured_improvement") reasons.push("No technical score improvement was measured. Compare by ear at matched playback levels.");
  return { version: "master-quality-v1", outcome, reviewRequired: outcome !== "technical_improvement", scoreDelta: finite ? after.score - before.score : null, reasons, before, after, limitation: "Browser technical checks are advisory. They do not establish perceived quality, true peak, or professional recording quality." };
}
export type MasterQuality = ReturnType<typeof compareMasterQuality>;
