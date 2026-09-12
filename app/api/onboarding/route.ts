import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { adminRequest } from "../../../lib/billing/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProfileRow = {
  username: string | null;
  onboarding_completed_at: string | null;
  onboarding_outcome: "saved_first_track" | "engineer_mode" | null;
};

type TrackRow = { id: string };

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId: string) {
  const rows = await adminRequest<ProfileRow[]>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=username,onboarding_completed_at,onboarding_outcome&limit=1`,
  );
  return rows[0] ?? null;
}

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const profile = await getProfile(user.id);
  return NextResponse.json({
    username: profile?.username ?? null,
    completed: Boolean(profile?.onboarding_completed_at),
    completedAt: profile?.onboarding_completed_at ?? null,
    outcome: profile?.onboarding_outcome ?? null,
  }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const outcome = body.outcome === "saved_first_track" || body.outcome === "engineer_mode"
    ? body.outcome
    : null;
  const trackId = typeof body.trackId === "string" ? body.trackId.trim() : "";
  if (!outcome) return NextResponse.json({ error: "Invalid onboarding outcome." }, { status: 400 });

  if (outcome === "saved_first_track") {
    if (!trackId) return NextResponse.json({ error: "Saved track is required." }, { status: 400 });
    const tracks = await adminRequest<TrackRow[]>(
      `star_music_files?id=eq.${encodeURIComponent(trackId)}&user_id=eq.${encodeURIComponent(user.id)}&archived_at=is.null&select=id&limit=1`,
    );
    if (!tracks[0]) return NextResponse.json({ error: "Saved track not found." }, { status: 404 });
  }

  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (profile.onboarding_completed_at) {
    return NextResponse.json({ completed: true, firstCompletion: false, outcome: profile.onboarding_outcome });
  }

  const completedAt = new Date().toISOString();
  await adminRequest(`profiles?id=eq.${encodeURIComponent(user.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ onboarding_completed_at: completedAt, onboarding_outcome: outcome, updated_at: completedAt }),
  });

  return NextResponse.json({ completed: true, firstCompletion: true, completedAt, outcome }, { headers: { "Cache-Control": "no-store" } });
}
