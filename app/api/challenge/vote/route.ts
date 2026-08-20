import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as { entryId?: string };
  const entryId = String(body.entryId ?? "").trim();
  if (!entryId) {
    return NextResponse.json({ error: "Entry is required." }, { status: 400 });
  }

  const { error } = await supabase.rpc("cast_challenge_vote", {
    p_entry_id: entryId,
  });

  if (error) {
    const message = error.message || "";
    if (message.includes("verified_email_required")) {
      return NextResponse.json({ error: "Verify your email before voting." }, { status: 403 });
    }
    if (message.includes("self_vote_not_allowed")) {
      return NextResponse.json({ error: "You cannot vote for your own entry." }, { status: 403 });
    }
    if (message.includes("vote_already_cast")) {
      return NextResponse.json({ error: "Your one vote has already been used." }, { status: 409 });
    }
    if (message.includes("entry_not_open_for_voting") || message.includes("entry_not_found")) {
      return NextResponse.json({ error: "That entry is not open for voting." }, { status: 404 });
    }
    return NextResponse.json({ error: "Could not cast your vote right now." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
