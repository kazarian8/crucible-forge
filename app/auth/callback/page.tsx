"use client";

import { useEffect } from "react";

const DEFAULT_NEXT_ROUTE = "/sound-furnace";

function getSafeNextRoute() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : DEFAULT_NEXT_ROUTE;
}

export default function AuthCallbackPage() {
  useEffect(() => {
    const loginUrl = new URL("/login", window.location.origin);
    loginUrl.searchParams.set("next", getSafeNextRoute());
    loginUrl.searchParams.set("verified", "1");

    // Supabase has already verified the email before redirecting here.
    // Do not create a session from the confirmation link. Crucible requires
    // the user to sign in manually with the password they created at signup.
    window.location.replace(loginUrl.toString());
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/70 p-7 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Crucible verification</p>
        <h1 className="mt-4 text-2xl font-black">Email confirmed.</h1>
        <p className="mt-3 text-sm text-white/50">Taking you to sign in…</p>
      </section>
    </main>
  );
}
