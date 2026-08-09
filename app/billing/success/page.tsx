"use client";

import { useEffect, useState } from "react";

export default function BillingSuccessPage() {
  const [message, setMessage] = useState(
    "Confirming your trial and preparing the Forge...",
  );

  useEffect(() => {
    let canceled = false;
    let attempts = 0;

    async function check() {
      attempts += 1;
      const response = await fetch("/api/billing/status", {
        cache: "no-store",
      });
      const payload = await response.json();

      if (canceled) return;

      if (payload.entitled) {
        window.location.replace("/sound-furnace");
        return;
      }

      if (attempts < 15) {
        window.setTimeout(check, 1000);
      } else {
        setMessage(
          "Stripe confirmed checkout, but access is still syncing. Refresh this page in a moment.",
        );
      }
    }

    void check();

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
