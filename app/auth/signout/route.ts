import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function safeNext(request: NextRequest) {
  const value = request.nextUrl.searchParams.get("next");
  return value?.startsWith("/") && !value.startsWith("//")
    ? value
    : "/login";
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(
    new URL(safeNext(request), request.url),
  );
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
