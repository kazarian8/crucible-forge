"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeDollarSign,
  Download,
  Music2,
  Pause,
  Play,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Upload,
  UserRound,
} from "lucide-react";
import { createClient } from "../../lib/supabase/client";

type Item = {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  category: string;
  artwork_url: string | null;
  free_download: boolean;
  price_cents: number;
  preview_url: string | null;
  watermark_label: string;
  bpm: number | null;
  musical_key: string | null;
  license_type: string;
  crucible_score: number | null;
  crucible_grade: string | null;
  created_at: string;
};

type Seller = {
  user_id: string;
  display_name: string;
};

type SortMode = "newest" | "rating" | "price-low" | "price-high";

const categories = ["all", "beat", "loop", "sample", "one-shot", "preset", "other"] as const;

function formatCategory(category: string) {
  return category === "all" ? "All sounds" : category.replace("-", " ");
}

function sellerInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "C";
}

export default function SoundLibraryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [sellers, setSellers] = useState<Record<string, Seller>>({});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<(typeof categories)[number]>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState("");
  const [previewProgress, setPreviewProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMarketplace() {
      const supabase = createClient();
      const [itemsResult, sellersResult] = await Promise.all([
        supabase
          .from("sound_library_items")
          .select("id,user_id,title,description,category,artwork_url,free_download,price_cents,preview_url,watermark_label,bpm,musical_key,license_type,crucible_score,crucible_grade,created_at")
          .eq("is_published", true)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("marketplace_sellers")
          .select("user_id,display_name")
          .limit(100),
      ]);

      if (cancelled) return;
      if (itemsResult.error) setMessage(itemsResult.error.message);
      else setItems((itemsResult.data ?? []) as Item[]);

      if (!sellersResult.error) {
        const sellerMap = Object.fromEntries(
          ((sellersResult.data ?? []) as Seller[]).map((seller) => [seller.user_id, seller]),
        );
        setSellers(sellerMap);
      }
      setLoading(false);
    }

    void loadMarketplace();
    return () => { cancelled = true; };
  }, []);

  useEffect(
    () => () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    },
    [],
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    const matches = items.filter((item) => {
      const matchesCategory = category === "all" || item.category === category;
      const sellerName = item.user_id ? sellers[item.user_id]?.display_name ?? "" : "";
      const haystack = `${item.title} ${item.description ?? ""} ${item.category} ${sellerName}`.toLowerCase();
      return matchesCategory && (!search || haystack.includes(search));
    });

    return [...matches].sort((left, right) => {
      if (sortMode === "rating") return (right.crucible_score ?? -1) - (left.crucible_score ?? -1);
      if (sortMode === "price-low") return left.price_cents - right.price_cents;
      if (sortMode === "price-high") return right.price_cents - left.price_cents;
      return new Date(right.created_at).getTime() - new Date(left.created_at).getTime();
    });
  }, [category, items, query, sellers, sortMode]);

  async function togglePreview(item: Item) {
    const audio = audioRef.current;
    if (!audio) return;

    if (playingId === item.id && !audio.paused) {
      audio.pause();
      return;
    }

    const source = `/api/marketplace/download?id=${encodeURIComponent(item.id)}&preview=1`;
    try {
      if (audio.dataset.itemId !== item.id) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
        audio.src = source;
        audio.dataset.itemId = item.id;
        audio.load();
        setPreviewProgress(0);
      }
      await audio.play();
      setPlayingId(item.id);
    } catch {
      setPlayingId("");
      setMessage("This sound preview could not start. Try it again.");
    }
  }

  async function buy(id: string) {
    setMessage("");
    const response = await fetch("/api/marketplace/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: id }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Checkout failed.");
    if (data.url) window.location.assign(data.url);
  }

  async function onboard() {
    const response = await fetch("/api/marketplace/seller-onboard", { method: "POST" });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error || "Seller setup failed.");
    if (data.url) window.location.assign(data.url);
  }

  return (
    <main className="min-h-screen bg-[#060606] pb-28 text-white">
      <audio
        ref={audioRef}
        preload="metadata"
        className="hidden"
        onPlay={(event) => setPlayingId(event.currentTarget.dataset.itemId ?? "")}
        onPause={() => setPlayingId("")}
        onEnded={() => { setPlayingId(""); setPreviewProgress(0); }}
        onTimeUpdate={(event) => {
          const audio = event.currentTarget;
          setPreviewProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        }}
      />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080808]/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <div className="grid size-8 place-items-center rounded-lg bg-orange-500 font-black text-black">C</div>
            <div>
              <p className="text-sm font-black">Crucible Marketplace</p>
              <p className="text-[10px] text-white/35">Independent sounds. Verified quality.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => void onboard()} className="hidden rounded-lg border border-white/10 px-3 py-2 text-[10px] font-black text-white/60 sm:block"><Store size={13} className="mr-1 inline" />Payouts</button>
            <Link href="/star" className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-[10px] font-black text-black"><Upload size={13} />Sell audio</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <section className="grid gap-5 border-b border-white/10 pb-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Latest inventory</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Audio Marketplace</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Preview and license the newest beats, vocals, loops, samples, and stems posted by Crucible creators.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/35">
            <ShieldCheck size={16} className="text-emerald-300" /> Protected previews · creator-owned masters
          </div>
        </section>

        <section aria-label="Marketplace filters" className="sticky top-14 z-30 -mx-4 border-b border-white/10 bg-[#060606]/95 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <span className="sr-only">Search marketplace</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sounds or creators" className="w-full rounded-xl border border-white/10 bg-[#111] py-3 pl-10 pr-4 text-sm outline-none placeholder:text-white/25 focus:border-orange-300/45" />
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:max-w-[52%] lg:pb-0">
              {categories.map((value) => (
                <button key={value} type="button" aria-pressed={category === value} onClick={() => setCategory(value)} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black capitalize ${category === value ? "bg-white text-black" : "bg-white/[0.06] text-white/45"}`}>{formatCategory(value)}</button>
              ))}
            </div>
            <label className="relative shrink-0">
              <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={14} />
              <span className="sr-only">Sort marketplace</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} className="appearance-none rounded-xl border border-white/10 bg-[#111] py-3 pl-9 pr-8 text-[10px] font-black text-white/65">
                <option value="newest">Newest first</option>
                <option value="rating">Highest Star rating</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
              </select>
            </label>
          </div>
        </section>

        {message ? <p role="alert" className="mt-4 rounded-xl border border-orange-300/20 bg-orange-500/10 p-3 text-xs text-orange-100">{message}</p> : null}

        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs font-black text-white/55">{loading ? "Loading marketplace…" : `${filtered.length} sound${filtered.length === 1 ? "" : "s"}`}</p>
          <p className="text-[10px] text-white/25">Newest creator posts appear first</p>
        </div>

        <section aria-label="Sounds for sale" className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, index) => {
            const paid = item.price_cents > 0;
            const hasPreview = !paid || Boolean(item.preview_url);
            const sellerName = item.user_id ? sellers[item.user_id]?.display_name ?? "Crucible creator" : "Crucible creator";
            const isPlaying = playingId === item.id;
            const score = item.crucible_score;
            const newListing = sortMode === "newest" && index < 3;
            const progress = isPlaying ? previewProgress : 0;

            return (
              <article key={item.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-[#101010] transition hover:-translate-y-0.5 hover:border-orange-300/25">
                <div
                  className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#2a1407] via-[#141414] to-[#080808]"
                  style={item.artwork_url ? { backgroundImage: `linear-gradient(rgba(0,0,0,.15),rgba(0,0,0,.55)),url(${item.artwork_url})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
                >
                  {!item.artwork_url ? <div className="absolute inset-0 grid place-items-center opacity-20"><Music2 size={72} /></div> : null}
                  <div className="absolute inset-x-4 top-4 flex items-center justify-between">
                    <span className="rounded-full bg-black/70 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white/75 backdrop-blur">{formatCategory(item.category)}</span>
                    {newListing ? <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-black text-black">NEW</span> : null}
                  </div>
                  <button type="button" disabled={!hasPreview} onClick={() => void togglePreview(item)} aria-label={isPlaying ? `Pause ${item.title} preview` : `Play ${item.title} preview`} className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/75 text-white shadow-2xl backdrop-blur transition group-hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30">
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play className="translate-x-0.5" size={22} fill="currentColor" />}
                  </button>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10"><div className="h-full bg-orange-400 transition-[width]" style={{ width: `${progress}%` }} /></div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-black text-orange-200">{sellerInitial(sellerName)}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-black text-white/75">{sellerName}</p>
                        <p className="text-[9px] text-white/30">Independent seller</p>
                      </div>
                    </div>
                    <div className={`shrink-0 rounded-lg border px-2 py-1.5 ${score != null ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-white/[0.03]"}`} title="Crucible Star audio quality rating">
                      <p className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-wider ${score != null ? "text-amber-200" : "text-white/30"}`}><Star size={11} fill={score != null ? "currentColor" : "none"} />Crucible Star</p>
                      <p className="mt-0.5 text-right font-mono text-[11px] font-black">{score != null ? `${item.crucible_grade ?? "—"} · ${score}/100` : "Not rated"}</p>
                    </div>
                  </div>

                  <h2 className="mt-4 truncate text-lg font-black" title={item.title}>{item.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[9px] font-bold uppercase tracking-wider text-white/45">
                    {item.bpm ? <span className="rounded-md bg-white/[0.06] px-2 py-1">{item.bpm} BPM</span> : null}
                    {item.musical_key ? <span className="rounded-md bg-white/[0.06] px-2 py-1">{item.musical_key}</span> : null}
                    <span className="rounded-md bg-white/[0.06] px-2 py-1">{item.license_type} license</span>
                  </div>
                  <p className="mt-3 line-clamp-2 min-h-10 text-xs leading-5 text-white/38">{item.description || "Creator-posted audio, verified and listed through Crucible Forge."}</p>
                  {paid && hasPreview ? <p className="mt-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300"><ShieldCheck size={12} />{item.watermark_label}</p> : null}
                  {!hasPreview ? <p className="mt-3 text-[10px] text-amber-200">Protected preview unavailable.</p> : null}

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                    <div>
                      <p className="text-[9px] uppercase tracking-wider text-white/30">License price</p>
                      <p className="text-xl font-black text-orange-300">{paid ? `$${(item.price_cents / 100).toFixed(2)}` : "FREE"}</p>
                    </div>
                    {paid ? (
                      <button type="button" onClick={() => void buy(item.id)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black"><ShoppingBag size={15} />Buy license</button>
                    ) : (
                      <a href={`/api/marketplace/download?id=${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-xs font-black text-black"><Download size={15} />Get sound</a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {!loading && filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-12 text-center text-white/30"><Music2 className="mx-auto mb-3" /><p className="font-black text-white/55">No matching sounds</p><p className="mt-1 text-xs">Try another category or search.</p></div> : null}

        <section className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-orange-300/15 bg-orange-500/[0.05] p-5 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-full bg-orange-500 text-black"><UserRound size={19} /></span><div><p className="font-black">Sell your own sound</p><p className="mt-1 text-xs text-white/40">Run File DNA, set the license price, and publish it to the newest listings.</p></div></div>
          <Link href="/star" className="inline-flex items-center gap-2 rounded-xl border border-orange-300/25 px-4 py-3 text-xs font-black text-orange-100"><BadgeDollarSign size={16} />Create a listing</Link>
        </section>
      </div>
    </main>
  );
}
