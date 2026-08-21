import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function sharedDomain(request: NextRequest) {
  const hostname = (request.headers.get("x-forwarded-host") ?? request.nextUrl.hostname)
    .split(",")[0].trim().split(":")[0].toLowerCase();
  return hostname === "crucibleforge.org" || hostname === "www.crucibleforge.org" ? ".crucibleforge.org" : undefined;
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    if (!email || !password || password.length > 128) {
      return NextResponse.json({ error: "invalid-credentials" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are missing.");

    // The dedicated server/admin client uses the new Crucible Supabase secret.
    const admin = createAdminClient();
    const { data: guardData, error: guardError } = await admin.rpc("consume_login_attempt", { p_ip: getClientIp(request), p_email: email });
    if (guardError) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
    const guard = Array.isArray(guardData) ? guardData[0] : guardData;
    if (guard && guard.allowed === false) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } });
    }

    // Password authentication must start from a clean, cookie-free client.
    // This prevents an old browser refresh token from blocking a valid login.
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return NextResponse.json({ error: "invalid-credentials" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }

    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    const domain = sharedDomain(request);
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    const authCookieName = `sb-${projectRef}-auth-token`;

    // Remove stale auth cookies at both host and shared-domain scopes.
    const staleNames = new Set(request.cookies.getAll().map(({ name }) => name).filter((name) => name.startsWith("sb-") || name.includes("auth-token")));
    staleNames.add(authCookieName);
    staleNames.forEach((name) => {
      response.cookies.set(name, "", { path: "/", expires: new Date(0), maxAge: 0 });
      if (domain) response.cookies.set(name, "", { path: "/", domain, expires: new Date(0), maxAge: 0 });
    });

    // Supabase SSR reads this cookie on the next request. JSON encoding matches
    // the storage format expected by the current Supabase SSR client.
    const cookieValue = JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
      user: data.session.user,
    });
    response.cookies.set(authCookieName, cookieValue, {
      path: "/", httpOnly: false, sameSite: "lax", secure: true,
      ...(domain ? { domain } : {}),
    });
    return response;
  } catch {
    return NextResponse.json({ error: "service-unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
