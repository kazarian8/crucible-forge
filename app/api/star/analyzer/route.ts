import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";

const COLUMNS = "id,title,original_filename,storage_path,grade,analysis_score,verification_status,created_at";

export async function GET() {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    return NextResponse.json(
      { error: "Sign in to inspect your verified CrucibleStar DNA." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data, error } = await supabase
    .from("star_music_files")
    .select(COLUMNS)
    .eq("user_id", userId)
    .eq("verification_status", "verified")
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const tracks = await Promise.all(
    (data ?? []).map(async (track) => {
      const { data: signed, error: signedError } = await supabase.storage
        .from("star-music")
        .createSignedUrl(track.storage_path, 15 * 60);

      return {
        ...track,
        audio_url: signedError ? null : signed?.signedUrl ?? null,
      };
    }),
  );

  return NextResponse.json(
    { tracks },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
