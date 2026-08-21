import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

type PendingCookie = { name: string; value: string; options: CookieOptions };

type UserSummary = {
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

async function findUserByEmail(email: string): Promise<UserSummary | null | undefined> {
  try {
    const admin = createAdminClient();
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return undefined;
      const found = data.users.find((user) => user.email?.toLowerCase() === email);
      if (found) return found;
      if (data.users.length < 1000) return null;
    }
    return null;
  } catch {
    return undefined;
  }
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

    // Abuse protection is defense-in-depth. If its admin key/RPC is unavailable,
    // password authentication must still work.
    try {
      const admin = createAdminClient();
      const guardResult = await admin.rpc("consume_login_attempt", {
        p_ip: getClientIp(request),
        p_email: email,
      });
      const guard = Array.isArray(guardResult.data) ? guardResult.data[0] : guardResult.data;
      if (!guardResult.error && guard && typeof guard === "object" && "allowed" in guard && (guard as { allowed?: boolean }).allowed === false) {
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

    // Authenticate without reading any stale browser session.
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
      const account = await findUserByEmail(email);
      if (account === null) {
        return NextResponse.json({ error: "account-not-found" }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
      }
      if (account && !account.email_confirmed_at) {
        return NextResponse.json({ error: "email-not-verified" }, { status: 403, headers: { "Cache-Control": "private, no-store" } });
      }
      if (account) {
        return NextResponse.json({ error: "wrong-password" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
      }
      return NextResponse.json({ error: "invalid-credentials" }, { status: 401, headers: { "Cache-Control": "private, no-store" } });
    }

    const response = NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );

    // Remove every stale auth cookie visible on this host and remove the old
    // shared-domain variants. Install the fresh session as host-only cookies so
    // Safari cannot send two cookies with the same Supabase name.
    const staleNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
    );
    pendingCookies.forEach(({ name }) => staleNames.add(name));

    staleNames.forEach((name) => {
      response.headers.append(
        "set-cookie",
        `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
      );
      response.headers.append(
        "set-cookie",
        `${name}=; Path=/; Domain=.crucibleforge.org; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
      );
    });

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, domain: undefined });
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
