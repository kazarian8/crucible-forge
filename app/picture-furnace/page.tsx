"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { Download, ImageIcon, Loader2, Redo2, RotateCcw, Sparkles, Undo2, Upload, WandSparkles } from "lucide-react";

const COMMANDS = [
  "Enhance Natural", "Enhance Blurry Image", "Enhance Beauty", "Remove Background",
  "Replace [item] with [color + item]", "Remove [item]", "Add [item]",
  "Change Color of [item] to [color]", "Change Background to [description]", "Blur Background",
  "Restore Photo", "Colorize Photo", "Sharpen", "Denoise", "Brighten", "Fix Lighting", "Fix Color",
  "Crop [ratio]", "Expand Image [direction/ratio]", "Straighten", "Rotate [left/right]", "Flip [horizontal/vertical]",
  "Add Text [text]", "Remove Text", "Add Logo [logo]", "Add Sticker [sticker]",
  "Black & White", "Vivid", "Warm", "Cool", "Noir", "Pencil Drawing", "Oil Painting",
];

const PRIMARY = ["Enhance Natural", "Enhance Blurry Image", "Enhance Beauty", "Remove Background"];

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PictureFurnacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [original, setOriginal] = useState<string | null>(null);
  const [command, setCommand] = useState("Enhance Natural");
  const [customPrompt, setCustomPrompt] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const image = historyIndex >= 0 ? history[historyIndex] : null;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? COMMANDS.filter((item) => item.toLowerCase().includes(q)) : COMMANDS;
  }, [query]);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 12 * 1024 * 1024) return setError("Maximum upload is 12 MB.");
    const data = await readAsDataUrl(file);
    setOriginal(data);
    setHistory([data]);
    setHistoryIndex(0);
    setError("");
  }

  function pushHistory(next: string) {
    const base = history.slice(0, historyIndex + 1);
    setHistory([...base, next]);
    setHistoryIndex(base.length);
  }

  async function forge() {
    if (!image || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/picture-furnace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, command, customPrompt: customPrompt || command }),
      });
      const data = await response.json();
      if (!response.ok || !data.image) throw new Error(data.error || "Image edit failed.");
      pushHistory(data.image);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image edit failed.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (!original) return;
    setHistory([original]);
    setHistoryIndex(0);
    setError("");
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = "crucible-picture.png";
    a.click();
  }

  return (
    <main className="min-h-screen bg-[#070605] px-4 py-8 text-white sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Picture Furnace</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Forge the image. Keep control.</h1>
            <p className="mt-2 text-sm text-white/45">Every edit is non-destructive. Undo, redo, or reset to the original anytime.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setHistoryIndex((i) => Math.max(0, i - 1))} disabled={historyIndex <= 0 || busy} className="rounded-xl border border-white/10 p-3 disabled:opacity-25" title="Undo"><Undo2 size={19}/></button>
            <button onClick={() => setHistoryIndex((i) => Math.min(history.length - 1, i + 1))} disabled={historyIndex < 0 || historyIndex >= history.length - 1 || busy} className="rounded-xl border border-white/10 p-3 disabled:opacity-25" title="Redo"><Redo2 size={19}/></button>
            <button onClick={reset} disabled={!original || busy} className="rounded-xl border border-white/10 p-3 disabled:opacity-25" title="Reset to original"><RotateCcw size={19}/></button>
            <button onClick={download} disabled={!image || busy} className="rounded-xl border border-white/10 p-3 disabled:opacity-25" title="Save image"><Download size={19}/></button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="min-h-[520px] overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025]">
            {!image ? (
              <button onClick={() => inputRef.current?.click()} className="grid min-h-[520px] w-full place-items-center p-8 text-center">
                <div><div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-500/10 text-orange-300"><Upload size={28}/></div><p className="mt-5 text-xl font-black">Load an image</p><p className="mt-2 text-sm text-white/40">PNG, JPEG or WebP · up to 12 MB</p></div>
              </button>
            ) : (
              <div className="relative grid min-h-[520px] place-items-center bg-black/30 p-3 sm:p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Picture Furnace preview" className="max-h-[72vh] max-w-full rounded-xl object-contain shadow-2xl" />
                {busy && <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm"><div className="text-center"><Loader2 className="mx-auto animate-spin text-orange-300" size={34}/><p className="mt-3 font-black">Forging image…</p></div></div>}
              </div>
            )}
          </div>

          <aside className="rounded-[28px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="flex items-center gap-2 text-orange-300"><WandSparkles size={20}/><p className="font-black">Commands</p></div>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type: en, re, color…" className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/25 focus:border-orange-300/50" />

            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRIMARY.map((item) => <button key={item} onClick={() => { setCommand(item); setCustomPrompt(""); }} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold ${command === item ? "border-orange-300/60 bg-orange-500/10 text-orange-200" : "border-white/10 bg-white/[0.02] text-white/65"}`}>{item}</button>)}
            </div>

            <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-1">
              {filtered.map((item) => <button key={item} onClick={() => { setCommand(item); setCustomPrompt(item); }} className="block w-full rounded-lg px-3 py-2 text-left text-xs text-white/55 hover:bg-white/5 hover:text-white">{item}</button>)}
            </div>

            <label className="mt-4 block text-xs font-bold text-white/45">AI edit box</label>
            <textarea value={customPrompt} onChange={(e) => setCustomPrompt(e.target.value)} placeholder="Example: Replace beanie with black Supreme beanie with red logo" rows={4} className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-orange-300/50" />
            <p className="mt-2 text-[11px] leading-5 text-white/30">Rule: change only what you request. Preserve everything else as closely as possible.</p>

            <button onClick={forge} disabled={!image || busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-3.5 font-black text-black disabled:cursor-not-allowed disabled:opacity-30"><Sparkles size={18}/>{busy ? "Forging…" : `Forge · ${command}`}</button>
            <button onClick={() => inputRef.current?.click()} disabled={busy} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60"><ImageIcon size={17}/>Load different image</button>
            {command === "Enhance Blurry Image" && <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/[0.04] p-3 text-[11px] leading-5 text-amber-100/55">AI reconstruction can infer missing detail. Use Enhance Natural when strict fidelity matters.</p>}
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs text-red-200">{error}</p>}
          </aside>
        </div>

        <input ref={inputRef} onChange={onUpload} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
      </section>
    </main>
  );
}
