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

    const admin = createAdminClient();
    if (data.marketplace_item_id) {
      const { error: listingError } = await admin
        .from("sound_library_items")
        .update({ is_published: false })
        .eq("id", data.marketplace_item_id)
        .eq("user_id", user.id);
      if (listingError) throw listingError;
    }

    const { error: updateError } = await admin
      .from("star_music_files")
      .update({
        publish_status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    return NextResponse.json({ unpublished: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unpublish failed." },
      { status: 500 },
    );
  }
}
