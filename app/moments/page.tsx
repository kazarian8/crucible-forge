"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { CREDIT_PRICES } from "../../lib/credits/pricing";
import { ExternalLink, ImagePlus, Plus, Radio, Sparkles, X } from "lucide-react";

type Moment = {
  id: string;
  user_id: string;
  body: string;
  music_url: string | null;
  artwork_url: string | null;
  created_at: string;
};

type PaidCampaign = {
  id: string;
  user_id: string;
  brand_name: string;
  destination_url: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
};

type BrandCard = {
  id: string;
  name: string;
  href: string;
  imageUrl?: string | null;
  paid: boolean;
  badge?: string;
};

const ROTATION_MS = 30_000;
const PAID_BRAND_LINK_HOURS = 2;
const DISTROKID_URL = process.env.NEXT_PUBLIC_DISTROKID_AFFILIATE_URL?.trim() || "https://distrokid.com/";

const HOUSE_ADS: BrandCard[] = [
  { id: "house-distrokid", name: "DistroKid", href: DISTROKID_URL, paid: false, badge: "Distribution" },
  { id: "house-cruciblestar", name: "Crucible Star", href: "https://cruciblestar.com/", imageUrl: "/crucible-logo.png", paid: false, badge: "DNA + verification" },
  { id: "house-openai", name: "OpenAI", href: "https://openai.com/", paid: false, badge: "AI" },
];

