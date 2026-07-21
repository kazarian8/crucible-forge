"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

export default function WinnerLoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setStatus("error");
      setMessage("Enter the email address connected to your winning entry.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/winners`,
          shouldCreateUser: false,
        },
      });

      if (error) {
        throw error;
      }

      setStatus("sent");
      setMessage(
        "Check your email. We sent you a secure sign-in link for the Founding Artist Portal.",
      );
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The sign-in link could not be sent.",
      );
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-5 py-16 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(249,115,22,0.2),transparent_48%)]" />

      <div className="relative w-full max-w-lg">
        <a
          href="/"
          className="mb-8 inline-flex text-sm font-bold uppercase tracking-[0.2em] text-orange-400 transition hover:text-orange-300"
        >
          ← Crucible Forge
        </a>

        <section className="rounded-3xl border border-orange-500/25 bg-zinc-950/95 p-7 shadow-[0_0_80px_rgba(249,115,22,0.12)] sm:p-10">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-500/30 bg-orange-500/10 text-3xl">
            🔥
          </div>

          <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-400">
            Founding Artist Portal
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            Winner Sign In
          </h1>

          <p className="mt-4 leading-7 text-zinc-400">
            Enter the email address connected to your winning entry. We will
            send you a secure sign-in link—no password required.
          </p>

          <form onSubmit={handleLogin} className="mt-8">
            <label htmlFor="winner-email" className="block">
              <span className="mb-2 block text-sm font-bold text-zinc-200">
                Winner email address
              </span>

              <input
                id="winner-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="artist@example.com"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </label>

            <button
              type="submit"
              disabled={status === "sending"}
              className="mt-6 w-full rounded-xl bg-orange-500 px-6 py-4 text-lg font-black text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "sending"
                ? "Sending Secure Link..."
                : "Email My Sign-In Link"}
            </button>
          </form>

          {message && (
            <div
              role="status"
              className={`mt-6 rounded-xl border p-4 text-sm leading-6 ${
                status === "sent"
                  ? "border-green-500/30 bg-green-500/10 text-green-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-xs leading-5 text-zinc-500">
              Access is limited to verified Crucible winners. Entering the
              giveaway does not automatically unlock this portal.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
