"use client";

import { FormEvent, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/subscribe";
}

function friendlySignupError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("rate limit") || normalized.includes("email rate")) {
    return "The confirmation email service is temporarily at its limit. Do not keep retrying; your details are safe. Try again after the email window resets.";
  }

  if (
    normalized.includes("already registered") ||
    normalized.includes("already exists") ||
    normalized.includes("already in use")
  ) {
    return "Email already in use. Sign in instead.";
  }

  if (normalized.includes("password")) {
    return "Use a password with at least 12 characters.";
  }

  return message;
}

export default function SignupPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Account creation is temporarily unavailable.");
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
      },
    });

    setLoading(false);

    if (error) {
      setMessage(friendlySignupError(error.message));
      setIsError(true);
      return;
    }

    // Supabase deliberately returns an obfuscated user with no identities when
    // a confirmed email already exists. Turn that response into a clear action
    // instead of claiming another account was created.
    if (data.user && data.user.identities?.length === 0) {
      setMessage("Email already in use. Sign in instead.");
      setIsError(true);
      return;
    }

    if (data.session) {
      window.location.assign(safeNext());
      return;
    }

    setMessage(
      "Account created. Check your inbox once to confirm your email, then sign in with this password. Routine sign-ins will not send another email.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
          Verified access only
        </p>
        <h1 className="mt-4 text-3xl font-black">Create your Crucible account.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Confirm your email once, then use your password for everyday sign-in.
          Stripe securely collects a card for the 30-day free trial. You are not
          charged today.
        </p>
        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="artist@email.com"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Password
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 12 characters"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">
              Confirm password
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50"
            />
          </label>
          <button
            type="submit"
            disabled={!configured || loading || !email || !password || !confirmation}
            className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
        {message ? (
          <p
            role={isError ? "alert" : "status"}
            className={`mt-4 rounded-xl border p-3 text-sm ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}
          >
            {message}
          </p>
        ) : null}
        <a href="/login" className="mt-6 block text-center text-sm text-white/45">
          Already registered? Sign in
        </a>
      </section>
    </main>
  );
}
