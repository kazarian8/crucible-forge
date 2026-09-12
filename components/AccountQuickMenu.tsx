"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Repeat2, Settings, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createClient, isSupabaseConfigured } from "../lib/supabase/client";

type ProfileResponse = {
  profile?: {
    username?: string | null;
    username_font?: "default" | "gochi_hand";
  } | null;
};

type AccountSummary = {
  email: string | null;
  profile: ProfileResponse["profile"];
};

export default function AccountQuickMenu() {
  const pathname = usePathname();
  const [account, setAccount] = useState<AccountSummary | null | undefined>(undefined);
  const [open, setOpen] = useState(false);

  const hidden = useMemo(
    () =>
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/verify-email") ||
      pathname.startsWith("/auth/callback"),
    [pathname],
  );

  useEffect(() => {
    setOpen(false);
    if (hidden || !isSupabaseConfigured()) {
      setAccount(null);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    void Promise.all([
      supabase.auth.getUser(),
      fetch("/api/profile/username", { cache: "no-store" })
        .then(async (response) => (response.ok ? ((await response.json()) as ProfileResponse) : null))
        .catch(() => null),
    ]).then(([userResult, profilePayload]) => {
      if (cancelled) return;
      const user = userResult.data.user;
      if (!user) {
        setAccount(null);
        return;
      }
      setAccount({
        email: user.email ?? null,
        profile: profilePayload?.profile ?? null,
      });
    }).catch(() => {
      if (!cancelled) setAccount(null);
    });

    return () => {
      cancelled = true;
    };
  }, [hidden, pathname]);

  if (hidden || !account) return null;

  const username = account.profile?.username?.trim();
  const usernameStyle = account.profile?.username_font === "gochi_hand"
    ? { fontFamily: "var(--font-gochi-hand)" }
    : undefined;
  const buttonLabel = username ? `@${username}` : account.email?.split("@")[0] || "Account";

  return (
    <div className="fixed right-3 top-3 z-[70] text-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-white/12 bg-[#0b0907]/95 px-2.5 py-2 shadow-[0_12px_45px_rgba(0,0,0,.45)] backdrop-blur-xl transition hover:border-orange-300/25"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Open Crucible account menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-orange-300/25 bg-orange-400/10 text-orange-200">
          <UserRound size={16} aria-hidden="true" />
        </span>
        <span className="max-w-36 truncate text-sm font-black text-white/90" style={usernameStyle}>{buttonLabel}</span>
        <ChevronDown size={14} className={`text-white/45 transition ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open ? (
        <div role="menu" className="absolute right-0 mt-2 w-72 overflow-hidden rounded-2xl border border-white/12 bg-[#0b0907]/98 shadow-[0_18px_60px_rgba(0,0,0,.55)] backdrop-blur-xl">
          <div className="border-b border-white/8 px-4 py-4">
            <p className="truncate text-sm font-black text-white" style={usernameStyle}>{username ? `@${username}` : "Crucible account"}</p>
            <p className="mt-1 truncate text-xs text-white/45">{account.email ?? "Email unavailable"}</p>
          </div>

          <div className="p-2">
            <Link
              href="/account"
              role="menuitem"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-white/75 transition hover:bg-white/[0.06] hover:text-white"
            >
              <Settings size={16} aria-hidden="true" />
              Profile & account settings
            </Link>

            <form action="/auth/signout?next=/login?switch=1" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-white/65 transition hover:bg-sky-400/10 hover:text-sky-100"
              >
                <Repeat2 size={16} aria-hidden="true" />
                Switch account
              </button>
            </form>

            <form action="/auth/signout?next=/login" method="post">
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold text-red-200/80 transition hover:bg-red-400/10 hover:text-red-100"
              >
                <LogOut size={16} aria-hidden="true" />
                Log out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
