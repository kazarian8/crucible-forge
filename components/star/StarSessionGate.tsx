"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

const RETRY_DELAYS_MS = [0, 350, 750, 1500, 2500, 4000];

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function StarSessionGate({
  children,
  signedIn,
}: {
  children: React.ReactNode;
  signedIn: boolean;
}) {
  const [ready, setReady] = useState(!signedIn);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      setReady(true);
      return;
    }

    let active = true;

    void (async () => {
      let nextAttempt = 0;

      while (active) {
        const delay = RETRY_DELAYS_MS[Math.min(nextAttempt, RETRY_DELAYS_MS.length - 1)];
        if (delay > 0) await wait(delay);
        if (!active) return;

        nextAttempt += 1;
        setAttempt(nextAttempt);

        try {
          const response = await fetch("/api/auth/normalize-session", {
            method: "POST",
            credentials: "same-origin",
            cache: "no-store",
          });

          if (response.ok) {
            if (active) setReady(true);
            return;
          }
        } catch {
          // Keep retrying while the server-rendered layout still has a valid user.
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [signedIn]);

  if (!ready) {
    return (
      <div className="mx-auto grid min-h-[22rem] max-w-6xl place-items-center px-4 text-white">
        <div className="rounded-2xl border border-sky-300/15 bg-[#07121b]/80 px-5 py-4 text-center text-sm font-black text-sky-100">
          <ShieldCheck className="mx-auto mb-2 animate-pulse" size={20} />
          Securing your CrucibleStar session…
          {attempt > 1 ? <p className="mt-1 text-[10px] font-bold text-white/45">Repairing browser session automatically.</p> : null}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
