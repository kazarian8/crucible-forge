"use client";

import { FormEvent, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function VerifyEmailPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Email verification is temporarily unavailable.");
      return;
    }

    setLoading(true);
    setMessage("");
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/subscribe");

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: false,
      },
    });

    setLoading(false);
    setMessage(
      error
        ? error.message
        : "A fresh secure verification link is on its way. Check your inbox and spam folder.",
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
          Verify your email
        </p>
        <h1 className="mt-4 text-3xl font-black">One secure step first.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Open the Crucible link in your email. After verification, you will
          continue to Stripe to add a card and activate the 30-day free trial.
        </p>

        <form onSubmit={resend} className="mt-7">
          <label
            htmlFor="email"
            className="text-xs font-bold uppercase tracking-wider text-white/50"
          >
            Resend verification link
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
            {loading ? "Sending..." : "Send a new secure link"}
          </button>
        </form>

        {message ? (
          <p role="status" className="mt-4 rounded-xl border border-white/10 p-3 text-sm text-white/65">
            {message}
          </p>
        ) : null}

        <a href="/login" className="mt-6 block text-center text-sm text-white/45">
          Return to sign in
        </a>
      </section>
    </main>
  );
}
