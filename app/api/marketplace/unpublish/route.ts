import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

type Body = { starFileId?: string };

export async function POST(request: Request) {
  try {
    const body = await request.json() as Body;
    if (!body.starFileId) return NextResponse.json({ error: "Choose a published file to unpublish." }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in before unpublishing." }, { status: 401 });

    const { data, error } = await supabase
      .from("star_music_files")
      .select("id,user_id,marketplace_item_id,publish_status")
      .eq("id", body.starFileId)
      .eq("user_id", user.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Private library file not found." }, { status: 404 });

    const { error: updateError } = await createAdminClient().rpc("unpublish_track_from_wall", { track_id: data.id, owner_id: user.id });
    if (updateError) throw updateError;

    return NextResponse.json({ unpublished: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unpublish failed." },
      { status: 500 },
    );
  }
}
