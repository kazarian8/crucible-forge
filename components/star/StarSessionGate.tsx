"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";

export default function StarSessionGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await fetch("/api/auth/normalize-session", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
      } catch {
        // The Star page still renders for signed-out/demo users. Authenticated
        // actions will show their normal error if the session truly is invalid.
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto grid min-h-[22rem] max-w-6xl place-items-center px-4 text-white">
        <div className="rounded-2xl border border-sky-300/15 bg-[#07121b]/80 px-5 py-4 text-center text-sm font-black text-sky-100">
          <ShieldCheck className="mx-auto mb-2 animate-pulse" size={20} />
          Syncing secure CrucibleStar session…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
