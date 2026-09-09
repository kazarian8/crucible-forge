import type { QualityAssessment, QualityComparison } from "../../lib/audio/quality-assessment";

export default function QualityReport({ quality, comparison }: { quality: QualityAssessment; comparison?: QualityComparison | null }) {
  return <section className="mt-4 space-y-3 rounded-xl border border-sky-300/20 bg-black/20 p-4 text-sm">
    <h3 className="font-bold text-sky-200">Sound-quality assessment</h3>
    <p className="text-white/70">Quality grade: <strong>Not calibrated</strong>. Technical verification does not certify perfect sound.</p>
    <details><summary className="cursor-pointer text-sky-200">View measurements and before/after details</summary>
    <dl className="grid grid-cols-2 gap-3 text-white/70">
      <div><dt>Sample peak</dt><dd>{quality.samplePeakDbfs.toFixed(1)} dBFS</dd></div>
      <div><dt>Average RMS</dt><dd>{quality.rmsDbfs.toFixed(1)} dBFS</dd></div>
      <div><dt>Peak-to-average range</dt><dd>{quality.crestDb.toFixed(1)} dB</dd></div>
      <div><dt>Near-full-scale samples</dt><dd>{quality.clippingSamples}</dd></div>
      <div><dt>Stereo correlation</dt><dd>{quality.stereoCorrelation?.toFixed(2) ?? "Not measurable"}</dd></div>
      <div><dt>Approximate low / mid / high energy</dt><dd>{quality.bands.lowPercent.toFixed(0)} / {quality.bands.midPercent.toFixed(0)} / {quality.bands.highPercent.toFixed(0)}%</dd></div>
    </dl>
    {quality.findings.map((finding, i) => <p key={`${finding.check}-${i}`} className={finding.severity === "review" ? "text-amber-200" : "text-white/60"}><strong>{finding.severity === "review" ? "Review" : "Measured"}{finding.timeSeconds != null ? ` at ${finding.timeSeconds.toFixed(2)}s` : ""}:</strong> {finding.detail}</p>)}
    {!quality.findings.some((finding) => finding.severity === "review") ? <p className="text-white/60">No review flags from these checks. Unmeasured problems may still be present.</p> : null}
    {comparison ? <div className="space-y-2 border-t border-white/15 pt-3"><h4 className="font-bold">Original → saved version</h4><p className="text-white/70">Peak {comparison.peakChangeDb.toFixed(1)} dB · RMS {comparison.rmsChangeDb.toFixed(1)} dB · peak-to-average range {comparison.crestChangeDb.toFixed(1)} dB · near-full-scale samples {comparison.clippingSampleChange > 0 ? "+" : ""}{comparison.clippingSampleChange}</p><p className="text-amber-200">New review flags: {comparison.newReviewChecks.join(", ") || "none"}</p><p className="text-white/70">Resolved flags: {comparison.resolvedReviewChecks.join(", ") || "none"}</p><p className="text-white/60">{comparison.verdict}</p></div> : null}
    <details className="text-white/55"><summary className="cursor-pointer">Coverage and limitations</summary><p className="mt-2">Every decoded sample was scanned.</p>{quality.limitations.map((text) => <p key={text} className="mt-2">{text}</p>)}</details>
    </details>
  </section>;
}
