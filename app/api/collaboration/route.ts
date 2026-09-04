import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { adminRequest } from "../../../lib/billing/admin";

export const runtime = "nodejs";

type TrackRow = { id: string; user_id: string; title: string };
type ProfileRow = { id: string; username: string | null; display_name: string | null; avatar_url: string | null };
type CollaboratorRow = { track_id: string; user_id: string; invited_by: string; role: string; joined_at: string };

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getTrack(trackId: string) {
  const rows = await adminRequest<TrackRow[]>(`star_music_files?id=eq.${encodeURIComponent(trackId)}&select=id,user_id,title`, { method: "GET" });
  return rows[0] ?? null;
}

async function getMembers(trackId: string) {
  return adminRequest<CollaboratorRow[]>(`track_collaborators?track_id=eq.${encodeURIComponent(trackId)}&select=track_id,user_id,invited_by,role,joined_at&order=joined_at.asc`, { method: "GET" });
}

async function getProfiles(ids: string[]) {
  if (!ids.length) return [] as ProfileRow[];
  const filter = ids.map((id) => `\"${id}\"`).join(",");
  return adminRequest<ProfileRow[]>(`profiles?id=in.(${encodeURIComponent(filter)})&select=id,username,display_name,avatar_url`, { method: "GET" });
}

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const trackId = request.nextUrl.searchParams.get("trackId")?.trim() || "";
  if (!trackId) return NextResponse.json({ error: "Track ID required." }, { status: 400 });

  const track = await getTrack(trackId);
  if (!track) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  const members = await getMembers(trackId);
  const allowed = track.user_id === user.id || members.some((member) => member.user_id === user.id);
  if (!allowed) return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });

  const profiles = await getProfiles([track.user_id, ...members.map((member) => member.user_id)]);
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const owner = profileById.get(track.user_id) ?? { id: track.user_id, username: null, display_name: null, avatar_url: null };
  const collaborators = members.map((member) => ({
    ...member,
    profile: profileById.get(member.user_id) ?? { id: member.user_id, username: null, display_name: null, avatar_url: null },
  }));

  return NextResponse.json({ trackId, owner, collaborators, canInvite: track.user_id === user.id });
}

export async function POST(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const trackId = String(body.trackId ?? "").trim();
  if (!trackId) return NextResponse.json({ error: "Track ID required." }, { status: 400 });

  const track = await getTrack(trackId);
  if (!track) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (track.user_id !== user.id) return NextResponse.json({ error: "Only the project owner can create an invite link." }, { status: 403 });

  await adminRequest(`track_collaboration_invites?track_id=eq.${encodeURIComponent(trackId)}&revoked_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });

  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await adminRequest("track_collaboration_invites", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ track_id: trackId, owner_id: user.id, token_hash: tokenHash }),
  });

  return NextResponse.json({ inviteUrl: `${request.nextUrl.origin}/collab/${token}` });
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const trackId = request.nextUrl.searchParams.get("trackId")?.trim() || "";
  if (!trackId) return NextResponse.json({ error: "Track ID required." }, { status: 400 });
  const track = await getTrack(trackId);
  if (!track) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (track.user_id !== user.id) return NextResponse.json({ error: "Only the project owner can disable invite links." }, { status: 403 });

  await adminRequest(`track_collaboration_invites?track_id=eq.${encodeURIComponent(trackId)}&revoked_at=is.null`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
  return NextResponse.json({ disabled: true });
}
