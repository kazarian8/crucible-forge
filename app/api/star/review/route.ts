import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { compareMasterQuality } from "../../../../lib/audio/master-quality";
import { isStarAdmin } from "../../../../lib/star/admin";

const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return NextResponse.json({ error: "Sign in to review tracks." }, { status: 401, headers });
    if (!isStarAdmin(user)) return NextResponse.json({ error: "Administrator access required." }, { status: 403, headers });
    const admin = createAdminClient();
    const params = new URL(request.url).searchParams;
    const trackId = params.get("track");
    if (trackId) {
      if (!/^[0-9a-f-]{36}$/i.test(trackId)) return NextResponse.json({ error: "Invalid track." }, { status: 400, headers });
      const { data: track, error: trackError } = await admin.from("star_music_files").select("storage_path").eq("id", trackId).is("archived_at", null).single();
      if (trackError || !track) return NextResponse.json({ error: "Track unavailable." }, { status: 404, headers });
      const { data, error: signedError } = await admin.storage.from("star-music").createSignedUrl(track.storage_path, 300);
      if (signedError || !data) throw new Error("Preview could not be prepared.");
      return NextResponse.json({ url: data.signedUrl }, { headers });
    }
    const rawPage = Number(params.get("page") ?? 0);
    const page = Number.isSafeInteger(rawPage) && rawPage >= 0 ? Math.min(rawPage, 100000) : 0;
    let query = admin.from("star_music_files").select("id,title,created_at,publish_status,verification_status,grade,analysis_score,analysis", { count: "exact" }).is("archived_at", null);
    if (params.get("visibility") === "public") query = query.eq("publish_status", "published");
    if (params.get("visibility") === "private") query = query.neq("publish_status", "published");
    const { data, error: listError, count } = await query.order("created_at", { ascending: false }).order("id").range(page * 25, page * 25 + 24);
    if (listError) throw new Error("Tracks could not be loaded.");
    return NextResponse.json({ tracks: (data ?? []).map(({ analysis, ...track }) => ({ ...track, quality: analysis?.master_quality?.before && analysis?.master_quality?.after ? compareMasterQuality(analysis.master_quality.before, analysis.master_quality.after) : null })), total: count ?? 0 }, { headers });
  } catch {
    return NextResponse.json({ error: "The review queue is unavailable. Please try again." }, { status: 500, headers });
  }
}
