"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../../lib/supabase/client";

const DEFAULT_NEXT_ROUTE = "/sound-furnace";

function getSafeNextRoute() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : DEFAULT_NEXT_ROUTE;
}

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Completing secure sign-in…");

  useEffect(() => {
    let active = true;

    async function completeSignIn() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = getSafeNextRoute();

      if (!code) {
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", next);
        loginUrl.searchParams.set("verified", "1");
        window.location.replace(loginUrl.toString());
        return;
      }

      try {
        const supabase = createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        window.location.replace(next);
      } catch {
        if (active) setMessage("Secure sign-in failed. Returning to login…");
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", next);
        loginUrl.searchParams.set("error", "session");
        window.setTimeout(() => window.location.replace(loginUrl.toString()), 700);
      }
    }

    void completeSignIn();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible verification</p>
        <h1 className="mt-4 text-2xl font-black">Email confirmed.</h1>
        <p className="mt-3 text-sm text-white/50">{message}</p>
      </section>
    </main>
  );
}
