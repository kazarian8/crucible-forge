"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/sound-furnace";
}

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const supabase = configured ? createClient() : null;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!supabase) {
      setMessage("Sign-in is temporarily unavailable.");
      return;
    }

    setLoading(true);
    setMessage("");

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeNext());

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: callback.toString(),
        shouldCreateUser: false,
      },
    });

    setMessage(
      error
        ? error.message
        : "Check your inbox and tap the secure sign-in link. Access is not granted until the link is opened.",
    );
    setLoading(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-orange-500/40 bg-zinc-950 p-8">
        <h1 className="text-center text-3xl font-bold">Enter the Crucible</h1>
        <p className="mt-3 text-center text-sm leading-6 text-zinc-400">
          We send a one-time link to your verified inbox. A password alone never
          opens the Forge.
        </p>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="mt-7 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-orange-500"
        />
        <button
          type="button"
          onClick={handleSignIn}
          disabled={!configured || loading || !email}
          className="mt-4 w-full rounded-lg bg-orange-600 py-3 font-bold hover:bg-orange-500 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Email secure sign-in link"}
        </button>
        {message ? (
          <p role="status" className="mt-4 text-center text-sm text-zinc-300">
            {message}
          </p>
        ) : null}
        <a href="/signup" className="mt-6 block text-center text-sm text-orange-300">
          Create a new account
        </a>
      </section>
    </main>
  );
}
