"use client";

import { FormEvent, useState } from "react";
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
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Sign-in is temporarily unavailable.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(
        error.message.toLowerCase().includes("email not confirmed")
          ? "Confirm your email before signing in."
          : "That email and password combination was not accepted.",
      );
      setLoading(false);
      return;
    }

    window.location.assign(safeNext());
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-orange-500/40 bg-zinc-950 p-8">
        <h1 className="text-center text-3xl font-bold">Enter the Crucible</h1>
        <p className="mt-3 text-center text-sm leading-6 text-zinc-400">
          Sign in with your verified email and password. Your active trial or
          subscription is checked before the Forge opens.
        </p>
        <form onSubmit={handleSignIn} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-orange-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Password
            </span>
            <input
              type="password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="submit"
            disabled={!configured || loading || !email || !password}
            className="w-full rounded-lg bg-orange-600 py-3 font-bold hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {message ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-200">
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
