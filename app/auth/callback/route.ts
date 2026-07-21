import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/winners";

  if (!code) {
    return NextResponse.redirect(
      new URL("/winners/login?error=missing-code", request.url),
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL("/winners/login?error=invalid-link", request.url),
    );
  }

  return NextResponse.redirect(new URL(next, request.url));
}
