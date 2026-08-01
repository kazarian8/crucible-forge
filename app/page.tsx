"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the sign-in link.");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-orange-500/40 rounded-2xl p-8 bg-zinc-950">
        <h1 className="text-3xl font-bold text-center mb-2">
          Enter the Crucible
        </h1>

        <p className="text-zinc-400 text-center mb-8">
          Sign in to access the Sound Furnace.
        </p>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          className="w-full rounded-lg bg-zinc-900 border border-zinc-700 px-4 py-3 mb-4 outline-none focus:border-orange-500"
        />

        <button
          onClick={handleSignIn}
          disabled={loading || !email}
          className="w-full rounded-lg bg-orange-600 hover:bg-orange-500 disabled:opacity-50 py-3 font-bold"
        >
          {loading ? "Sending..." : "Sign In"}
        </button>

        {message && (
          <p className="text-sm text-center text-zinc-300 mt-4">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
