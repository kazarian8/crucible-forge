import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../lib/supabase/server";
import { adminRequest } from "../../../../../lib/billing/admin";

export const runtime = "nodejs";

type InviteRow = { id: string; track_id: string; owner_id: string; revoked_at: string | null; expires_at: string | null };
type TrackRow = { id: string; user_id: string; title: string; artwork_url: string | null };
type ProfileRow = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function resolveInvite(token: string) {
  const tokenHash = hashToken(token);
  const invites = await adminRequest<InviteRow[]>(`track_collaboration_invites?token_hash=eq.${tokenHash}&revoked_at=is.null&select=id,track_id,owner_id,revoked_at,expires_at`, { method: "GET" });
  const invite = invites[0] ?? null;
  if (!invite) return null;
  if (invite.expires_at && Date.parse(invite.expires_at) <= Date.now()) return null;
  const tracks = await adminRequest<TrackRow[]>(`star_music_files?id=eq.${encodeURIComponent(invite.track_id)}&select=id,user_id,title,artwork_url`, { method: "GET" });
  const track = tracks[0] ?? null;
  if (!track || track.user_id !== invite.owner_id) return null;
  const profiles = await adminRequest<ProfileRow[]>(`profiles?id=eq.${encodeURIComponent(invite.owner_id)}&select=id,username,display_name,avatar_url`, { method: "GET" });
  return { invite, track, owner: profiles[0] ?? null };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const resolved = await resolveInvite(token);
  if (!resolved) return NextResponse.json({ error: "This collaboration link is invalid or has been disabled." }, { status: 404 });
  const user = await currentUser();
  return NextResponse.json({ authenticated: Boolean(user), track: { id: resolved.track.id, title: resolved.track.title, artwork_url: resolved.track.artwork_url }, owner: resolved.owner });
}

export async function POST(_request: NextRequest, context: { params: Promise<{ token: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { token } = await context.params;
  const resolved = await resolveInvite(token);
  if (!resolved) return NextResponse.json({ error: "This collaboration link is invalid or has been disabled." }, { status: 404 });

  if (resolved.track.user_id !== user.id) {
    await adminRequest("track_collaborators?on_conflict=track_id,user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ track_id: resolved.track.id, user_id: user.id, invited_by: resolved.track.user_id, role: "editor" }),
    });
  }

  return NextResponse.json({ accepted: true, trackId: resolved.track.id });
}
