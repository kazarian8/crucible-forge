"use client";

import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setMessage("Enter the email address on your Crucible account.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/auth/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: normalized }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok && result.error === "rate-limited") {
        setMessage("Too many reset requests. Wait a little and try again.");
        setIsError(true);
      } else if (!response.ok) {
        setMessage("Password recovery is temporarily unavailable. Please try again.");
        setIsError(true);
      } else {
        setMessage("If that email belongs to a Crucible account, a password-reset link is on the way. Check your inbox and spam folder.");
      }
    } catch {
      setMessage("Password recovery is temporarily unavailable. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-zinc-950 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Account recovery</p>
        <h1 className="mt-4 text-3xl font-black">Reset your password.</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Enter the email address on your Crucible account. We’ll send a secure recovery link.</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="artist@email.com"
              autoComplete="email"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? "Sending reset link..." : "Send password-reset link"}
          </button>
        </form>

        {message ? (
          <p role={isError ? "alert" : "status"} className={`mt-4 rounded-xl border p-3 text-sm leading-5 ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}>
            {message}
          </p>
        ) : null}

        <a href="/login" className="mt-6 block text-center text-sm font-bold text-orange-300">Back to sign in</a>
      </section>
    </main>
  );
}
