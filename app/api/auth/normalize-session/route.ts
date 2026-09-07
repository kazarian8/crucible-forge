import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createClient as createRequestClient } from "../../../../lib/supabase/server";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function parentCookieDomain(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "cruciblestar.com" || hostname.endsWith(".cruciblestar.com")) return ".cruciblestar.com";
  if (hostname === "crucibleforge.org" || hostname.endsWith(".crucibleforge.org")) return ".crucibleforge.org";
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const requestClient = await createRequestClient();
    const { data: claimsData, error: claimsError } = await requestClient.auth.getClaims();
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return NextResponse.json(
        { ok: false, authenticated: false },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    // Identity has already been validated with getClaims(). We only read the raw
    // session here so @supabase/ssr can serialize one clean browser cookie set.
    const { data: { session }, error: sessionError } = await requestClient.auth.getSession();
    if (sessionError || !session?.access_token || !session.refresh_token) {
      return NextResponse.json(
        { ok: false, authenticated: false },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase environment variables are missing.");

    const pendingCookies: PendingCookie[] = [];
    const cleanClient = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return [];
        },
        setAll(cookiesToSet) {
          pendingCookies.push(...cookiesToSet);
        },
      },
    });

    const { error: setError } = await cleanClient.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
    if (setError) throw setError;

    const response = NextResponse.json(
      { ok: true, authenticated: true },
      { headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" } },
    );

    const staleNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
    );
    pendingCookies.forEach(({ name }) => staleNames.add(name));
    const parentDomain = parentCookieDomain(request);

    // Remove both scopes first. Safari can otherwise send two cookies with the
    // same Supabase auth name and the browser/server can disagree about session.
    staleNames.forEach((name) => {
      response.headers.append(
        "set-cookie",
        `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
      );
      if (parentDomain) {
        response.headers.append(
          "set-cookie",
          `${name}=; Path=/; Domain=${parentDomain}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`,
        );
      }
    });

    // Recreate exactly one host-only session that browser and server clients share.
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, domain: undefined });
    });

    return response;
  } catch (error) {
    console.error("Session normalization failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { ok: false, error: "session-normalization-failed" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
