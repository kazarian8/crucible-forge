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
  bio: string | null;
  profile_links: ProfileLink[];
  profile_link_slots_unlocked: number;
  is_public: boolean;
};

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId: string) {
  const rows = await adminRequest<ProfileRow[]>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=username,username_font,username_change_count,bio,profile_links,profile_link_slots_unlocked,is_public`,
    { method: "GET" },
  );
  return rows[0] ?? null;
}

function cleanLinks(value: unknown): ProfileLink[] | null {
  if (!Array.isArray(value)) return null;
  const links: ProfileLink[] = [];
  for (const item of value.slice(0, 3)) {
    if (!item || typeof item !== "object") return null;
    const raw = item as Record<string, unknown>;
    const label = String(raw.label ?? "").trim().slice(0, 40);
    const rawUrl = String(raw.url ?? "").trim();
    if (!label || !rawUrl) return null;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      links.push({ label, url: parsed.toString() });
    } catch {
      return null;
    }
  }
  return links;
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

  const profile = await getProfile(user.id);
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const bio = String(body.bio ?? "").trim().slice(0, 500) || null;
  const links = cleanLinks(body.profileLinks ?? []);
  if (!links) {
    return NextResponse.json(
      { error: "Each link needs a label and a valid http or https URL. You can show up to 3 links." },
      { status: 400 },
    );
  }

  const unlocked = Math.min(3, Math.max(1, Number(profile.profile_link_slots_unlocked) || 1));
  const neededSlots = Math.max(0, links.length - unlocked);
  const cost = neededSlots * CREDIT_PRICES.profileLink;
  const nextUnlocked = Math.max(unlocked, Math.min(3, links.length));

  let reservation: Awaited<ReturnType<typeof reserveServiceCredits>> | null = null;
  if (cost > 0) {
    try {
      reservation = await reserveServiceCredits({
        userId: user.id,
        serviceId: "profile-link",
        fileName: `${profile.username ?? user.id}:${links.length}-links`,
        cost,
      });
    } catch (error) {
      if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
        return NextResponse.json(
          { error: `Adding ${neededSlots === 1 ? "this link" : "these links"} costs ${cost} credits. You do not have enough credits.` },
          { status: 402 },
        );
      }
      return NextResponse.json({ error: "The Crucible credit service is temporarily unavailable." }, { status: 503 });
    }
  }

  try {
    const patch = {
      bio,
      profile_links: links,
      profile_link_slots_unlocked: nextUnlocked,
      updated_at: new Date().toISOString(),
    };
    const rows = await adminRequest<ProfileRow[]>(
      `profiles?id=eq.${encodeURIComponent(user.id)}&select=username,username_font,username_change_count,bio,profile_links,profile_link_slots_unlocked,is_public`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(patch) },
    );

    if (reservation) {
      await completeServiceCredits(user.id, reservation.jobId, {
        profileLinks: links.length,
        slotsUnlocked: nextUnlocked,
      });
    }

    return NextResponse.json({
      profile: rows[0] ?? { ...profile, ...patch },
      charged: cost,
      newlyUnlocked: neededSlots,
    });
  } catch {
    if (reservation) await refundServiceCredits(user.id, reservation.jobId).catch(() => null);
    return NextResponse.json({ error: "Could not update the profile right now." }, { status: 500 });
  }
}
