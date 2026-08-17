import { NextResponse } from "next/server";
import { confirmCheckoutForUser } from "../../../../lib/billing/subscription-sync";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Verify your email before confirming checkout." },
      { status: 403 },
    );
  }

  let sessionId = "";
  try {
    const payload = (await request.json()) as { sessionId?: unknown };
    sessionId = typeof payload.sessionId === "string" ? payload.sessionId : "";
  } catch {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  if (!sessionId.startsWith("cs_")) {
    return NextResponse.json({ error: "Invalid checkout session." }, { status: 400 });
  }

  try {
    const result = await confirmCheckoutForUser({
      sessionId,
      userId: user.id,
      email: user.email,
    });
    return NextResponse.json({ confirmed: true, ...result });
  } catch (confirmationError) {
    console.error("Checkout confirmation failed", confirmationError);
    return NextResponse.json(
      { error: "Checkout is complete, but access could not be confirmed yet." },
      { status: 502 },
    );
  }
}
