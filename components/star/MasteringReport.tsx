"use client";

import { Dna, Download, Star } from "lucide-react";
import type { FileDnaAnalysis } from "../../lib/audio/file-dna";
import type { MasteringReport as Report } from "../../lib/audio/mastering-report";

function metrics(analysis: FileDnaAnalysis): [string, string][] {
  return [
    ["Star technical score", `${analysis.grade} · ${analysis.score}/100`],
    ["Verification", analysis.status],
    ["Peak", `${analysis.peakDb.toFixed(2)} dBFS`],
    ["Average level (RMS)", `${analysis.rmsDb.toFixed(2)} dBFS`],
    ["Dynamics (crest factor)", `${(analysis.peakDb - analysis.rmsDb).toFixed(2)} dB`],
    ["Near silence", `${analysis.silencePercent.toFixed(2)}%`],
    ["Clipped samples detected", String(analysis.clippingCount)],
    ["Duration", `${analysis.duration.toFixed(2)} seconds`],
    ["Sample rate", `${analysis.sampleRate / 1000} kHz`],
    ["Channels", String(analysis.channels)],
    ["Estimated tempo", analysis.estimatedBpm ? `${analysis.estimatedBpm} BPM · ${analysis.bpmConfidence}% confidence` : "Not detected"],
    ["Estimated key", analysis.estimatedKey ? `${analysis.estimatedKey} · ${analysis.keyConfidence}% confidence` : "Not detected"],
    ["Content", `${analysis.contentType} · ${analysis.contentConfidence}% confidence`],
    ["Detected elements", analysis.contentTags.join(", ")],
    ["Transients per second", analysis.transientRate.toFixed(2)],
    ["Rhythmicity", analysis.rhythmicity.toFixed(3)],
    ["Tonality", analysis.tonality.toFixed(3)],
  ];
}

export default function MasteringReport({ report }: { report: Report }) {
  const after = report.mastered.analysis;
  const originalMetrics = metrics(report.original.analysis);
  const masteredMetrics = metrics(after);

  function downloadReport() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${report.mastered.filename.replace(/\.[^.]+$/, "")}-dna-report.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="mt-4 rounded-2xl border border-sky-300/25 bg-[#09121d] p-4 text-sky-50">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-bold"><Star size={18} fill="currentColor" />CrucibleStar · Mastered version</p>
        <p className="text-lg font-black" aria-label="Mastered Star score">{after.grade} · {after.score}/100</p>
      </div>
      <p className="mt-2 text-sm text-sky-100/70">Status: {after.status}. This score measures technical file checks; it is not an artistic rating.</p>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm font-bold"><Dna size={16} className="mr-2 inline" />DNA analysis · Before and after</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-80 text-left text-sm">
            <caption className="sr-only">Original and mastered audio analysis</caption>
            <thead><tr className="border-b border-white/20"><th scope="col" className="py-2 pr-3">Measurement</th><th scope="col" className="py-2 pr-3">Original</th><th scope="col" className="py-2">Mastered</th></tr></thead>
            <tbody>{originalMetrics.map(([label, value], index) => <tr key={label} className="border-b border-white/10"><th scope="row" className="py-2 pr-3 font-medium text-sky-100/70">{label}</th><td className="py-2 pr-3">{value}</td><td className="py-2">{masteredMetrics[index][1]}</td></tr>)}</tbody>
          </table>
        </div>
        {[report.original, report.mastered].map((version, index) => <div key={index} className="mt-4 text-sm">
          <p className="font-bold">{index === 0 ? "Original" : "Mastered"} · {version.filename}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sky-100/80">{version.analysis.notes.map((note, noteIndex) => <li key={noteIndex}>{note}</li>)}</ul>
          <p className="mt-2 break-all text-xs text-sky-100/60">SHA-256: {version.hash}</p>
        </div>)}
        <p className="mt-4 text-xs text-sky-100/60">Analyzer: {after.modelVersion} · {report.analyzedAt}</p>
      </details>
      <button type="button" onClick={downloadReport} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-sky-200/30 px-3 py-2 text-sm font-bold"><Download size={16} />Download full DNA report</button>
    </div>
  );
}
