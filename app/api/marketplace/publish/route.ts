import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
// Compatibility for already-open clients: Publish always means a public wall post.
export { POST } from "../../tracks/publish/route";

// Published metadata can change without replacing the verified audio.
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Sign in to edit your listing." }, { status: 401 });
    const body = await request.json();
    if (typeof body.itemId !== "string" || typeof body.title !== "string" || !body.title.trim() || body.title.length > 160 || typeof body.description !== "string" || body.description.length > 2000) {
      return NextResponse.json({ error: "Enter a title (up to 160 characters) and description (up to 2,000)." }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data: listing, error: lookupError } = await admin.from("sound_library_items").select("id,artwork_url").eq("id", body.itemId).eq("user_id", user.id).single();
    if (lookupError || !listing) return NextResponse.json({ error: "Your listing was not found." }, { status: 404 });
    let artworkUrl = listing.artwork_url;
    if (body.artworkPath !== undefined) {
      if (typeof body.artworkPath !== "string" || !body.artworkPath.startsWith(`${user.id}/`) || body.artworkPath.includes("..") || body.artworkPath.split("/").length !== 2) {
        return NextResponse.json({ error: "Invalid artwork path." }, { status: 400 });
      }
      const name = body.artworkPath.split("/")[1];
      const { data: objects, error: objectError } = await admin.storage.from("track-artwork").list(user.id, { search: name, limit: 100 });
      if (objectError || !objects?.some((object) => object.name === name)) return NextResponse.json({ error: "Upload the picture before saving." }, { status: 400 });
      artworkUrl = admin.storage.from("track-artwork").getPublicUrl(body.artworkPath).data.publicUrl;
    }
    const patch = { title: body.title.trim(), description: body.description.trim(), artwork_url: artworkUrl };
    // All predicates include the authenticated owner; audio, grade and price are never accepted here.
    await admin.from("star_music_files").update(patch).eq("marketplace_item_id", listing.id).eq("user_id", user.id).throwOnError();
    await admin.from("artist_moments").update({ artwork_url: artworkUrl }).eq("user_id", user.id).eq("music_url", `/api/marketplace/download?id=${encodeURIComponent(listing.id)}&preview=1`).throwOnError();
    const { data: updated, error: updateError } = await admin.from("sound_library_items").update(patch).eq("id", listing.id).eq("user_id", user.id).select("id,title,description,artwork_url").single();
    if (updateError || !updated) throw updateError || new Error("The listing could not be updated.");
    return NextResponse.json({ item: updated });
  } catch {
    return NextResponse.json({ error: "The listing could not finish updating. Please retry saving to sync all views." }, { status: 500 });
  }
}
