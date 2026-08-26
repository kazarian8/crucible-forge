"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function ExpertMusicianDevPage() {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const startedAt = useRef(Date.now());
  const [inviteToken, setInviteToken] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setInviteToken(new URLSearchParams(window.location.search).get("invite") || "");
  }, []);

  useEffect(() => {
    const value = username.trim();
    if (!value) return void setUsernameStatus("idle");
    if (!/^[A-Za-z0-9_]{3,24}$/.test(value)) return void setUsernameStatus("invalid");
    if (!supabase) return;
    setUsernameStatus("checking");
    const timer = window.setTimeout(async () => {
      const { data, error } = await supabase.rpc("username_available", { p_username: value });
      if (error) setUsernameStatus("idle");
      else setUsernameStatus(data ? "available" : "taken");
    }, 350);
    return () => window.clearTimeout(timer);
  }, [supabase, username]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inviteToken) {
      setMessage("This invite link is missing its access token.");
      setIsError(true);
      return;
    }
    if (!configured) {
      setMessage("Crucible account services are temporarily unavailable.");
      setIsError(true);
      return;
    }
    if (!email.trim()) {
      setMessage("Enter the invited email address first.");
      setIsError(true);
      return;
    }
    if (usernameStatus !== "available") {
      setMessage(usernameStatus === "checking" ? "Wait for the username check to finish, then try again." : "Choose an available username first.");
      setIsError(true);
      return;
    }
    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      setIsError(true);
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          username: username.trim(),
          usernameFont: "default",
          next: "/sound-furnace",
          website,
          startedAt: startedAt.current,
          inviteToken,
        }),
      });
      const result = await response.json().catch(() => ({}));
      setLoading(false);

      if (!response.ok) {
        if (result.error === "invalid-invite") setMessage("This invite is invalid, expired, already used, or does not match this email.");
        else if (result.error === "email-in-use") setMessage("This email already has a Crucible account. Sign in instead.");
        else if (result.error === "username-taken") setMessage("That username was just taken. Pick another one.");
        else if (result.error === "invite-activation-failed") setMessage("The invite could not be activated. Please contact Crucible.");
        else if (response.status === 429) setMessage("Too many attempts. Wait 15 minutes and try again.");
        else setMessage("Account creation is temporarily unavailable.");
        setIsError(true);
        return;
      }

      setMessage("Verification email sent. Confirm it within 15 minutes, then sign in. Your Expert Musician Dev access will bypass payment and open Sound Furnace.");
    } catch {
      setLoading(false);
      setMessage("Account creation is temporarily unavailable.");
      setIsError(true);
    }
  }

  const statusText = usernameStatus === "checking" ? "Checking…" : usernameStatus === "available" ? "Available" : usernameStatus === "taken" ? "Already taken" : usernameStatus === "invalid" ? "3–24 letters, numbers, or _" : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Private invitation</p>
        <h1 className="mt-4 text-3xl font-black">Expert Musician Dev Access</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Create and verify this invited account. No card or payment information is required for this temporary testing role.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Invited email" autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Username</span><input required value={username} onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} placeholder="your_name" autoComplete="username" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /><span className={`mt-2 block text-xs ${usernameStatus === "available" ? "text-emerald-300" : usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-300" : "text-white/35"}`}>{statusText}</span></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Password</span><input type={showPassword ? "text" : "password"} required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Confirm password</span><input type={showPassword ? "text" : "password"} required minLength={12} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-white/65"><input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} className="h-4 w-4 accent-orange-400" /><span>{showPassword ? "Hide password" : "Show password"}</span></label>
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50">{loading ? "Creating account..." : "Create Expert Musician Dev account"}</button>
        </form>
        {message ? <p role={isError ? "alert" : "status"} className={`mt-4 rounded-xl border p-3 text-sm ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}>{message}</p> : null}
        <a href="/login?next=/sound-furnace" className="mt-6 block rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-bold text-white/70">Already verified? Sign in</a>
      </section>
    </main>
  );
}
