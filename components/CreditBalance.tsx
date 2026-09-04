"use client";

import { Flame } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type BillingStatus = {
  authenticated?: boolean;
  creditBalance?: number;
};

export const CREDITS_UPDATED_EVENT = "crucible:credits-updated";

export default function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/billing/status", {
        cache: "no-store",
      });
      const payload = (await response.json()) as BillingStatus;
      setBalance(
        payload.authenticated ? Math.max(0, payload.creditBalance ?? 0) : null,
      );
    } catch {
      setBalance(null);
    }
  }, []);

  useEffect(() => {
    void refresh();
    window.addEventListener(CREDITS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(CREDITS_UPDATED_EVENT, refresh);
  }, [refresh]);

  if (balance === null) return null;

  return (
    <div
      className="fixed bottom-[5.75rem] right-3 z-[45] flex items-center gap-2 rounded-full border border-amber-200/35 bg-[#120c04]/95 py-2 pl-2 pr-4 text-amber-50 shadow-[0_12px_45px_rgba(245,158,11,.28)] backdrop-blur-xl"
      aria-label={`Crucible credits: ${balance.toLocaleString()}`}
      title="Crucible credit balance"
    >
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-amber-100/55 bg-gradient-to-br from-amber-200 via-orange-400 to-amber-700 text-[#1b0d02] shadow-[inset_0_1px_2px_rgba(255,255,255,.7)]">
        <Flame size={17} fill="currentColor" aria-hidden="true" />
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-amber-100/50 bg-[#2a1303] text-[8px] font-black text-amber-200">
          C
        </span>
      </span>
      <span className="font-mono text-sm font-black tabular-nums">
        {balance.toLocaleString()}
      </span>
    </div>
  );
}

