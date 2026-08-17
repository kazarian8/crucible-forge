"use client";

import { FormEvent, useEffect, useState } from "react";
import { CREDIT_PRICES } from "../../lib/credits/pricing";

type Profile = {
  username: string | null;
  username_font: "default" | "gochi_hand";
  username_change_count: number;
};

export default function AccountPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [usernameFont, setUsernameFont] = useState<"default" | "gochi_hand">("default");

  useEffect(() => {
    void fetch("/api/profile/username", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        if (payload.profile) {
          setProfile(payload.profile);
          setUsername(payload.profile.username ?? "");
          setUsernameFont(payload.profile.username_font ?? "default");
        }
      });
  }, []);

  async function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/profile/username", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, usernameFont }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setMessage(payload.error ?? "Could not update username.");
        return;
      }
      setProfile(payload.profile);
      setMessage(payload.charged ? `Locked in. ${payload.charged} credits used.` : "Locked in. No credits used.");
      window.dispatchEvent(new Event("crucible:credits-updated"));
    } catch {
      setMessage("Could not update username.");
    } finally {
      setLoading(false);
    }
  }

  async function managePlan() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.url) {
        setMessage(payload.error ?? "Billing portal unavailable.");
        return;
      }
      window.location.assign(payload.url);
    } catch {
      setMessage("Billing portal unavailable.");
    } finally {
      setLoading(false);
    }
  }

  const firstSetup = !!profile && !profile.username;
  const usernameChangeCost = profile?.username && profile.username !== username ? CREDIT_PRICES.usernameChange : 0;
  const fontChangeCost = !firstSetup && profile && profile.username_font !== usernameFont ? CREDIT_PRICES.usernameFontChange : 0;
  const pendingCost = usernameChangeCost + fontChangeCost;

  return (
    <main className="min-h-screen bg-[#080604] px-5 py-12 text-white">
      <section className="mx-auto w-full max-w-lg space-y-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible identity</p>
          <h1 className="mt-3 text-3xl font-black">Your username.</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">Your first username and initial font are free. Later username changes cost {CREDIT_PRICES.usernameChange} credits. Font-only changes cost {CREDIT_PRICES.usernameFontChange} credits.</p>

          <form onSubmit={saveIdentity} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Username</span>
              <input required minLength={3} maxLength={24} pattern="[A-Za-z0-9_]+" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" />
            </label>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-white/50">Username font</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setUsernameFont("default")} className={`rounded-xl border px-4 py-3 ${usernameFont === "default" ? "border-orange-300/50 bg-orange-400/10" : "border-white/10"}`}>Default</button>
                <button type="button" onClick={() => setUsernameFont("gochi_hand")} className={`rounded-xl border px-4 py-3 text-xl ${usernameFont === "gochi_hand" ? "border-orange-300/50 bg-orange-400/10" : "border-white/10"}`} style={{ fontFamily: "var(--font-gochi-hand)" }}>Gochi Hand</button>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-center">
              <p className="text-xs uppercase tracking-wider text-white/35">Preview</p>
              <p className="mt-2 text-2xl" style={usernameFont === "gochi_hand" ? { fontFamily: "var(--font-gochi-hand)" } : undefined}>@{username || "your_name"}</p>
            </div>

            <button type="submit" disabled={loading || !username} className="w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-black disabled:opacity-50">
              {loading ? "Saving..." : `Save${pendingCost ? ` · ${pendingCost} credits` : " · free"}`}
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible account</p>
          <h2 className="mt-3 text-2xl font-black">Manage your Pro plan.</h2>
          <p className="mt-3 text-sm leading-6 text-white/50">Update your card, review billing, or cancel securely through Stripe.</p>
          <button type="button" onClick={managePlan} disabled={loading} className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4 font-black text-white disabled:opacity-50">Open secure billing portal</button>
        </div>

        {message ? <p role="status" className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{message}</p> : null}
        <a href="/sound-furnace" className="block text-center text-sm text-white/45">Return to Sound Furnace</a>
      </section>
    </main>
  );
}
