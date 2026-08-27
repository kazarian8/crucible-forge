import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function safeNext(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/sound-furnace";
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=session", request.url));
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.redirect(new URL("/login?error=service-unavailable", request.url));
  }

  const pendingCookies: PendingCookie[] = [];
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.warn("Auth callback exchange failed", { message: error.message });
    return NextResponse.redirect(new URL("/login?error=session", request.url));
  }

  const response = NextResponse.redirect(new URL(next, request.url));

  // Remove stale parent-domain copies first, then set one host-only session.
  const names = new Set(
    request.cookies
      .getAll()
      .map(({ name }) => name)
      .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
  );
  pendingCookies.forEach(({ name }) => names.add(name));

  names.forEach((name) => {
    response.headers.append(
      "set-cookie",
      `${name}=; Path=/; Domain=.crucibleforge.org; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
    );
  });

  pendingCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, { ...options, domain: undefined });
  });

  return response;
}
