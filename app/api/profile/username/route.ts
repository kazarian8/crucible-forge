import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { CREDIT_PRICES } from "../../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../../lib/credits/server";

export const runtime = "nodejs";

type ProfileLink = { label: string; url: string };
type ProfileRow = {
  username: string | null;
  username_font: "default" | "gochi_hand";
  username_change_count: number;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  website: string | null;
  profile_links: ProfileLink[];
  is_public: boolean;
};

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId: string) {
  const rows = await adminRequest<ProfileRow[]>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=username,username_font,username_change_count,display_name,bio,avatar_url,website,profile_links,is_public`,
    { method: "GET" },
  );
  return rows[0] ?? null;
}

function cleanLinks(value: unknown): ProfileLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const label = String((item as Record<string, unknown>).label ?? "").trim().slice(0, 30);
    const rawUrl = String((item as Record<string, unknown>).url ?? "").trim();
    if (!label || !rawUrl) return [];
    try {
      const parsed = new URL(rawUrl);
      if (!/^https?:$/.test(parsed.protocol)) return [];
      return [{ label, url: parsed.toString() }];
    } catch {
      return [];
    }
  });
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const profile = await getProfile(user.id);
  return NextResponse.json({ profile, userId: user.id });
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const username = String(body.username ?? "").trim();
  const usernameFont = body.usernameFont === "gochi_hand" ? "gochi_hand" : "default";
  if (!/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    return NextResponse.json({ error: "Username must be 3–24 letters, numbers, or underscores." }, { status: 400 });
  }

  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const usernameChanged = profile.username !== username;
  const fontChanged = profile.username_font !== usernameFont;
  const firstUsername = !profile.username;
  const cost = firstUsername
    ? 0
    : (usernameChanged ? CREDIT_PRICES.usernameChange : 0) +
      (fontChanged ? CREDIT_PRICES.usernameFontChange : 0);

  let reservation: Awaited<ReturnType<typeof reserveServiceCredits>> | null = null;
  if (cost > 0) {
    try {
      reservation = await reserveServiceCredits({ userId: user.id, serviceId: "username-customization", fileName: username, cost });
    } catch (error) {
      if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json({ error: `This change costs ${cost} credits. You do not have enough credits.` }, { status: 402 });
      }
      return NextResponse.json({ error: "The Crucible credit service is temporarily unavailable." }, { status: 503 });
    }
  }

  const displayName = String(body.displayName ?? "").trim().slice(0, 80) || null;
  const bio = String(body.bio ?? "").trim().slice(0, 500) || null;
  const avatarUrl = String(body.avatarUrl ?? "").trim().slice(0, 1000) || null;
  const websiteRaw = String(body.website ?? "").trim();
  let website: string | null = null;
  if (websiteRaw) {
    try {
      const parsed = new URL(websiteRaw);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error("bad protocol");
      website = parsed.toString();
    } catch {
      if (reservation) await refundServiceCredits(user.id, reservation.jobId).catch(() => null);
      return NextResponse.json({ error: "Website must be a valid http or https link." }, { status: 400 });
    }
  }

  try {
    const patch = {
      username,
      username_font: usernameFont,
      username_change_count: profile.username_change_count + (usernameChanged && !firstUsername ? 1 : 0),
      username_changed_at: usernameChanged ? new Date().toISOString() : undefined,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl,
      website,
      profile_links: cleanLinks(body.profileLinks),
      is_public: body.isPublic !== false,
      updated_at: new Date().toISOString(),
    };

    const rows = await adminRequest<ProfileRow[]>(
      `profiles?id=eq.${encodeURIComponent(user.id)}&select=username,username_font,username_change_count,display_name,bio,avatar_url,website,profile_links,is_public`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) },
    );

    if (reservation) await completeServiceCredits(user.id, reservation.jobId, { usernameChanged, fontChanged });
    return NextResponse.json({ profile: rows[0] ?? patch, charged: cost, userId: user.id });
  } catch (error) {
    if (reservation) await refundServiceCredits(user.id, reservation.jobId).catch(() => null);
    const message = error instanceof Error ? error.message : "";
    if (message.includes("profiles_username_lower_unique") || message.includes("23505")) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not update the profile right now." }, { status: 500 });
  }
}
