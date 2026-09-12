import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";

function safeNext(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/subscribe";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; next?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const callback = new URL("/auth/callback", request.nextUrl.origin);
    callback.searchParams.set("next", safeNext(body.next));

    const supabase = await createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: callback.toString() },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate") || message.includes("too many")) {
        return NextResponse.json(
          { error: "Too many verification emails were requested. Try again shortly." },
          { status: 429, headers: { "Cache-Control": "private, no-store" } },
        );
      }

      // Keep account existence private. A nonexistent or already-confirmed email
      // receives the same response as a pending signup.
      return NextResponse.json(
        { ok: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Verification email service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
