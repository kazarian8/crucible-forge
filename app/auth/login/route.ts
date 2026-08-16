import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "missing-credentials" },
        { status: 400, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json(
        { error: "invalid-credentials" },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "service-unavailable" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
