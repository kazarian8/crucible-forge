import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

type PendingCookie = { name: string; value: string; options: CookieOptions };

type UserSummary = {
  id?: string;
  email?: string | null;
  email_confirmed_at?: string | null;
};

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function currentParentCookieDomain(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "cruciblestar.com" || hostname.endsWith(".cruciblestar.com")) return ".cruciblestar.com";
  if (hostname === "crucibleforge.org" || hostname.endsWith(".crucibleforge.org")) return ".crucibleforge.org";
  return null;
}

function isAuthCookieName(name: string) {
  return name.startsWith("sb-") || name.includes("auth-token");
}

function expireCookie(response: NextResponse, name: string, domain?: string) {
  response.headers.append(
    "set-cookie",
    `${name}=; Path=/;${domain ? ` Domain=${domain};` : ""} Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
  );
}

async function listUsers() {
  const admin = createAdminClient();
  const users: UserSummary[] = [];
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return undefined;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

async function findUserByEmail(email: string): Promise<UserSummary | null | undefined> {
  try {
    const users = await listUsers();
    if (!users) return undefined;
    return users.find((user) => user.email?.toLowerCase() === email) ?? null;
  } catch {
    return undefined;
  }
}

async function resolveLoginToEmail(login: string): Promise<string | null | undefined> {
  const normalized = login.trim().toLowerCase();
  if (normalized.includes("@")) return normalized;

  try {
    const admin = createAdminClient();
    const { data: profiles, error } = await admin
      .from("profiles")
      .select("id,username")
      .ilike("username", normalized)
      .limit(2);

    if (error) return undefined;
    const profile = profiles?.[0];
    if (!profile?.id) return null;

    const { data, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError) return undefined;
    return data.user?.email?.toLowerCase() ?? null;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { login?: string; email?: string; password?: string };
    const login = (body.login ?? body.email ?? "").trim();
    const password = body.password ?? "";

    if (!login || !password || password.length > 128) {
      return NextResponse.json(
        { error: "invalid-credentials" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const resolvedEmail = await resolveLoginToEmail(login);
    if (resolvedEmail === null) {
      return NextResponse.json(
        { error: "account-not-found" },
        { status: 404, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "service-unavailable" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    const email = resolvedEmail;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    try {
      const admin = createAdminClient();
      const guardResult = await admin.rpc("consume_login_attempt", {
        p_ip: getClientIp(request),
        p_email: email,
      });
      const guard = Array.isArray(guardResult.data) ? guardResult.data[0] : guardResult.data;
      if (
        !guardResult.error &&
        guard &&
        typeof guard === "object" &&
        "allowed" in guard &&
        (guard as { allowed?: boolean }).allowed === false
      ) {
        return NextResponse.json(
          { error: "rate-limited" },
          { status: 429, headers: { "Cache-Control": "private, no-store", "Retry-After": "900" } },
        );
      }
      if (guardResult.error) {
        console.warn("Login abuse guard unavailable", { message: guardResult.error.message });
      }
    } catch (guardFailure) {
      console.warn("Login abuse guard failed open", {
        message: guardFailure instanceof Error ? guardFailure.message : "unknown",
      });
    }

    const pendingCookies: PendingCookie[] = [];
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          // Sign-in must start from a clean server auth state. Existing browser
          // cookies are reconciled onto the response after Supabase returns the
          // fresh session.
          return [];
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const account = await findUserByEmail(email);
      if (account === null) {
        return NextResponse.json(
          { error: "account-not-found" },
          { status: 404, headers: { "Cache-Control": "private, no-store" } },
        );
      }
      if (account && !account.email_confirmed_at) {
        return NextResponse.json(
          { error: "email-not-verified" },
          { status: 403, headers: { "Cache-Control": "private, no-store" } },
        );
      }
      if (account) {
        return NextResponse.json(
          { error: "wrong-password" },
          { status: 401, headers: { "Cache-Control": "private, no-store" } },
        );
      }
      return NextResponse.json(
        { error: "invalid-credentials" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store", Pragma: "no-cache", Expires: "0" } },
    );

    const pendingNames = new Set(pendingCookies.map(({ name }) => name));
    const requestAuthNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter(isAuthCookieName),
    );
    const parentDomain = currentParentCookieDomain(request);

    // Important: do not emit a host-only deletion for a cookie that is being
    // replaced in the same response. Some iOS privacy browsers can apply those
    // duplicate Set-Cookie operations inconsistently and leave the stale refresh
    // token behind. A fresh host cookie naturally overwrites the old host cookie.
    requestAuthNames.forEach((name) => {
      if (!pendingNames.has(name)) expireCookie(response, name);
      if (parentDomain) expireCookie(response, name, parentDomain);
    });

    // Also remove any older parent-domain variant for newly-issued cookie names.
    // That prevents duplicate auth cookies from being sent by Safari/WebKit.
    if (parentDomain) {
      pendingNames.forEach((name) => expireCookie(response, name, parentDomain));
    }

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, domain: undefined, path: "/" });
    });

    return response;
  } catch (error) {
    console.error("Login route failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { error: "service-unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
