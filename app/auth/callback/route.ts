import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

const DEFAULT_NEXT_ROUTE = "/mastering";
const LOGIN_ROUTE = "/login";

function getSafeNextRoute(value: string | null) {
  if (value?.startsWith("/") && !value.startsWith("//")) {
    return value;
  }

  return DEFAULT_NEXT_ROUTE;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextRoute = getSafeNextRoute(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    const loginUrl = new URL(LOGIN_ROUTE, requestUrl.origin);

    loginUrl.searchParams.set("next", nextRoute);
    loginUrl.searchParams.set("error", "missing-code");

    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const loginUrl = new URL(LOGIN_ROUTE, requestUrl.origin);

      loginUrl.searchParams.set("next", nextRoute);
      loginUrl.searchParams.set("error", "invalid-link");

      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(
      new URL(nextRoute, requestUrl.origin),
    );
  } catch {
    const loginUrl = new URL(LOGIN_ROUTE, requestUrl.origin);

    loginUrl.searchParams.set("next", nextRoute);
    loginUrl.searchParams.set("error", "callback-failed");

    return NextResponse.redirect(loginUrl);
  }
}
