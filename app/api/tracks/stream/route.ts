import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ error: "Track unavailable." }, { status: 404 });
    const admin = createAdminClient();
    const { data: file } = await admin.from("star_music_files").select("id,user_id,storage_path,publish_status").eq("id", id).single();
    if (!file || file.publish_status !== "published") return NextResponse.json({ error: "Track unavailable." }, { status: 404 });
    const { data: moment } = await admin.from("artist_moments").select("id").eq("star_file_id", id).eq("user_id", file.user_id).eq("is_public", true).maybeSingle();
    if (!moment || !file.storage_path.startsWith(`${file.user_id}/`) || file.storage_path.includes("..")) return NextResponse.json({ error: "Track unavailable." }, { status: 404 });
    const { data, error } = await admin.storage.from("star-music").createSignedUrl(file.storage_path, 60);
    if (error || !data) throw error;
    const headers = new Headers();
    const range = request.headers.get("range");
    if (range) headers.set("range", range);
    const upstream = await fetch(data.signedUrl, { headers, cache: "no-store" });
    if (!upstream.ok || !upstream.body) return new Response(null, { status: upstream.status });
    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    });
    for (const key of ["accept-ranges", "content-length", "content-range"]) {
      const value = upstream.headers.get(key);
      if (value) responseHeaders.set(key, value);
    }
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json({ error: "Track playback unavailable." }, { status: 500 });
  }
}
