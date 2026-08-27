import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string; next?: string };
    const email = body.email?.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "invalid-email" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
    }

    const next = body.next?.startsWith("/") && !body.next.startsWith("//")
      ? body.next
      : "/sound-furnace";
    const callback = new URL("/auth/callback", request.nextUrl.origin);
    callback.searchParams.set("next", next);

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: callback.toString(),
      },
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("rate")) {
        return NextResponse.json({ error: "rate-limited" }, { status: 429 });
      }
      // Do not reveal whether an account exists.
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
  }
}
