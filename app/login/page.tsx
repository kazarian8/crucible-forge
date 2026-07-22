"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

function getSafeNextRoute() {
  if (typeof window === "undefined") {
    return "/mastering";
  }

  const searchParams = new URLSearchParams(window.location.search);
  const requestedNext = searchParams.get("next");

  if (
    requestedNext &&
    requestedNext.startsWith("/") &&
    !requestedNext.startsWith("//")
  ) {
    return requestedNext;
  }

  return "/mastering";
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<AuthMode>("login");
  const [nextRoute, setNextRoute] = useState("/mastering");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    setNextRoute(getSafeNextRoute());

    let active = true;

    async function checkExistingSession() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!active) return;

        if (user) {
          router.replace(getSafeNextRoute());
          router.refresh();
          return;
        }
      } catch {
        // The login form will remain available if session checking fails.
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkExistingSession();

    return () => {
      active = false;
    };
  }, [router, supabase]);

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setMessage("");
    setIsError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setMessage("Enter your email address.");
      setIsError(true);
      return;
    }

    if (password.length < 6) {
      setMessage("Your password must contain at least 6 characters.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      if (mode === "signup") {
        const callbackUrl = new URL(
          "/auth/callback",
          window.location.origin,
        );

        callbackUrl.searchParams.set("next", nextRoute);

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
          },
        });

        if (error) {
          setMessage(error.message);
          setIsError(true);
          return;
        }

        if (data.session) {
          router.replace(nextRoute);
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email and tap the confirmation link to continue to your free quick-remaster upload.",
        );
        setIsError(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setMessage(error.message);
        setIsError(true);
        return;
      }

      router.replace(nextRoute);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-orange-300/20 border-t-orange-400" />

          <p className="mt-5 text-sm text-white/45">
            Opening your Crucible account...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080604] px-5 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(249,115,22,.2),transparent_36%),linear-gradient(to_bottom,#120905,#080604_55%,#020202)]" />

      <section className="relative z-10 w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/65 p-6 shadow-[0_25px_80px_rgba(0,0,0,.7)] backdrop-blur-xl sm:p-8">
        <a
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300 transition hover:text-orange-200"
        >
          ← Crucible Forge
        </a>

        <div className="mt-8 inline-flex rounded-full border border-orange-300/20 bg-orange-400/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-200">
          Free quick-remaster access
        </div>

        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {mode === "login"
            ? "Welcome back to the Forge."
            : "Enter the Crucible giveaway."}
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/55">
          {mode === "login"
            ? "Log in to continue directly to your free quick-remaster submission."
            : "Create your account to claim a free quick-remaster sample and enter for a chance to win a complete Justice Full Forge remaster and distribution."}
        </p>

        <div className="mt-7 grid grid-cols-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => changeMode("login")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "login"
                ? "bg-orange-400 text-black"
                : "text-white/55 hover:text-white"
            }`}
          >
            Log In
          </button>

          <button
            type="button"
            onClick={() => changeMode("signup")}
            className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
              mode === "signup"
                ? "bg-orange-400 text-black"
                : "text-white/55 hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              inputMode="email"
              autoCapitalize="none"
              autoComplete="email"
              required
              disabled={loading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="artist@email.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50 disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-xs font-semibold uppercase tracking-[0.16em] text-white/55"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              disabled={loading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50 disabled:opacity-50"
            />
          </div>

          {message && (
            <div
              role={isError ? "alert" : "status"}
              className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
                isError
                  ? "border-red-300/20 bg-red-400/10 text-red-100"
                  : "border-green-300/20 bg-green-400/10 text-green-100"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-5 py-4 text-sm font-bold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Working..."
              : mode === "login"
                ? "Log In and Continue"
                : "Create Account and Enter"}
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <p className="text-xs leading-5 text-white/40">
            After signup or login, you will continue directly to the secure
            track-upload page for your free quick-remaster sample.
          </p>
        </div>

        <p className="mt-5 text-center text-[10px] leading-5 text-white/30">
          You retain ownership of your music. Giveaway entry does not guarantee
          selection as the full-remaster and distribution winner.
        </p>
      </section>
    </main>
  );
}
