"use client";
import { explainMastering, reportRows, type MasteringReport } from "../../lib/star/mastering-report";
import { renderReportImage } from "../../lib/star/report-image";
export default function MasteringComparisonReport({report}:{report:MasteringReport}) {
  function download(side:"before"|"after") {const a=document.createElement("a");a.href=`data:image/png;base64,${renderReportImage(report,side)}`;a.download=`crucible-star-${side}.png`;a.click();}
  return <section className="mt-6 rounded-2xl border border-sky-300/25 bg-[#0b101b] p-5" aria-labelledby="mastering-report-title">
    <h2 id="mastering-report-title" className="text-2xl font-black">CrucibleStar · Before / After</h2>
    <p className="mt-2 text-sm text-white/60">Both versions measured independently. Waveforms share the same scale.</p>
    <div className="mt-5 grid gap-4 md:grid-cols-2">{(["before","after"] as const).map(side=><div key={side} className="min-w-0 rounded-xl bg-white/5 p-4">
      <h3 className="text-lg font-bold">{side==="before"?"Before · Original":"After · Master"}</h3>
      <svg viewBox="0 0 480 150" role="img" aria-label={`${side} waveform on a fixed plus or minus one amplitude scale`} className="mt-3 w-full"><path stroke={side==="before"?"#60a5fa":"#fb923c"} d={report[side].wave.map((v,i)=>`M${i*2} ${75-Math.min(1,v)*70}v${Math.min(1,v)*140}`).join(" ")} /></svg>
      <p className="text-sm text-white/60">Signal level over time · RMS · −60 to 0 dBFS</p>
      <svg viewBox="0 0 480 100" role="img" aria-label={`${side} RMS signal level over the full track`} className="w-full"><polyline fill="none" stroke={side==="before"?"#60a5fa":"#fb923c"} strokeWidth="2" points={report[side].levels.map((v,i)=>`${i*2},${100-Math.max(0,Math.min(60,v+60))/60*100}`).join(" ")} /></svg>
      <button onClick={()=>download(side)} type="button" className="mt-3 rounded-xl border border-white/20 px-3 py-2 text-sm">Download full-page report</button>
    </div>)}</div>
    <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th className="p-2">Measurement</th><th>Before</th><th>After</th></tr></thead><tbody>{reportRows(report.before).map(([label,value],i)=><tr key={label} className="border-t border-white/10"><th className="p-2 font-normal">{label}</th><td>{value}</td><td>{reportRows(report.after)[i][1]}</td></tr>)}</tbody></table></div>
    <h3 className="mt-5 text-lg font-bold">What changed and what to listen for</h3><ul className="mt-3 space-y-3 text-sm leading-6 text-white/75">{explainMastering(report).map(t=><li key={t}>{t}</li>)}</ul>
  </section>;
}
