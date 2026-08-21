import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
      usernameFont?: "default" | "gochi_hand";
      next?: string;
      website?: string;
      startedAt?: number;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const username = body.username?.trim() ?? "";
    const usernameFont = body.usernameFont === "gochi_hand" ? "gochi_hand" : "default";
    const startedAt = Number(body.startedAt || 0);
    const now = Date.now();

    if (body.website) return NextResponse.json({ error: "blocked" }, { status: 400 });
    if (!startedAt || now - startedAt < 2500 || now - startedAt > 30 * 60 * 1000) {
      return NextResponse.json({ error: "blocked" }, { status: 400 });
    }
    if (!email || !password || !/^[A-Za-z0-9_]{3,24}$/.test(username) || password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    }

    const admin = createAdminClient();
    const ip = getClientIp(request);
    const { data: guardData, error: guardError } = await admin.rpc("consume_signup_attempt", { p_ip: ip, p_email: email });
    if (guardError) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });

    const guard = Array.isArray(guardData) ? guardData[0] : guardData;
    if (guard && guard.allowed === false) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429, headers: { "Retry-After": "900" } });
    }

    const { data: usernameAvailable, error: usernameError } = await admin.rpc("username_available", { p_username: username });
    if (usernameError || !usernameAvailable) return NextResponse.json({ error: "username-unavailable" }, { status: 409 });

    const supabase = await createClient();
    const origin = request.nextUrl.origin;
    const callback = new URL("/auth/callback", origin);
    const safeNext = body.next?.startsWith("/") && !body.next.startsWith("//") ? body.next : "/subscribe";
    callback.searchParams.set("next", safeNext);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callback.toString(), data: { username, username_font: usernameFont } },
    });

    if (error) {
      const lower = error.message.toLowerCase();
      const status = lower.includes("rate") ? 429 : 400;
      return NextResponse.json({ error: status === 429 ? "rate-limited" : "signup-failed" }, { status });
    }
    if (data.user && data.user.identities?.length === 0) return NextResponse.json({ error: "signup-failed" }, { status: 409 });

    return NextResponse.json({ ok: true, pendingVerification: !data.session }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
  }
}
