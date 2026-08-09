"use client";

import { FormEvent, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/subscribe";
}

export default function SignupPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [email, setEmail] = useState("");
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

    setLoading(true);
    setMessage("");
    setIsError(false);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeNext());

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: true,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      setIsError(true);
      return;
    }

    setMessage(
      "Check your inbox. Tap the secure confirmation link before Crucible will offer the 30-day trial.",
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
          Confirm your email first. Then Stripe securely collects a card for the
          30-day free trial. You are not charged today.
        </p>
        <form onSubmit={handleSubmit} className="mt-7">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-white/50">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="artist@email.com"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 outline-none focus:border-orange-300/50"
          />
          <button
            type="submit"
            disabled={!configured || loading}
            className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send verification link"}
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
