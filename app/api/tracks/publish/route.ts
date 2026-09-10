import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (typeof body.starFileId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.starFileId)) {
      return NextResponse.json({ error: "Choose a saved track to publish." }, { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in before publishing." }, { status: 401 });
    const { data, error } = await createAdminClient().rpc("publish_track_to_wall", {
      track_id: body.starFileId, owner_id: user.id,
    });
    if (error) return NextResponse.json({ error: "Could not publish this track. Check that you own it and it has passed analysis." }, { status: 400 });
    return NextResponse.json({ momentId: data, published: true, destination: "/moments" });
  } catch {
    return NextResponse.json({ error: "Publishing failed. Please try again." }, { status: 500 });
  }
}
