import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function safeNext(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/login";
}

// Sign-out mutates auth state, so GET must stay side-effect free. This prevents
// browser/Next.js link prefetch from silently destroying a valid session.
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL(safeNext(request), request.url), {
    status: 303,
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(safeNext(request), request.url),
    {
      status: 303,
    },
  );
}
