import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTE = "/login";
const SIGNUP_ROUTE = "/signup";
const VERIFY_EMAIL_ROUTE = "/verify-email";
const SUBSCRIBE_ROUTE = "/subscribe";
const DEFAULT_AFTER_LOGIN = "/sound-furnace";

const PAID_PREFIXES = ["/furnace", "/prompt-reforge", "/sound-furnace", "/studio"];
const STAR_HOSTS = new Set(["cruciblestar.com", "www.cruciblestar.com"]);

function getSafeNextRoute(value: string | null, fallback = DEFAULT_AFTER_LOGIN) {
  const validLocalRoute = value?.startsWith("/") && !value.startsWith("//");
  const accountSetupRoute = value === "/account" || value?.startsWith("/account?") || value?.startsWith("/account#");
  return validLocalRoute && !accountSetupRoute ? value! : fallback;
}

function preserveSupabaseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
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
  const isStarHost = Boolean(hostname && STAR_HOSTS.has(hostname));
  const isStarRoot = Boolean(isStarHost && pathname === "/");

  const makeBaseResponse = () => {
    if (isStarRoot) {
      const starUrl = request.nextUrl.clone();
      starUrl.pathname = "/star";
      return NextResponse.rewrite(starUrl, { request: { headers: request.headers } });
    }
    return NextResponse.next({ request });
  };

  const paidRoute = PAID_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const authenticatedRoute = paidRoute || pathname === "/account" || pathname === SUBSCRIBE_ROUTE || pathname.startsWith("/billing/success");
  const authEndpoint = pathname.startsWith("/auth/");
  const switchingAccount = pathname === LOGIN_ROUTE && searchParams.get("switch") === "1";

  // /auth/* establishes or clears sessions itself. All page requests, including
  // CrucibleStar's root-domain rewrite, must pass through the normal SSR refresh.
  if (authEndpoint) return NextResponse.next({ request });

  let response = makeBaseResponse();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (authenticatedRoute) return redirectWithNext(request, LOGIN_ROUTE, `${pathname}${request.nextUrl.search}`, "service-unavailable");
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = makeBaseResponse();
        // Keep refreshed sessions host-only. Sharing the same Supabase cookie
        // name across parent-domain and host scopes can make Safari send two
        // refresh tokens and create a login loop.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, domain: undefined }),
        );
        // @supabase/ssr 0.7 does not pass cache headers to setAll, so mark every
        // response that refreshes a session as private and non-cacheable here.
        response.headers.set("Cache-Control", "private, no-store");
        response.headers.set("Pragma", "no-cache");
        response.headers.set("Expires", "0");
      },
    },
  });

  let userId: string | undefined;
  let emailVerified = false;
  try {
    const { data: claimsData } = await supabase.auth.getClaims();
    userId = claimsData?.claims?.sub;
  } catch {
    userId = undefined;
  }

  // Claims prove the token is valid, but verification status can change and must
  // come from the current Auth user record. This prevents a valid session from
  // bypassing Crucible's mandatory email-confirmation gate.
  const needsCurrentUser = Boolean(
    userId &&
      (authenticatedRoute ||
        pathname === LOGIN_ROUTE ||
        pathname === SIGNUP_ROUTE ||
        pathname === VERIFY_EMAIL_ROUTE),
  );
  if (needsCurrentUser) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        userId = undefined;
      } else {
        userId = user.id;
        emailVerified = Boolean(user.email_confirmed_at);
      }
    } catch {
      userId = undefined;
    }
  }

  const requestedRoute = `${pathname}${request.nextUrl.search}`;
  if (authenticatedRoute && !userId) return redirectWithNext(request, LOGIN_ROUTE, requestedRoute, "session", response);
  if (authenticatedRoute && userId && !emailVerified) {
    return redirectWithNext(request, VERIFY_EMAIL_ROUTE, requestedRoute, "email-not-verified", response);
  }

  let entitled = false;
  if (userId && emailVerified && authenticatedRoute) {
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

  // Payment/trial entitlement stays after identity verification. Verification can
  // never substitute for an active trial, paid subscription, or explicit dev pass.
  if (paidRoute && !entitled) return redirectWithNext(request, SUBSCRIBE_ROUTE, requestedRoute, undefined, response);
  if (pathname === SUBSCRIBE_ROUTE && entitled) return redirectPreservingSession(request, response, DEFAULT_AFTER_LOGIN);
  if (pathname === VERIFY_EMAIL_ROUTE && userId && emailVerified) {
    return redirectPreservingSession(request, response, getSafeNextRoute(searchParams.get("next"), SUBSCRIBE_ROUTE));
  }
  if (pathname === LOGIN_ROUTE && userId && !switchingAccount) {
    if (!emailVerified) return redirectWithNext(request, VERIFY_EMAIL_ROUTE, getSafeNextRoute(searchParams.get("next"), SUBSCRIBE_ROUTE), undefined, response);
    return redirectPreservingSession(
      request,
      response,
      entitled ? getSafeNextRoute(searchParams.get("next"), isStarHost ? "/star" : DEFAULT_AFTER_LOGIN) : SUBSCRIBE_ROUTE,
    );
  }
  if (pathname === SIGNUP_ROUTE && userId) {
    if (!emailVerified) return redirectWithNext(request, VERIFY_EMAIL_ROUTE, SUBSCRIBE_ROUTE, undefined, response);
    return redirectPreservingSession(request, response, DEFAULT_AFTER_LOGIN);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp3|wav|m4a|aac|flac)$).*)"],
};
