import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTE = "/login";
const SIGNUP_ROUTE = "/signup";
const VERIFY_ROUTE = "/verify-email";
const SUBSCRIBE_ROUTE = "/subscribe";
const DEFAULT_AFTER_LOGIN = "/sound-furnace";

function getSafeNextRoute(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return DEFAULT_AFTER_LOGIN;
}

function redirectWithNext(
  request: NextRequest,
  pathname: string,
  nextRoute: string,
  error?: string,
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  redirectUrl.search = "";
  redirectUrl.searchParams.set("next", nextRoute);
  if (error) redirectUrl.searchParams.set("error", error);
  return NextResponse.redirect(redirectUrl);
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const protectedRoute =
    pathname.startsWith("/sound-furnace") ||
    pathname.startsWith("/account");
  const accountRoute =
    protectedRoute ||
    pathname === SUBSCRIBE_ROUTE ||
    pathname.startsWith("/billing/success");
  const authRoute = pathname === LOGIN_ROUTE || pathname === SIGNUP_ROUTE;

  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (accountRoute || protectedRoute) {
      return redirectWithNext(
        request,
        LOGIN_ROUTE,
        `${pathname}${request.nextUrl.search}`,
        "service-unavailable",
      );
    }
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const requestedRoute = `${pathname}${request.nextUrl.search}`;

  if (accountRoute && !user) {
    return redirectWithNext(request, LOGIN_ROUTE, requestedRoute);
  }

  if (accountRoute && user && !user.email_confirmed_at) {
    return redirectWithNext(request, VERIFY_ROUTE, requestedRoute);
  }

  let entitled = false;

  if (user && (accountRoute || authRoute)) {
    const { data: subscription } = await supabase
      .from("pro_subscriptions")
      .select("status,current_period_end,trial_end")
      .eq("user_id", user.id)
      .maybeSingle();

    const now = Date.now();
    const trialValid =
      subscription?.status === "trialing" &&
      Boolean(subscription.trial_end) &&
      new Date(subscription!.trial_end as string).getTime() > now;
    const activeValid =
      subscription?.status === "active" &&
      Boolean(subscription.current_period_end) &&
      new Date(subscription!.current_period_end as string).getTime() > now;

    entitled = trialValid || activeValid;
  }

  if (protectedRoute && !entitled) {
    return redirectWithNext(request, SUBSCRIBE_ROUTE, requestedRoute);
  }

  if (pathname === SUBSCRIBE_ROUTE && entitled) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = DEFAULT_AFTER_LOGIN;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (authRoute && user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = entitled
      ? getSafeNextRoute(searchParams.get("next"))
      : SUBSCRIBE_ROUTE;
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp3|wav|m4a|aac|flac)$).*)",
  ],
};
