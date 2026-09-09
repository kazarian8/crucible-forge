import { NextResponse } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = createAdminClient();
    // Only public posts are eligible for this public feed.
    const { data, error } = await admin.from("artist_moments")
      .select("id,user_id,body,music_url,artwork_url,created_at")
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    const moments = data ?? [];
    const authorIds = [...new Set(moments.map(moment => moment.user_id as string))];
    const usernames = new Map<string, string | null>();
    if (authorIds.length) {
      // Profiles are private to the client. Return only the public-post author's
      // username, never their email, account details, or full profile.
      const { data: profiles, error: profileError } = await admin.from("profiles")
        .select("id,username").in("id", authorIds);
      if (profileError) throw profileError;
      for (const profile of profiles ?? []) {
        usernames.set(profile.id, profile.username?.trim() || null);
      }
    }
    return NextResponse.json({
      moments: moments.map(({ user_id, ...moment }) => ({
        ...moment,
        username: usernames.get(user_id) ?? null,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Unable to load Moments. Please try again." }, { status: 500 });
  }
}
