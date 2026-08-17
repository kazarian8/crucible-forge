import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type PendingCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions,
) {
  const temporaryResponse = NextResponse.next();
  temporaryResponse.cookies.set(name, value, options);
  return temporaryResponse.headers.get("set-cookie");
}

function appendCookie(
  response: NextResponse,
  name: string,
  value: string,
  options: CookieOptions,
) {
  const serialized = serializeCookie(name, value, options);
  if (serialized) response.headers.append("set-cookie", serialized);
}

function sharedDomain(request: NextRequest) {
  const hostname = (
    request.headers.get("x-forwarded-host") ?? request.nextUrl.hostname
  )
    .split(",")[0]
    .trim()
    .split(":")[0]
    .toLowerCase();

  return hostname === "crucibleforge.org" || hostname === "www.crucibleforge.org"
    ? ".crucibleforge.org"
    : undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "missing-credentials" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are missing.");
    }

    const cookiesToSet: PendingCookie[] = [];
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        // Password login must not inherit a revoked session from the browser.
        getAll() {
          return [];
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
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
    const staleCookieNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
    );
    cookiesToSet.forEach(({ name }) => staleCookieNames.add(name));

    // Safari can retain both old host-only and newer shared-domain cookies
    // with the same name. Expire both variants before installing the session.
    staleCookieNames.forEach((name) => {
      appendCookie(response, name, "", {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
      if (domain) {
        appendCookie(response, name, "", {
          path: "/",
          domain,
          expires: new Date(0),
          maxAge: 0,
        });
      }
    });

    cookiesToSet.forEach(({ name, value, options }) => {
      appendCookie(
        response,
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
