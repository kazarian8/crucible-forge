import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function serializeCookie(name: string, value: string, options: CookieOptions) {
  const temporaryResponse = NextResponse.next();
  temporaryResponse.cookies.set(name, value, options);
  return temporaryResponse.headers.get("set-cookie");
}

function appendCookie(response: NextResponse, name: string, value: string, options: CookieOptions) {
  const serialized = serializeCookie(name, value, options);
  if (serialized) response.headers.append("set-cookie", serialized);
}

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

    const admin = createAdminClient();
    const { data: guardData, error: guardError } = await admin.rpc("consume_login_attempt", {
      p_ip: getClientIp(request), p_email: email,
    });
    if (guardError) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
    const guard = Array.isArray(guardData) ? guardData[0] : guardData;
    if (guard && guard.allowed === false) {
      return NextResponse.json({ error: "rate-limited" }, { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } });
    }

    const cookiesToSet: PendingCookie[] = [];
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return []; },
        setAll(cookies) { cookiesToSet.push(...cookies); },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: "invalid-credentials" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });

    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    const domain = sharedDomain(request);
    const staleCookieNames = new Set(request.cookies.getAll().map(({ name }) => name).filter((name) => name.startsWith("sb-") || name.includes("auth-token")));
    cookiesToSet.forEach(({ name }) => staleCookieNames.add(name));
    staleCookieNames.forEach((name) => {
      appendCookie(response, name, "", { path: "/", expires: new Date(0), maxAge: 0 });
      if (domain) appendCookie(response, name, "", { path: "/", domain, expires: new Date(0), maxAge: 0 });
    });
    cookiesToSet.forEach(({ name, value, options }) => appendCookie(response, name, value, domain ? { ...options, domain } : options));
    return response;
  } catch {
    return NextResponse.json({ error: "service-unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
