"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Checking your recovery session…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error || !user) {
          setReady(false);
          setIsError(true);
          setMessage("This recovery link is invalid or expired. Request a new password-reset email.");
        } else {
          setReady(true);
          setIsError(false);
          setMessage("Recovery link verified. Choose a new password below.");
        }
      } catch {
        if (!active) return;
        setReady(false);
        setIsError(true);
        setMessage("This recovery link could not be verified. Request a new one.");
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready) return;
    if (password.length < 12) {
      setMessage("Use a password with at least 12 characters.");
      setIsError(true);
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      setIsError(true);
      return;
    }

    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setMessage("Password updated. You can sign in with your new password now.");
      setReady(false);
      window.setTimeout(() => window.location.replace("/login?password_reset=1"), 900);
    } catch {
      setMessage("Crucible could not update the password. Request a new recovery link and try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-orange-300/20 bg-zinc-950 p-7">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-300">Secure recovery</p>
        <h1 className="mt-4 text-3xl font-black">Choose a new password.</h1>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">New password</span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              disabled={!ready || checking}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 12 characters"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 outline-none focus:border-orange-500 disabled:opacity-40"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Confirm new password</span>
            <input
              type={showPassword ? "text" : "password"}
              required
              minLength={12}
              disabled={!ready || checking}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="Repeat your new password"
              autoComplete="new-password"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-4 outline-none focus:border-orange-500 disabled:opacity-40"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-400">
            <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-orange-400" />
            <span>{showPassword ? "Hide password" : "Show password"}</span>
          </label>
          <button
            type="submit"
            disabled={!ready || checking || loading || !password || !confirmation}
            className="w-full rounded-xl bg-gradient-to-r from-orange-600 to-amber-400 px-5 py-4 font-black text-black disabled:opacity-50"
          >
            {loading ? "Updating password..." : "Set new password"}
          </button>
        </form>

        {message ? (
          <p role={isError ? "alert" : "status"} className={`mt-4 rounded-xl border p-3 text-sm leading-5 ${isError ? "border-red-300/20 text-red-100" : "border-emerald-300/20 text-emerald-100"}`}>
            {message}
          </p>
        ) : null}

        {!ready && !checking ? <a href="/forgot-password" className="mt-5 block text-center text-sm font-bold text-orange-300">Request another reset link</a> : null}
      </section>
    </main>
  );
}
