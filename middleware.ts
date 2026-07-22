import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_ROUTE = "/login";
const DEFAULT_AFTER_LOGIN = "/mastering";

function getSafeNextRoute(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return DEFAULT_AFTER_LOGIN;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  let response = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|mp3|wav|m4a|aac|flac)$).*)",
  ],
};
