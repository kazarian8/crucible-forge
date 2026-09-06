"use client";

import { useEffect } from "react";
import { createClient } from "../lib/supabase/client";

export default function AuthRecoveryRedirect() {
  useEffect(() => {
    let active = true;

    async function catchRecovery() {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const type = query.get("type") ?? hash.get("type");
      const code = query.get("code");
      const tokenHash = query.get("token_hash");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      const looksLikeRecovery =
        type === "recovery" ||
        Boolean(accessToken && refreshToken) ||
        Boolean(tokenHash && type === "recovery");

      if (!looksLikeRecovery) return;

      try {
        const supabase = createClient();

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type === "recovery") {
          const { error } = await supabase.auth.verifyOtp({
            type: "recovery",
            token_hash: tokenHash,
          });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          return;
        }

        if (!active) return;
        window.history.replaceState({}, "", "/reset-password");
        window.location.replace("/reset-password");
      } catch {
        if (!active) return;
        const failed = new URL("/forgot-password", window.location.origin);
        failed.searchParams.set("error", "recovery");
        window.history.replaceState({}, "", failed.pathname + failed.search);
        window.location.replace(failed.toString());
      }
    }

    void catchRecovery();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
