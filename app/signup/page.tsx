"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/subscribe";
}

function friendlySignupError(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("rate limit") || normalized.includes("email rate")) {
    return "The confirmation email service is temporarily at its limit. Try again after the email window resets.";
  }
  if (normalized.includes("duplicate") || normalized.includes("unique") || normalized.includes("username")) {
    return "That username was just taken. Pick another one.";
  }
  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("already in use")) {
    return "Email already in use. Sign in instead.";
  }
  if (normalized.includes("password")) return "Use a password with at least 12 characters.";
  return message;
}

const WORDS_A = ["North", "Rare", "Ghost", "Rose", "True", "Night", "Silver", "Cold", "Prime", "Wild"];
const WORDS_B = ["Signal", "Forge", "Wave", "Rhythm", "Static", "Verse", "Pulse", "Sound", "Flow", "Tone"];

function randomUsername() {
  const a = WORDS_A[Math.floor(Math.random() * WORDS_A.length)];
  const b = WORDS_B[Math.floor(Math.random() * WORDS_B.length)];
  const number = Math.floor(10 + Math.random() * 90);
  return `${a}${b}${number}`;
}

export default function SignupPage() {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [username, setUsername] = useState("");
  const [usernameFont, setUsernameFont] = useState<"default" | "gochi_hand">("default");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const value = username.trim();
    if (!value) {
      setUsernameStatus("idle");
      return;
    }
    if (!/^[A-Za-z0-9_]{3,24}$/.test(value)) {
      setUsernameStatus("invalid");
      return;
    }
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
    if (!supabase) {
      setMessage("Account creation is temporarily unavailable.");
      setIsError(true);
      return;
    }
    if (usernameStatus !== "available") {
      setMessage("Choose an available username first.");
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
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeNext());

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: callback.toString(),
        data: { username: username.trim(), username_font: usernameFont },
      },
    });
    setLoading(false);

    if (error) {
      setMessage(friendlySignupError(error.message));
      setIsError(true);
      return;
    }
    if (data.user && data.user.identities?.length === 0) {
      setMessage("Email already in use. Sign in instead.");
      setIsError(true);
      return;
    }
    if (data.session) {
      window.location.assign(safeNext());
      return;
    }
    setMessage("Account created. Check your inbox once to confirm your email, then sign in with this password.");
  }

  const statusText = usernameStatus === "checking" ? "Checking…" : usernameStatus === "available" ? "Available" : usernameStatus === "taken" ? "Already taken" : usernameStatus === "invalid" ? "3–24 letters, numbers, or _" : "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Verified access only</p>
        <h1 className="mt-4 text-3xl font-black">Create your Crucible account.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">Pick a unique username, confirm your email once, then use your password for everyday sign-in.</p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Username</span>
            <div className="mt-2 flex gap-2">
              <input required value={username} onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))} placeholder="your_name" autoComplete="username" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" />
              <button type="button" onClick={() => setUsername(randomUsername())} className="rounded-xl border border-white/10 bg-white/[0.06] px-4 text-sm font-bold text-white/70">Random</button>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={usernameStatus === "available" ? "text-emerald-300" : usernameStatus === "taken" || usernameStatus === "invalid" ? "text-red-300" : "text-white/35"}>{statusText}</span>
              <span className="text-white/30">Never duplicated</span>
            </div>
          </label>

          <fieldset className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
            <legend className="px-1 text-xs font-bold uppercase tracking-wider text-white/50">Username font</legend>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setUsernameFont("default")} className={`rounded-lg border px-3 py-3 text-sm ${usernameFont === "default" ? "border-orange-300/50 bg-orange-400/10" : "border-white/10"}`}>Default</button>
              <button type="button" onClick={() => setUsernameFont("gochi_hand")} className={`rounded-lg border px-3 py-3 text-xl ${usernameFont === "gochi_hand" ? "border-orange-300/50 bg-orange-400/10" : "border-white/10"}`} style={{ fontFamily: "var(--font-gochi-hand)" }}>Gochi Hand</button>
            </div>
            <p className="mt-2 text-center text-xs text-white/35" style={usernameFont === "gochi_hand" ? { fontFamily: "var(--font-gochi-hand)", fontSize: "18px" } : undefined}>@{username || "your_name"}</p>
          </fieldset>

          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Email</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="artist@email.com" autoComplete="email" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Password</span><input type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 12 characters" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <label className="block"><span className="text-xs font-bold uppercase tracking-wider text-white/50">Confirm password</span><input type="password" required minLength={12} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="Repeat your password" autoComplete="new-password" className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50" /></label>
          <button type="submit" disabled={!configured || loading || !email || !password || !confirmation || usernameStatus !== "available"} className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50">{loading ? "Creating account..." : "Create account"}</button>
        </form>
        {message ? <p role={isError ? "alert" : "status"} className={`mt-4 rounded-xl border p-3 text-sm ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}>{message}</p> : null}
        <a href="/login" className="mt-6 block text-center text-sm text-white/45">Already registered? Sign in</a>
      </section>
    </main>
  );
}
