import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function sharedDomain(request: NextRequest) {
  const hostname = (request.headers.get("x-forwarded-host") ?? request.nextUrl.hostname)
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();

  return hostname === "crucibleforge.org" || hostname === "www.crucibleforge.org"
    ? ".crucibleforge.org"
    : undefined;
}

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password || password.length > 128) {
      return NextResponse.json(
        { error: "invalid-credentials" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    const admin = createAdminClient();
    const { data: guardData, error: guardError } = await admin.rpc(
      "consume_login_attempt",
      { p_ip: getClientIp(request), p_email: email },
    );

    if (guardError) {
      return NextResponse.json(
        { error: "service-unavailable" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const guard = Array.isArray(guardData) ? guardData[0] : guardData;
    if (guard && guard.allowed === false) {
      return NextResponse.json(
        { error: "rate-limited" },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": "900",
          },
        },
      );
    }

    // Start from a clean auth state. /auth/* is excluded from the proxy, so an
    // expired browser refresh token cannot be consumed before password auth.
    const pendingCookies: PendingCookie[] = [];
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json(
        { error: "invalid-credentials" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );

    const domain = sharedDomain(request);

    // Clear stale Supabase cookies first, including both host-only and shared
    // crucibleforge.org variants. Then let @supabase/ssr write its native cookie
    // format instead of manually serializing the session.
    const staleNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
    );

    pendingCookies.forEach(({ name }) => staleNames.add(name));

    staleNames.forEach((name) => {
      response.cookies.set(name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
      if (domain) {
        response.cookies.set(name, "", {
          path: "/",
          domain,
          expires: new Date(0),
          maxAge: 0,
        });
      }
    });

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(
        name,
        value,
        domain ? { ...options, domain } : options,
      );
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "service-unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
