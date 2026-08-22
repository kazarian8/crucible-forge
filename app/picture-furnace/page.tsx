"use client";

import { ChangeEvent, KeyboardEvent, useRef, useState } from "react";
import {
  Download,
  Eye,
  ImageIcon,
  Loader2,
  Redo2,
  RotateCcw,
  Undo2,
  Upload,
} from "lucide-react";
import { getPictureActionPrice } from "../../lib/credits/pricing";

type ViewMode = "result" | "before-after";

function normalizeImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      try {
        const maxSide = 3072;
        const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.max(1, Math.round(img.naturalWidth * scale));
        const height = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("Image conversion is unavailable in this browser.");

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const data = canvas.toDataURL("image/jpeg", 0.95);
        if (!data.startsWith("data:image/jpeg;base64,")) throw new Error("Image conversion failed.");
        resolve(data);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This image could not be decoded. Try saving it as JPEG or PNG first."));
    };

    img.src = url;
  });
}

function ImagePanel({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative grid min-h-[360px] place-items-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-3 sm:p-5">
      <div className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70 backdrop-blur">
        {label}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} className="max-h-[68vh] max-w-full rounded-xl object-contain shadow-2xl" />
    </div>
  );
}

export default function PictureFurnacePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [original, setOriginal] = useState<string | null>(null);
  const [commandLine, setCommandLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("result");
  const [lastCharge, setLastCharge] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  const image = historyIndex >= 0 ? history[historyIndex] : null;
  const hasResult = Boolean(original && image && historyIndex > 0);
  const actionCost = getPictureActionPrice(commandLine);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    if (file.size > 20 * 1024 * 1024) return setError("Maximum source image is 20 MB.");

    setBusy(true);
    setError("");
    try {
      const data = await normalizeImageFile(file);
      setOriginal(data);
      setHistory([data]);
      setHistoryIndex(0);
      setViewMode("result");
      setLastCharge(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The image could not be prepared.");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  function pushHistory(next: string) {
    const base = history.slice(0, historyIndex + 1);
    setHistory([...base, next]);
    setHistoryIndex(base.length);
    setViewMode("before-after");
  }

  async function forge() {
    const command = commandLine.trim();
    if (!image || busy || !command) return;

    setBusy(true);
    setError("");
    setLastCharge(null);

    try {
      const response = await fetch("/api/picture-furnace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, command, customPrompt: command }),
      });

      const data = await response.json();
      if (!response.ok || !data.image) {
        const suffix = data.refunded ? " Credits were refunded." : "";
        throw new Error(`${data.error || "Image edit failed."}${suffix}`);
      }

      pushHistory(data.image);
      if (typeof data.creditCost === "number") setLastCharge(data.creditCost);
      if (typeof data.creditBalance === "number") setCreditBalance(data.creditBalance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image edit failed.");
    } finally {
      setBusy(false);
    }
  }

  function onCommandKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      void forge();
    }
  }

  function undo() {
    setHistoryIndex((i) => Math.max(0, i - 1));
  }

  function redo() {
    setHistoryIndex((i) => Math.min(history.length - 1, i + 1));
  }

  function reset() {
    if (!original) return;
    setHistory([original]);
    setHistoryIndex(0);
    setViewMode("result");
    setError("");
    setLastCharge(null);
  }

  function download() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `crucible-picture-${Date.now()}.png`;
    a.click();
  }

  return (
    <main className="min-h-screen bg-[#070605] px-4 py-8 text-white sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-300">Picture Furnace</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Forge the image. Keep control.</h1>
            <p className="mt-2 max-w-3xl text-sm text-white/45">Load an image, type exactly what you want changed, then press Enter.</p>
          </div>
          {image && (
            <div className="flex flex-wrap items-center gap-2">
              {creditBalance !== null && (
                <div className="rounded-full border border-orange-300/20 bg-orange-400/[0.06] px-3 py-1.5 text-[11px] font-black text-orange-200">
                  {creditBalance.toLocaleString()} credits left
                </div>
              )}
              <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-bold text-white/45">
                History step {historyIndex + 1} of {history.length}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_370px]">
          <div>
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025]">
              {!image ? (
                <button onClick={() => inputRef.current?.click()} className="grid min-h-[540px] w-full place-items-center p-8 text-center">
                  <div>
                    <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-orange-500/10 text-orange-300"><Upload size={28}/></div>
                    <p className="mt-5 text-xl font-black">Load an image</p>
                    <p className="mt-2 text-sm text-white/40">PNG, JPEG, WebP or phone photo · up to 20 MB</p>
                  </div>
                </button>
              ) : (
                <div className="relative p-3 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex rounded-xl border border-white/10 bg-black/30 p-1">
                      <button onClick={() => setViewMode("result")} className={`rounded-lg px-3 py-2 text-xs font-black ${viewMode === "result" ? "bg-orange-400 text-black" : "text-white/50"}`}>Result</button>
                      <button onClick={() => setViewMode("before-after")} disabled={!hasResult} className={`rounded-lg px-3 py-2 text-xs font-black disabled:opacity-25 ${viewMode === "before-after" ? "bg-orange-400 text-black" : "text-white/50"}`}>Before / After</button>
                    </div>
                    {hasResult && <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-300/80"><Eye size={14}/> Forged result ready</div>}
                  </div>

                  {viewMode === "before-after" && original && hasResult ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      <ImagePanel src={original} label="Before · Original" />
                      <ImagePanel src={image} label="After · Forged" />
                    </div>
                  ) : (
                    <ImagePanel src={image} label={hasResult ? "Forged Result" : "Original"} />
                  )}

                  {busy && (
                    <div className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm">
                      <div className="rounded-2xl border border-white/10 bg-black/70 px-8 py-6 text-center shadow-2xl">
                        <Loader2 className="mx-auto animate-spin text-orange-300" size={36}/>
                        <p className="mt-3 font-black">Forging image…</p>
                        <p className="mt-1 text-xs text-white/40">{actionCost} credits reserved · automatically refunded if the forge fails.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button onClick={undo} disabled={historyIndex <= 0 || busy} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm font-black disabled:opacity-25"><Undo2 size={17}/>Undo</button>
              <button onClick={redo} disabled={historyIndex < 0 || historyIndex >= history.length - 1 || busy} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm font-black disabled:opacity-25"><Redo2 size={17}/>Redo</button>
              <button onClick={reset} disabled={!original || busy} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-sm font-black disabled:opacity-25"><RotateCcw size={17}/>Reset</button>
              <button onClick={download} disabled={!image || busy} className="flex items-center justify-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-black text-black disabled:opacity-25"><Download size={17}/>Save</button>
            </div>
          </div>

          <aside className="h-fit rounded-[28px] border border-white/10 bg-white/[0.025] p-4 sm:p-5 lg:sticky lg:top-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-300">Command Line</p>
            <p className="mt-1 text-xs leading-5 text-white/35">Type a natural command. Press Enter to run it.</p>

            <input
              value={commandLine}
              onChange={(e) => setCommandLine(e.target.value)}
              onKeyDown={onCommandKeyDown}
              disabled={!image || busy}
              autoComplete="off"
              placeholder="enhance natural, remove background, sharpen face…"
              className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-4 text-sm outline-none placeholder:text-white/20 focus:border-orange-300/50 disabled:opacity-35"
            />

            {commandLine.trim() && (
              <p className="mt-2 text-[11px] font-bold text-orange-200/75">{actionCost} credits · press Enter</p>
            )}

            <p className="mt-4 text-[11px] leading-5 text-white/30"><span className="font-black text-white/50">Core rule:</span> only change what the command requests. Preserve everything else as closely as possible.</p>

            <button onClick={() => inputRef.current?.click()} disabled={busy} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white/60"><ImageIcon size={17}/>Load different image</button>

            {lastCharge !== null && <p className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.04] p-3 text-[11px] leading-5 text-emerald-100/70">Forge complete · {lastCharge} credits charged{creditBalance !== null ? ` · ${creditBalance.toLocaleString()} remaining` : ""}.</p>}
            {error && <p className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-xs leading-5 text-red-200">{error}</p>}
          </aside>
        </div>

        <input ref={inputRef} onChange={onUpload} type="file" accept="image/*" className="hidden" />
      </section>
    </main>
  );
}
