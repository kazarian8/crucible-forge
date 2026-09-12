"use client";

import { FormEvent, useState } from "react";

function safeNext() {
  if (typeof window === "undefined") return "/subscribe";
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/subscribe";
}

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email: email.trim().toLowerCase(), next: safeNext() }),
      });
      const payload = await response.json().catch(() => ({}));
      setLoading(false);

      if (!response.ok) {
        setIsError(true);
        setMessage(
          response.status === 429
            ? "Too many verification emails were requested. Try again shortly."
            : payload.error ?? "Verification email could not be sent right now.",
        );
        return;
      }

      setMessage("If that address has a pending Crucible signup, a fresh verification email has been sent.");
    } catch {
      setLoading(false);
      setIsError(true);
      setMessage("Verification email could not be sent right now.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Email verification required</p>
        <h1 className="mt-4 text-3xl font-black">Check your inbox.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Your Crucible account stays locked until the email address is confirmed. Forge, CrucibleStar, uploads, credits, publishing, and account tools stay unavailable before verification.
        </p>

        <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] p-4 text-sm leading-6 text-amber-50/80">
          Verification does not bypass billing. After confirmation, Crucible still checks for an active trial, Pro subscription, or authorized developer pass before opening paid Forge tools.
        </div>

        <ol className="mt-6 space-y-3 text-sm text-white/70">
          <li><strong className="text-white">1.</strong> Open the confirmation email from Crucible.</li>
          <li><strong className="text-white">2.</strong> Tap the verification link.</li>
          <li><strong className="text-white">3.</strong> Continue to the trial/payment gate, then Forge.</li>
        </ol>

        <form onSubmit={resend} className="mt-7 space-y-3">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-white/45">Need another verification email?</span>
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
          <button type="submit" disabled={loading || !email} className="w-full rounded-xl border border-orange-300/30 bg-orange-400/10 px-5 py-4 font-black text-orange-100 disabled:opacity-50">
            {loading ? "Sending..." : "Resend verification email"}
          </button>
        </form>

        {message ? (
          <p role={isError ? "alert" : "status"} className={`mt-4 rounded-xl border p-3 text-sm ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}>
            {message}
          </p>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <a href="/signup" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/65">Use another email</a>
          <a href="/login" className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-white/65">Back to sign in</a>
        </div>
      </section>
    </main>
  );
}
