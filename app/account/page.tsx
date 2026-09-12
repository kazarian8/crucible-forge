"use client";

import { FormEvent, useEffect, useState } from "react";
import { CREDIT_PRICES } from "../../lib/credits/pricing";

type Profile = {
  username: string | null;
  username_font: "default" | "gochi_hand";
  username_change_count: number;
};

type ProfileTab = "profile" | "username";

export default function AccountPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState("");
  const [usernameFont, setUsernameFont] = useState<"default" | "gochi_hand">("default");
  const [activeTab, setActiveTab] = useState<ProfileTab>("profile");

  useEffect(() => {
    void fetch("/api/profile/username", { cache: "no-store" })
      .then((r) => r.json())
      .then((payload) => {
        if (payload.profile) {
          setProfile(payload.profile);
          setUsername(payload.profile.username ?? "");
          setUsernameFont(payload.profile.username_font ?? "default");
        }
      })
      .finally(() => setProfileLoaded(true));
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
      setUsername(payload.profile?.username ?? username);
      setUsernameFont(payload.profile?.username_font ?? usernameFont);
      setActiveTab("profile");
      setMessage(payload.charged ? `Username updated. ${payload.charged} credits used.` : "Username saved.");
      window.dispatchEvent(new Event("crucible:credits-updated"));
      window.dispatchEvent(new Event("crucible:profile-updated"));
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

  const firstSetup = profileLoaded && !!profile && !profile.username;
  const usernameChanged = !!profile && (profile.username ?? "") !== username;
  const fontChanged = !!profile && profile.username_font !== usernameFont;
  const hasIdentityChanges = !!profile && (usernameChanged || fontChanged);
  const usernameChangeCost = profile?.username && usernameChanged ? CREDIT_PRICES.usernameChange : 0;
  const fontChangeCost = !firstSetup && fontChanged ? CREDIT_PRICES.usernameFontChange : 0;
  const pendingCost = usernameChangeCost + fontChangeCost;
  const usernameStyle = usernameFont === "gochi_hand" ? { fontFamily: "var(--font-gochi-hand)" } : undefined;

  const usernameForm = (
    <form onSubmit={saveIdentity} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-xs font-bold uppercase tracking-wider text-white/50">Username</span>
        <input
          required
          minLength={3}
          maxLength={24}
          pattern="[A-Za-z0-9_]+"
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50"
        />
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
        <p className="mt-2 text-2xl" style={usernameStyle}>@{username || "your_name"}</p>
      </div>

      {!firstSetup ? (
        <p className="rounded-xl border border-orange-300/15 bg-orange-400/[0.06] p-3 text-sm leading-6 text-white/60">
          Changing your username costs {CREDIT_PRICES.usernameChange} credits. You will see the exact cost on the save button before anything is charged.
        </p>
      ) : null}

      <button type="submit" disabled={loading || !username || !hasIdentityChanges} className="w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-black disabled:bg-white/[0.06] disabled:text-white/45 disabled:opacity-100">
        {loading ? "Saving..." : !profile ? "Loading saved identity..." : !hasIdentityChanges ? "Saved" : `Save${pendingCost ? ` · ${pendingCost} credits` : " · free"}`}
      </button>
    </form>
  );

  return (
    <main className="min-h-screen bg-[#080604] px-5 py-12 text-white">
      <section className="mx-auto w-full max-w-lg space-y-5">
        {!profileLoaded ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-sm text-white/50">Loading profile…</div>
        ) : firstSetup ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Choose your username</p>
            <h1 className="mt-3 text-3xl font-black">Set your Crucible identity.</h1>
            <p className="mt-3 text-sm leading-6 text-white/50">Your first username and initial font are free. Once saved, this setup box disappears.</p>
            {usernameForm}
          </div>
        ) : profile ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button type="button" onClick={() => setActiveTab("profile")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === "profile" ? "bg-orange-500 text-black" : "text-white/55 hover:bg-white/[0.05]"}`}>Profile</button>
                <button type="button" onClick={() => setActiveTab("username")} className={`rounded-xl px-4 py-3 text-sm font-black transition ${activeTab === "username" ? "bg-orange-500 text-black" : "text-white/55 hover:bg-white/[0.05]"}`}>Edit username</button>
              </div>
            </div>

            {activeTab === "profile" ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Profile</p>
                <h1 className="mt-3 text-3xl font-black" style={profile.username_font === "gochi_hand" ? { fontFamily: "var(--font-gochi-hand)" } : undefined}>@{profile.username}</h1>
                <p className="mt-3 text-sm leading-6 text-white/50">This is the username shown across Crucible. Use the Edit username tab only when you want to change it.</p>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Profile · Edit username</p>
                <h2 className="mt-3 text-2xl font-black">Change your username.</h2>
                <p className="mt-3 text-sm leading-6 text-white/50">Your saved username stays active until this change succeeds.</p>
                {usernameForm}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-sm text-white/60">Profile unavailable right now.</div>
        )}

        {profile?.username ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible account</p>
            <h2 className="mt-3 text-2xl font-black">Manage your Pro plan.</h2>
            <p className="mt-3 text-sm leading-6 text-white/50">Update your card, review billing, or cancel securely through Stripe.</p>
            <button type="button" onClick={managePlan} disabled={loading} className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.05] px-5 py-4 font-black text-white disabled:opacity-50">Open secure billing portal</button>
          </div>
        ) : null}

        {message ? <p role="status" className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white/70">{message}</p> : null}
        <a href="/sound-furnace" className="block text-center text-sm text-white/45">Return to Sound Furnace</a>
      </section>
    </main>
  );
}
