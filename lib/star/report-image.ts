import { explainMastering, reportRows, type MasteringReport } from "./mastering-report";

// Full-page PNGs remain readable in mail clients without SVG or external image support.
export function renderReportImage(report: MasteringReport, side: "before" | "after"): string {
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 1700;
  const context = canvas.getContext("2d"); if (!context) throw new Error("Report image could not be created.");
  const c: CanvasRenderingContext2D = context;
  const data = report[side], color = side === "before" ? "#60a5fa" : "#fb923c";
  c.fillStyle = "#0b101b"; c.fillRect(0,0,1200,1700);
  const line = (text: string, x: number, y: number, size=24, fill="#dbe4f1") => { c.fillStyle=fill;c.font=`${size}px Arial`;c.fillText(text,x,y); };
  line("CRUCIBLESTAR  /  MASTERING DNA",64,75,24,color);
  line(side === "before" ? "BEFORE · ORIGINAL" : "AFTER · MASTER",64,150,48);
  let y=205;
  function paragraph(text: string, size=23) {
    c.font=`${size}px Arial`; let current="";
    for(const word of text.split(" ")) { if(c.measureText(`${current} ${word}`).width>1060) { line(current,64,y,size); y+=size+11; current=word; } else current=current ? `${current} ${word}` : word; }
    if(current) {line(current,64,y,size);y+=size+11;}
  }
  paragraph(report.title.slice(0,160),30); y+=15;
  line("Waveform · fixed ±1 amplitude · full track",64,y,23);y+=25;
  c.fillStyle="#121e30";c.fillRect(64,y,1070,180);c.strokeStyle=color;c.lineWidth=3;
  data.wave.forEach((v,i)=> {const x=66+i*1066/239;const h=Math.min(1,v)*85;c.beginPath();c.moveTo(x,y+90-h);c.lineTo(x,y+90+h);c.stroke();});y+=225;
  line("Signal level over time · RMS · fixed −60 to 0 dBFS",64,y,23);y+=25;
  c.fillStyle="#121e30";c.fillRect(64,y,1070,130);c.beginPath();c.strokeStyle=color;
  data.levels.forEach((v,i)=>{const x=64+i*1070/239,py=y+130-Math.max(0,Math.min(60,v+60))/60*130;if(i===0)c.moveTo(x,py);else c.lineTo(x,py);});c.stroke();y+=175;
  for(const [label,value] of reportRows(data)){line(label,64,y,23,"#9eafc6");line(value,790,y,23);y+=40;}
  y+=20;line("WHAT CHANGED",64,y,24,color);y+=42;
  for(const text of explainMastering(report).slice(0,4)){paragraph(text,21);y+=10;}
  paragraph("Sample measurements only. LUFS, true peak and loudness range are not measured. Technical results do not guarantee artistic quality. Listen before choosing.",19);
  line(`SHA-256: ${side === "before" ? report.beforeHash : report.afterHash}`,64,1650,17,"#9eafc6");
  return canvas.toDataURL("image/png").split(",")[1];
}
