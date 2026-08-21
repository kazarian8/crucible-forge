"use client";

import { FormEvent, useEffect, useState } from "react";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/sound-furnace";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVerified(params.get("verified") === "1");
    if (params.get("error") === "session") {
      setMessage("Your sign-in expired before Crucible could open. Please sign in again.");
    }
  }, []);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = String(result.error || "");
        if (error === "account-not-found") {
          setMessage("No account found with this email. Create an account instead.");
        } else if (error === "wrong-password") {
          setMessage("Incorrect password. Try again.");
        } else if (error === "email-not-verified") {
          setMessage("Verify your email before signing in.");
        } else if (error === "rate-limited") {
          setMessage("Too many sign-in attempts. Wait 15 minutes and try again.");
        } else if (response.status === 401) {
          setMessage("That email or password was not accepted.");
        } else {
          setMessage("We couldn’t complete sign-in. Please try again.");
        }
        setLoading(false);
        return;
      }

      window.location.replace(safeNext());
    } catch {
      setMessage("We couldn’t complete sign-in. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-orange-500/40 bg-zinc-950 p-8">
        <h1 className="text-center text-3xl font-bold">Enter the Crucible</h1>
        <p className="mt-3 text-center text-sm leading-6 text-zinc-400">
          Sign in with your verified email and the same password you created at signup.
        </p>
        {verified ? (
          <p role="status" className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-center text-sm text-emerald-200">
            Email confirmed. Your account is enabled — sign in with your password.
          </p>
        ) : null}
        <form onSubmit={handleSignIn} className="mt-7 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              autoComplete="email"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-orange-500"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-orange-600 py-3 font-bold hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        {message ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-200">{message}</p>
        ) : null}
        <a href="/signup" className="mt-6 block text-center text-sm text-orange-300">
          Create a new account
        </a>
      </section>
    </main>
  );
}
