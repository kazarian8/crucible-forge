"use client";

import { FormEvent, Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const requestedNext = searchParams.get("next");

  const nextRoute =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/mastering";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
              nextRoute,
            )}`,
          },
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          router.replace(nextRoute);
          router.refresh();
          return;
        }

        setMessage(
          "Account created. Check your email and tap the confirmation link.",
        );
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      router.replace(nextRoute);
      router.refresh();
    } catch {
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setMessage("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-black/60 p-6 shadow-[0_25px_80px_rgba(0,0,0,.6)] backdrop-blur-xl sm:p-8">
        <a
          href="/"
          className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-300"
        >
          ← Crucible Forge
        </a>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">
          Crucible Account
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back." : "Enter the Forge."}
        </h1>

        <p className="mt-3 text-sm leading-6 text-white/50">
          {mode === "login"
            ? "Log in to continue your free quick-remaster submission."
            : "Create an account to claim your free quick-remaster sample and enter the giveaway."}
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
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="artist@email.com"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
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
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
            />
          </div>

          {message && (
            <div className="rounded-2xl border border-orange-300/20 bg-orange-400/10 px-4 py-3 text-sm leading-6 text-orange-100">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-orange-400 px-5 py-4 text-sm font-bold text-black transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Working..."
              : mode === "login"
                ? "Log In and Continue"
                : "Create Account and Continue"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs leading-5 text-white/35">
          After signup or login, you will continue directly to the free
          quick-remaster upload.
        </p>
      </section>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080604] text-white">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-2 border-orange-300/20 border-t-orange-400" />

        <p className="mt-4 text-sm text-white/45">
          Opening your Crucible account...
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}
