import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

export const runtime = "nodejs";

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Verify your email before entering." }, { status: 403 });
  }

  const body = (await request.json()) as {
    artistName?: string;
    trackTitle?: string;
    trackUrl?: string;
  };

  const artistName = String(body.artistName ?? "").trim();
  const trackTitle = String(body.trackTitle ?? "").trim();
  const trackUrl = String(body.trackUrl ?? "").trim();

  if (!artistName || artistName.length > 80) {
    return NextResponse.json({ error: "Artist name is required and must be 80 characters or fewer." }, { status: 400 });
  }

  if (!trackTitle || trackTitle.length > 120) {
    return NextResponse.json({ error: "Track title is required and must be 120 characters or fewer." }, { status: 400 });
  }

  if (!validHttpUrl(trackUrl)) {
    return NextResponse.json({ error: "Add a valid public HTTP or HTTPS audio URL." }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("challenge_entries")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You already submitted an entry." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("challenge_entries")
    .insert({
      user_id: user.id,
      artist_name: artistName,
      track_title: trackTitle,
      track_url: trackUrl,
      status: "pending",
    })
    .select("id,status")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "You already submitted an entry." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not submit your track right now." }, { status: 500 });
  }

  return NextResponse.json({ entry: data }, { status: 201 });
}
