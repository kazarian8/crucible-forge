"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient, isSupabaseConfigured } from "../../../lib/supabase/client";

const DEFAULT_NEXT_ROUTE = "/sound-furnace";

function getSafeNextRoute() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : DEFAULT_NEXT_ROUTE;
}

export default function AuthCallbackPage() {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createClient() : null), [configured]);
  const [message, setMessage] = useState("Confirming your Crucible account…");

  useEffect(() => {
    if (!supabase) {
      setMessage("Account confirmation is temporarily unavailable.");
      return;
    }

    let active = true;

    async function completeConfirmation() {
      const nextRoute = getSafeNextRoute();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (!session) {
            throw new Error("No confirmation session was returned.");
          }
        }

        if (!active) return;
        setMessage("Email confirmed. Signing you in…");
        window.location.replace(nextRoute);
      } catch {
        if (!active) return;
        const loginUrl = new URL("/login", window.location.origin);
        loginUrl.searchParams.set("next", nextRoute);
        loginUrl.searchParams.set("error", "invalid-link");
        window.location.replace(loginUrl.toString());
      }
    }

    void completeConfirmation();

    return () => {
      active = false;
    };
  }, [supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible verification</p>
        <h1 className="mt-4 text-2xl font-black">{message}</h1>
        <p className="mt-3 text-sm text-white/50">Keep this page open for a moment.</p>
      </section>
    </main>
  );
}
