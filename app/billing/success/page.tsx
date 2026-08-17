"use client";

import { useEffect, useState } from "react";

export default function BillingSuccessPage() {
  const [message, setMessage] = useState(
    "Confirming your trial and preparing the Forge...",
  );

  useEffect(() => {
    let canceled = false;

    async function confirm() {
      const sessionId = new URLSearchParams(window.location.search).get(
        "session_id",
      );

      if (!sessionId) {
        setMessage("The Stripe checkout reference is missing. Return to Account and try again.");
        return;
      }

      const confirmation = await fetch("/api/billing/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const confirmationPayload = await confirmation.json();

      if (canceled) return;

      if (confirmation.ok && confirmationPayload.confirmed) {
        window.location.replace("/sound-furnace");
        return;
      }

      setMessage(
        confirmationPayload.error ??
          "Stripe confirmed checkout, but access could not be prepared.",
      );
    }

    void confirm();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="max-w-md rounded-3xl border border-emerald-300/20 bg-emerald-400/[0.06] p-8 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-emerald-200/20 border-t-emerald-300" />
        <h1 className="mt-5 text-2xl font-black">Trial received.</h1>
        <p className="mt-3 text-sm leading-6 text-white/55">{message}</p>
      </section>
    </main>
  );
}
