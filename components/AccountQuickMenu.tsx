"use client";

import Link from "next/link";
import { LogOut, Repeat2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type ProfileResponse = {
  profile?: {
    username?: string | null;
    username_font?: "default" | "gochi_hand";
  } | null;
};

export default function AccountQuickMenu() {
  const [profile, setProfile] = useState<ProfileResponse["profile"] | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/profile/username", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ProfileResponse;
      })
      .then((payload) => {
        if (!cancelled) setProfile(payload?.profile ?? null);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!profile) return null;

  const username = profile.username?.trim();
  const usernameStyle = profile.username_font === "gochi_hand"
    ? { fontFamily: "var(--font-gochi-hand)" }
    : undefined;

  return (
    <div className="fixed bottom-[9.75rem] right-3 z-[46] flex max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-2xl border border-white/12 bg-[#0b0907]/95 p-1.5 text-white shadow-[0_12px_45px_rgba(0,0,0,.45)] backdrop-blur-xl">
      <Link
        href="/account"
        className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-white/85 transition hover:bg-white/[0.06] hover:text-white"
        aria-label="Open Crucible account"
        title="Open account"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 text-orange-200">
          <UserRound size={16} aria-hidden="true" />
        </span>
        <span className="max-w-36 truncate" style={usernameStyle}>
          {username ? `@${username}` : "Account"}
        </span>
      </Link>

      <form action="/auth/signout?next=/login?switch=1" method="post">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/60 transition hover:border-sky-300/25 hover:bg-sky-400/10 hover:text-sky-100"
          title="Switch account"
        >
          <Repeat2 size={14} aria-hidden="true" />
          <span>Switch</span>
        </button>
      </form>

      <form action="/auth/signout?next=/login" method="post">
        <button
          type="submit"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-black text-white/60 transition hover:border-red-300/25 hover:bg-red-400/10 hover:text-red-100"
          title="Log out"
        >
          <LogOut size={14} aria-hidden="true" />
          <span>Log out</span>
        </button>
      </form>
    </div>
  );
}
