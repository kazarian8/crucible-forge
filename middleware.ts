import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTE = "/winners/login";
const DEFAULT_AFTER_LOGIN = "/mastering";

function getSafeNextRoute(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return DEFAULT_AFTER_LOGIN;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  /*
   * Keep older links working.
   * Any request to /login is redirected to the existing login page.
   */
  if (pathname === "/login") {
    const redirectUrl = request.nextUrl.clone();
    const nextRoute = getSafeNextRoute(searchParams.get("next"));

    redirectUrl.pathname = LOGIN_ROUTE;
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", nextRoute);

    return NextResponse.redirect(redirectUrl);
  }

  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  /*
   * Allow public pages to load even if Vercel variables are temporarily
   * unavailable. Authentication will not work until the variables exist.
   */
  if (!supabaseUrl || !supabaseKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and Supabase public key.",
    );

    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(cookiesToSet) {
        /*
         * Update the incoming request cookies so Server Components receive
         * the refreshed Supabase session during this request.
         */
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        /*
         * Send refreshed authentication cookies back to the browser.
         */
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * The mastering upload is private.
   * Logged-out visitors are sent to login and returned afterward.
   */
  if (pathname.startsWith("/mastering") && !user) {
    const redirectUrl = request.nextUrl.clone();

    redirectUrl.pathname = LOGIN_ROUTE;
    redirectUrl.search = "";
    redirectUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return NextResponse.redirect(redirectUrl);
  }

  /*
   * Logged-in users do not need to see the login page again.
   */
  if (pathname === LOGIN_ROUTE && user) {
    const redirectUrl = request.nextUrl.clone();
    const nextRoute = getSafeNextRoute(searchParams.get("next"));

    redirectUrl.pathname = nextRoute;
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on application pages while skipping Next.js assets,
     * metadata files, and ordinary public media files.
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp3|wav|m4a|aac|flac)$).*)",
  ],
};
