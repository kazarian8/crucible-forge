import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

type PendingCookie = { name: string; value: string; options: CookieOptions };

function safeNext(value: FormDataEntryValue | null, hostname: string) {
  const text = typeof value === "string" ? value : "";
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  return hostname.includes("cruciblestar.com") ? "/star" : "/sound-furnace";
}

function parentCookieDomain(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (hostname === "cruciblestar.com" || hostname.endsWith(".cruciblestar.com")) return ".cruciblestar.com";
  if (hostname === "crucibleforge.org" || hostname.endsWith(".crucibleforge.org")) return ".crucibleforge.org";
  return null;
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function failureRedirect(request: NextRequest, next: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("next", next);
  url.searchParams.set("error", "session");
  return noStore(NextResponse.redirect(url, 303));
}

export async function POST(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  const allowedHost =
    hostname === "cruciblestar.com" ||
    hostname === "www.cruciblestar.com" ||
    hostname === "crucibleforge.org" ||
    hostname === "www.crucibleforge.org";

  if (!allowedHost) {
    return noStore(NextResponse.json({ error: "invalid-host" }, { status: 400 }));
  }

  let next = hostname.includes("cruciblestar.com") ? "/star" : "/sound-furnace";

  try {
    const form = await request.formData();
    next = safeNext(form.get("next"), hostname);
    const tokenHash = typeof form.get("token_hash") === "string" ? String(form.get("token_hash")) : "";
    const verificationType = typeof form.get("type") === "string" ? String(form.get("type")) : "";

    if (verificationType !== "magiclink" || tokenHash.length < 20 || tokenHash.length > 1024) {
      return failureRedirect(request, next);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are missing.");
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

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: verificationType as EmailOtpType,
    });
    if (verifyError) throw verifyError;

    // Confirm the newly established session with the Auth server before writing
    // it as the browser's session on the destination Crucible domain.
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError ?? new Error("Handoff session could not be verified.");

    const destination = new URL(next, request.url);
    const response = NextResponse.redirect(destination, 303);

    const staleNames = new Set(
      request.cookies
        .getAll()
        .map(({ name }) => name)
        .filter((name) => name.startsWith("sb-") || name.includes("auth-token")),
    );
    pendingCookies.forEach(({ name }) => staleNames.add(name));
    const parentDomain = parentCookieDomain(request);

    // Safari can send duplicate Supabase auth cookies if a historical parent-
    // domain cookie and a host-only cookie have the same name. Clear both scopes
    // before installing one clean host-only destination session.
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

    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, { ...options, domain: undefined });
    });

    return noStore(response);
  } catch (error) {
    console.error("Cross-domain auth handoff completion failed", {
      message: error instanceof Error ? error.message : "unknown",
      hostname,
    });
    return failureRedirect(request, next);
  }
}
