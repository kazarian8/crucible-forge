"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Download, Music2, ShieldCheck, Store, Upload } from "lucide-react";
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
  created_at: string;
};

export default function SoundLibraryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sound_library_items")
      .select("id,user_id,title,description,category,artwork_url,free_download,price_cents,preview_url,watermark_label,bpm,musical_key,license_type,created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) setMessage(error.message);
    else setItems((data ?? []) as Item[]);
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(
    () => items.filter((item) => `${item.title} ${item.description ?? ""} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );

  async function buy(id: string) {
    setMessage("");
    const response = await fetch("/api/marketplace/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId: id }) });
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
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-[10px] font-black uppercase tracking-[.25em] text-orange-300">Crucible market</p><h1 className="mt-2 text-3xl font-black">Sounds</h1><p className="mt-2 max-w-2xl text-sm text-white/45">Free downloads plus artist-sold beats, loops, samples, and tracks. Paid masters stay private behind checkout.</p></div>
          <div className="flex flex-wrap gap-2"><button onClick={() => void onboard()} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-black"><Store size={14} className="mr-1 inline" />Seller payout setup</button><Link href="/star" className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2 text-xs font-black text-black"><Upload size={14} />Upload &amp; list sound</Link></div>
        </header>
        <section className="mt-5 rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.04] p-4 text-sm text-white/60">Upload once in Forge: File DNA checks the audio, the master goes into your private vault, and a paid listing gets a separate 30-second protected preview.</section>
        <div className="mt-5"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search beats, loops, samples, tracks…" className="w-full rounded-2xl border border-white/10 bg-[#0d0a08] px-4 py-3 text-sm outline-none" /></div>
        {message ? <p className="mt-3 rounded-xl border border-orange-300/20 bg-orange-500/10 p-3 text-xs text-orange-100">{message}</p> : null}
        <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const paid = item.price_cents > 0;
            const hasPreview = !paid || Boolean(item.preview_url);
            return <article key={item.id} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0a08] p-4"><div className="flex items-center justify-between"><span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-white/45">{item.category}</span><span className="text-sm font-black text-orange-300">{paid ? `$${(item.price_cents / 100).toFixed(2)}` : "FREE"}</span></div><h2 className="mt-4 text-lg font-black">{item.title}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-white/40">{item.description || "Crucible artist sound."}</p><div className="mt-3 flex gap-2 text-[10px] text-white/35">{item.bpm ? <span>{item.bpm} BPM</span> : null}{item.musical_key ? <span>{item.musical_key}</span> : null}<span>{item.license_type}</span></div>{hasPreview ? <div className="mt-4"><audio controls preload="none" className="w-full" src={`/api/marketplace/download?id=${encodeURIComponent(item.id)}&preview=1`} />{paid ? <div className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-300"><ShieldCheck size={13} />{item.watermark_label}</div> : null}</div> : <p className="mt-4 text-xs text-amber-200">This seller has not attached a protected preview.</p>}<div className="mt-4">{paid ? <button onClick={() => void buy(item.id)} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black"><BadgeDollarSign size={15} />Buy license</button> : <a href={`/api/marketplace/download?id=${encodeURIComponent(item.id)}`} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-xs font-black text-black"><Download size={15} />Download</a>}</div></article>;
          })}
        </section>
        {filtered.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center text-white/30"><Music2 className="mx-auto mb-2" />No sounds match yet.</div> : null}
      </div>
    </main>
  );
}
