"use client";

import { FormEvent, useEffect, useState } from "react";

function safeNext() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/sound-furnace";
}

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVerified(params.get("verified") === "1");
    if (params.get("error") === "session") {
      setMessage("Your sign-in expired before Crucible could open. Please sign in again.");
    } else if (params.get("error") === "service-unavailable") {
      setMessage("Sign-in service is temporarily unavailable. Please try again.");
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
          login: login.trim(),
          password,
        }),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = String(result.error || "");
        if (error === "account-not-found") {
          setMessage("No account found with that email or username.");
        } else if (error === "wrong-password") {
          setMessage("Incorrect password. Use the email sign-in link below if you need immediate access.");
        } else if (error === "email-not-verified") {
          setMessage("Verify your email before signing in.");
        } else if (error === "rate-limited") {
          setMessage("Too many sign-in attempts. Use the email sign-in link below or try again later.");
        } else if (response.status === 401) {
          setMessage("That email, username, or password was not accepted.");
        } else {
          setMessage("We couldn’t complete sign-in. Use the email sign-in link below.");
        }
        setLoading(false);
        return;
      }

      window.location.replace(safeNext());
    } catch {
      setMessage("We couldn’t complete sign-in. Use the email sign-in link below.");
      setLoading(false);
    }
  }

  async function handleEmailLink() {
    const email = login.trim().toLowerCase();
    if (!email.includes("@")) {
      setMessage("Enter your email address above, then tap Email me a sign-in link.");
      return;
    }

    setLinkLoading(true);
    setMessage("");
    try {
      const response = await fetch("/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ email, next: safeNext() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok && result.error === "rate-limited") {
        setMessage("Too many email-link requests. Please try again later.");
      } else if (!response.ok) {
        setMessage("We couldn’t send the sign-in link. Please try again.");
      } else {
        setMessage("Check your email and tap the secure Crucible sign-in link. No password required.");
      }
    } catch {
      setMessage("We couldn’t send the sign-in link. Please try again.");
    } finally {
      setLinkLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <section className="w-full max-w-md rounded-2xl border border-orange-500/40 bg-zinc-950 p-8">
        <h1 className="text-center text-3xl font-bold">Enter the Crucible</h1>
        <p className="mt-3 text-center text-sm leading-6 text-zinc-400">
          Sign in with your verified email or username and your password.
        </p>
        {verified ? (
          <p role="status" className="mt-4 rounded-lg border border-emerald-400/30 bg-emerald-400/10 p-3 text-center text-sm text-emerald-200">
            Email confirmed. Your account is enabled — sign in below.
          </p>
        ) : null}
        <form onSubmit={handleSignIn} className="mt-7 space-y-4" noValidate>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email or username</span>
            <input
              type="text"
              required
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Email address or username"
              autoComplete="username"
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
            disabled={loading || !login || !password}
            className="w-full rounded-lg bg-orange-600 py-3 font-bold hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-zinc-600">
          <span className="h-px flex-1 bg-zinc-800" />
          or
          <span className="h-px flex-1 bg-zinc-800" />
        </div>

        <button
          type="button"
          onClick={handleEmailLink}
          disabled={linkLoading || !login}
          className="w-full rounded-lg border border-orange-500/60 bg-orange-500/10 py-3 font-bold text-orange-200 hover:bg-orange-500/20 disabled:opacity-50"
        >
          {linkLoading ? "Sending secure link..." : "Email me a sign-in link"}
        </button>
        <p className="mt-2 text-center text-xs leading-5 text-zinc-500">
          Use your account email. This signs you in securely without your password.
        </p>

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
