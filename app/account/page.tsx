"use client";

import { useState } from "react";

export default function AccountPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function managePlan() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = await response.json();

      if (!response.ok || !payload.url) {
        setMessage(payload.error ?? "Billing portal unavailable.");
        return;
      }

      window.location.assign(payload.url);
    } catch {
      setMessage("Billing portal unavailable.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
      <section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">
          Crucible account
        </p>
        <h1 className="mt-3 text-3xl font-black">Manage your Pro plan.</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Update your card, review billing, or cancel securely through Stripe.
        </p>
        <button
          type="button"
          onClick={managePlan}
          disabled={loading}
          className="mt-7 w-full rounded-xl bg-orange-500 px-5 py-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Opening..." : "Open secure billing portal"}
        </button>
        {message ? <p role="alert" className="mt-4 text-sm text-red-200">{message}</p> : null}
        <a href="/sound-furnace" className="mt-5 block text-center text-sm text-white/45">
          Return to Sound Furnace
        </a>
      </section>
    </main>
  );
}
