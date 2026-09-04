import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTE = "/login";
const SIGNUP_ROUTE = "/signup";
const SUBSCRIBE_ROUTE = "/subscribe";
const DEFAULT_AFTER_LOGIN = "/sound-furnace";

const PAID_PREFIXES = ["/furnace", "/prompt-reforge", "/sound-furnace", "/studio"];
const STAR_HOSTS = new Set(["cruciblestar.com", "www.cruciblestar.com"]);

function getSafeNextRoute(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : DEFAULT_AFTER_LOGIN;
}

function preserveSupabaseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}

function redirectWithNext(request: NextRequest, pathname: string, nextRoute: string, error?: string, sourceResponse?: NextResponse) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", nextRoute);
  if (error) redirectUrl.searchParams.set("error", error);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  return sourceResponse ? preserveSupabaseState(sourceResponse, redirectResponse) : redirectResponse;
}

function redirectPreservingSession(request: NextRequest, response: NextResponse, pathname: string) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  return preserveSupabaseState(response, NextResponse.redirect(redirectUrl));
}

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hostname = request.headers.get("host")?.split(":")[0].toLowerCase();

  // The Star domain is a separate product entry point backed by this same
  // deployment. Keep its root URL stable without changing Forge routing.
  if (hostname && STAR_HOSTS.has(hostname) && pathname === "/") {
    const starUrl = request.nextUrl.clone();
    starUrl.pathname = "/star";
    return NextResponse.rewrite(starUrl);
  }

  const paidRoute = PAID_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const authenticatedRoute = paidRoute || pathname === "/account" || pathname === SUBSCRIBE_ROUTE || pathname.startsWith("/billing/success");
  const authPageRoute = pathname === LOGIN_ROUTE || pathname === SIGNUP_ROUTE;
  const authEndpoint = pathname.startsWith("/auth/");
  const switchingAccount = pathname === LOGIN_ROUTE && searchParams.get("switch") === "1";

  // Login/signup and /auth/* establish or clear sessions themselves.
  if (authPageRoute || authEndpoint) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (authenticatedRoute) return redirectWithNext(request, LOGIN_ROUTE, `${pathname}${request.nextUrl.search}`, "service-unavailable");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        // Keep refreshed sessions host-only. Sharing the same Supabase cookie
        // name across host and parent-domain scopes can make Safari send two
        // refresh tokens and create a login loop.
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, { ...options, domain: undefined }));
      },
    },
  });

  let userId: string | undefined;
  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    userId = claimsData?.claims?.sub;
  } catch {
    userId = undefined;
  }

  const requestedRoute = `${pathname}${request.nextUrl.search}`;
  if (authenticatedRoute && !userId) return redirectWithNext(request, LOGIN_ROUTE, requestedRoute, "session", response);

  let entitled = false;
  if (userId && authenticatedRoute) {
    const now = Date.now();
    const [{ data: subscription }, { data: developerAccess }] = await Promise.all([
      supabase
        .from("pro_subscriptions")
        .select("status,current_period_end,trial_end")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("expert_musician_dev_access")
        .select("enabled,invite_expires_at")
        .eq("user_id", userId)
        .eq("enabled", true)
        .gt("invite_expires_at", new Date(now).toISOString())
        .maybeSingle(),
    ]);
    const trialValid = subscription?.status === "trialing" && Boolean(subscription.trial_end) && new Date(subscription!.trial_end as string).getTime() > now;
    const activeValid = subscription?.status === "active" && Boolean(subscription.current_period_end) && new Date(subscription!.current_period_end as string).getTime() > now;
    const developerValid = Boolean(developerAccess?.enabled) && Boolean(developerAccess?.invite_expires_at) && new Date(developerAccess!.invite_expires_at as string).getTime() > now;
    entitled = trialValid || activeValid || developerValid;
  }

  if (paidRoute && !entitled) return redirectWithNext(request, SUBSCRIBE_ROUTE, requestedRoute, undefined, response);
  if (pathname === SUBSCRIBE_ROUTE && entitled) return redirectPreservingSession(request, response, DEFAULT_AFTER_LOGIN);
  if (pathname === LOGIN_ROUTE && userId && !switchingAccount) return redirectPreservingSession(request, response, entitled ? getSafeNextRoute(searchParams.get("next")) : SUBSCRIBE_ROUTE);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp3|wav|m4a|aac|flac)$).*)"],
};