function rotatingPaidCards(campaigns: PaidCampaign[], tick: number) {
  if (!campaigns.length) return [] as BrandCard[];
  const start = ((tick * 3) % campaigns.length + campaigns.length) % campaigns.length;
  const selected: PaidCampaign[] = [];
  for (let step = 0; step < campaigns.length && selected.length < 3; step += 1) {
    const campaign = campaigns[(start + step) % campaigns.length];
    if (!selected.some((item) => item.user_id === campaign.user_id)) selected.push(campaign);
  }
  if (selected.length < 3) {
    for (let step = 0; step < campaigns.length && selected.length < 3; step += 1) {
      const campaign = campaigns[(start + step) % campaigns.length];
      if (!selected.some((item) => item.id === campaign.id)) selected.push(campaign);
    }
  }
  return selected.map((campaign) => ({
    id: campaign.id,
    name: campaign.brand_name,
    href: campaign.destination_url,
    imageUrl: campaign.image_url,
    paid: true,
    badge: "Paid Brand Link",
  }));
}

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [body, setBody] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const [campaigns, setCampaigns] = useState<PaidCampaign[]>([]);
  const [rotationTick, setRotationTick] = useState(() => Math.floor(Date.now() / ROTATION_MS));
  const [showAdForm, setShowAdForm] = useState(false);
  const [adBrandName, setAdBrandName] = useState("");
  const [adDestination, setAdDestination] = useState("");
  const [adImage, setAdImage] = useState<File | null>(null);
  const [adBusy, setAdBusy] = useState(false);
  const [adMessage, setAdMessage] = useState("");

  const loadMoments = async () => {
    const sb = createClient();
    const { data, error } = await sb
      .from("artist_moments")
      .select("id,user_id,body,music_url,artwork_url,created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setMsg(error.message);
    else setMoments((data ?? []) as Moment[]);
  };

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/paid-brand-links", { cache: "no-store" });
      const payload = await response.json();
      setCampaigns(Array.isArray(payload.campaigns) ? payload.campaigns : []);
    } catch {
      setCampaigns([]);
    }
  };

  useEffect(() => {
    void loadMoments();
    void loadCampaigns();
    const timer = window.setInterval(() => {
      setRotationTick(Math.floor(Date.now() / ROTATION_MS));
      void loadCampaigns();
    }, ROTATION_MS);
    return () => window.clearInterval(timer);
  }, []);

  const visibleBrandCards = useMemo(() => {
    const paid = rotatingPaidCards(campaigns, rotationTick);
    if (paid.length >= 3) return paid.slice(0, 3);
    const fillers = HOUSE_ADS.filter((house) => !paid.some((item) => item.name.toLowerCase() === house.name.toLowerCase()));
    return [...paid, ...fillers].slice(0, 3);
  }, [campaigns, rotationTick]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      setMsg("Sign in to post a Moment.");
      setBusy(false);
      return;
    }
    const { error } = await sb.from("artist_moments").insert({
      user_id: user.id,
      body: body.trim(),
      music_url: musicUrl.trim() || null,
      is_public: true,
    });
    if (error) setMsg(error.message);
    else {
      setBody("");
      setMusicUrl("");
      await loadMoments();
    }
    setBusy(false);
  };

  async function buyPaidBrandLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAdBusy(true);
    setAdMessage("");
    let uploadedPath = "";
    try {
      if (!adImage) {
        setAdMessage("Choose a picture for your Paid Brand Link.");
        return;
      }
      if (adImage.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(adImage.type)) {
        setAdMessage("Use a JPG, PNG, or WebP image up to 5 MB.");
        return;
      }

      const sb = createClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) {
        setAdMessage("Sign in to buy a Paid Brand Link.");
        return;
      }

      const extension = adImage.type === "image/png" ? "png" : adImage.type === "image/webp" ? "webp" : "jpg";
      uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await sb.storage.from("brand-link-images").upload(uploadedPath, adImage, {
        cacheControl: "3600",
        contentType: adImage.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const response = await fetch("/api/paid-brand-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: adBrandName,
          destinationUrl: adDestination,
          imagePath: uploadedPath,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        await sb.storage.from("brand-link-images").remove([uploadedPath]).catch(() => null);
        setAdMessage(payload.error ?? "Could not start the Paid Brand Link campaign.");
        return;
      }

      setAdBrandName("");
      setAdDestination("");
      setAdImage(null);
      setShowAdForm(false);
      setAdMessage(`Paid Brand Link is live for ${payload.campaignHours ?? PAID_BRAND_LINK_HOURS} hours. ${payload.charged ?? CREDIT_PRICES.brandWebsiteAd2Hours} credits used.`);
      window.dispatchEvent(new Event("crucible:credits-updated"));
      await loadCampaigns();
    } catch (error) {
      if (uploadedPath) {
        const sb = createClient();
        await sb.storage.from("brand-link-images").remove([uploadedPath]).catch(() => null);
      }
      setAdMessage(error instanceof Error ? error.message : "Could not start the Paid Brand Link campaign.");
    } finally {
      setAdBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050403] pb-28 text-white">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <header>
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-orange-300">Artist network</p>
          <h1 className="mt-2 text-3xl font-black">Moments</h1>
          <p className="mt-2 text-sm text-white/45">Drop updates, tracks, clips and releases to the Crucible community.</p>
        </header>

        <section className="mt-5 rounded-3xl border border-orange-300/15 bg-[#0d0a08] p-3 shadow-[0_0_28px_rgba(249,115,22,0.06)]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-orange-400 opacity-50 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-orange-400" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">Paid Brand Links</p>
                <p className="text-[10px] text-white/35">Sponsored links · 3 shown at a time</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowAdForm((value) => !value)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white/70">
              {showAdForm ? "Close" : "Buy ad time"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {visibleBrandCards.map((ad) => (
              <a key={ad.id} href={ad.href} target="_blank" rel="noopener noreferrer sponsored" className="group relative h-28 overflow-hidden rounded-2xl border border-white/10 bg-[#15100c] shadow-sm transition hover:border-orange-300/35 focus:outline-none focus:ring-2 focus:ring-orange-300/50">
                {ad.imageUrl ? <img src={ad.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-85" /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
                <div className="absolute inset-x-0 bottom-0 p-2">
                  <p className="truncate text-xs font-black text-white">{ad.name}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-white/55">
                    <span className="truncate">{ad.badge}</span><ExternalLink size={9} className="shrink-0" />
                  </div>
                </div>
                {ad.paid ? <span className="absolute right-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-orange-200">Sponsored</span> : null}
              </a>
            ))}
          </div>

          {showAdForm ? (
            <form onSubmit={buyPaidBrandLink} className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black">Paid Brand Link</p>
                  <p className="mt-1 text-xs text-white/45">Custom picture + clickable website link · {CREDIT_PRICES.brandWebsiteAd2Hours} credits for {PAID_BRAND_LINK_HOURS} hours.</p>
                </div>
                <button type="button" onClick={() => setShowAdForm(false)} className="text-white/35" aria-label="Close Paid Brand Link form"><X size={18} /></button>
              </div>
              <input required maxLength={80} value={adBrandName} onChange={(e) => setAdBrandName(e.target.value)} placeholder="Brand or website name" className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-orange-300/40" />
              <input required type="url" value={adDestination} onChange={(e) => setAdDestination(e.target.value)} placeholder="https://yourwebsite.com" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm outline-none focus:border-orange-300/40" />
              <label className="mt-2 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-3 text-xs text-white/55">
                <span className="flex min-w-0 items-center gap-2"><ImagePlus size={16} className="shrink-0" /><span className="truncate">{adImage?.name ?? "Add custom ad picture"}</span></span>
                <span className="shrink-0 text-[9px] uppercase tracking-wider text-white/30">JPG · PNG · WebP</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => setAdImage(e.target.files?.[0] ?? null)} />
              </label>
              <button disabled={adBusy} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-black text-black disabled:opacity-50"><Sparkles size={16} />{adBusy ? "Starting campaign…" : `Start 2-hour ad · ${CREDIT_PRICES.brandWebsiteAd2Hours} credits`}</button>
            </form>
          ) : null}
          {adMessage ? <p role="status" className="mt-2 text-xs text-orange-200">{adMessage}</p> : null}
        </section>

        <form onSubmit={submit} className="mt-6 rounded-3xl border border-white/10 bg-[#0d0a08] p-4">
          <textarea required maxLength={1200} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What are you working on?" className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-3 text-sm outline-none focus:border-orange-400/50" />
          <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="Optional audio/track URL" className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none" />
          <button disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-black text-black"><Plus size={16} />{busy ? "Posting…" : "Post Moment"}</button>
          {msg ? <p className="mt-2 text-xs text-orange-200">{msg}</p> : null}
        </form>

        <section className="mt-6 space-y-3">
          {moments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-white/35"><Radio className="mx-auto mb-2" />No public Moments yet.</div>
          ) : moments.map((moment) => (
            <article key={moment.id} className="rounded-2xl border border-white/10 bg-[#0d0a08] p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/30"><Radio size={13} />Artist Moment · {new Date(moment.created_at).toLocaleDateString()}</div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/80">{moment.body}</p>
              {moment.artwork_url ? <div className="mt-4 aspect-square overflow-hidden rounded-2xl bg-black bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${moment.artwork_url})` }} /> : null}
              {moment.music_url ? <audio className="mt-4 w-full" controls preload="none" src={moment.music_url} /> : null}
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
