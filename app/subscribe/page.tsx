"use client";

import { useState } from "react";
import { CREDIT_PRICES } from "../../lib/credits/pricing";

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function startTrial() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        setMessage(payload.error ?? "Checkout could not be started.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setMessage("Checkout could not be started safely.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-xl rounded-3xl border border-orange-300/20 bg-black/70 p-6 shadow-2xl sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
          Crucible Pro
        </p>
        <h1 className="mt-4 text-4xl font-black">
          Start 30 days free.
        </h1>
        <p className="mt-4 leading-7 text-white/55">
          Add a card securely through Stripe. You will not be charged today.
          After 30 days, Crucible Pro renews at $19.99 per month until canceled.
        </p>

        <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5">
          <ul className="space-y-3 text-sm text-white/70">
            <li>• Sound Furnace and Crucible Engineer Mode</li>
            <li>• 5,000 credits each active billing month</li>
            <li>• Prompt Reforge: {CREDIT_PRICES.promptReforge} coins</li>
            <li>• Six-stem separation: {CREDIT_PRICES.stemSeparation} coins</li>
            <li>• Quick Master, Engineer Mode and 24-bit export: included</li>
            <li>• Browser-local audio processing and 24-bit WAV export</li>
            <li>• Cancel anytime through the secure billing portal</li>
          </ul>
        </div>

        <button
          type="button"
          onClick={startTrial}
          disabled={loading}
          className="mt-7 w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Opening secure checkout..." : "Add card and start free trial"}
        </button>

        <div className="mt-4 rounded-xl border border-sky-300/20 bg-sky-400/[0.07] p-4 text-sm leading-6 text-sky-50/75">
          <strong className="block text-sky-100">Already paid or received your 5,000 credits?</strong>
          You may be signed into a different account. Do not pay again.
          <a href="/auth/signout?next=/login" className="mt-2 block font-black text-sky-200 underline underline-offset-4">
            Switch to my existing account
          </a>
        </div>

        {message ? (
          <p role="alert" className="mt-4 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-100">
            {message}
          </p>
        ) : null}

        <p className="mt-5 text-center text-xs leading-5 text-white/35">
          Stripe handles payment details. Crucible never receives or stores your
          full card number.
        </p>
      </section>
    </main>
  );
}
