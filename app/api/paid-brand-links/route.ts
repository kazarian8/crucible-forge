import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { CREDIT_PRICES } from "../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../lib/credits/server";

export const runtime = "nodejs";

const CAMPAIGN_HOURS = 2;
const MAX_ACTIVE_RESULTS = 60;
const IMAGE_BUCKET = "brand-link-images";

type PaidBrandLinkRow = {
  id: string;
  user_id: string;
  brand_name: string;
  destination_url: string;
  image_url: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
};

function normalizeDestination(value: unknown) {
  try {
    const url = new URL(String(value ?? "").trim());
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("paid_brand_links")
      .select("id,user_id,brand_name,destination_url,image_url,starts_at,ends_at,created_at")
      .eq("status", "active")
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("created_at", { ascending: true })
      .limit(MAX_ACTIVE_RESULTS);

    if (error) throw error;
    return NextResponse.json({ campaigns: (data ?? []) as PaidBrandLinkRow[] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ campaigns: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const brandName = String(body.brandName ?? "").trim();
  const destinationUrl = normalizeDestination(body.destinationUrl);
  const imagePath = String(body.imagePath ?? "").trim();

  if (brandName.length < 2 || brandName.length > 80) {
    return NextResponse.json({ error: "Brand or website name must be 2–80 characters." }, { status: 400 });
  }
  if (!destinationUrl) {
    return NextResponse.json({ error: "Enter a secure https:// link for the ad destination." }, { status: 400 });
  }
  if (!imagePath.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: "Upload your ad picture before purchasing the campaign." }, { status: 400 });
  }

  const admin = createAdminClient();
  const fileName = imagePath.slice(user.id.length + 1);
  const { data: objects, error: objectError } = await admin.storage
    .from(IMAGE_BUCKET)
    .list(user.id, { search: fileName, limit: 20 });

  if (objectError || !objects?.some((object) => object.name === fileName)) {
    return NextResponse.json({ error: "The uploaded ad picture could not be verified." }, { status: 400 });
  }

  const imageUrl = admin.storage.from(IMAGE_BUCKET).getPublicUrl(imagePath).data.publicUrl;
  const cost = CREDIT_PRICES.brandWebsiteAd2Hours;
  let reservation: Awaited<ReturnType<typeof reserveServiceCredits>> | null = null;

  try {
    reservation = await reserveServiceCredits({
      userId: user.id,
      serviceId: "paid-brand-link-2h",
      fileName: brandName,
      cost,
    });
  } catch (error) {
    if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
      return NextResponse.json({ error: `Paid Brand Link costs ${cost} credits. You do not have enough credits.` }, { status: 402 });
    }
    return NextResponse.json({ error: "The Crucible credit service is temporarily unavailable." }, { status: 503 });
  }

  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + CAMPAIGN_HOURS * 60 * 60 * 1000);

  try {
    const { data, error } = await admin
      .from("paid_brand_links")
      .insert({
        user_id: user.id,
        brand_name: brandName,
        destination_url: destinationUrl,
        image_path: imagePath,
        image_url: imageUrl,
        credits_charged: cost,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: "active",
      })
      .select("id,user_id,brand_name,destination_url,image_url,starts_at,ends_at,created_at")
      .single();

    if (error) throw error;
    await completeServiceCredits(user.id, reservation.jobId, {
      campaignId: data.id,
      campaignHours: CAMPAIGN_HOURS,
      placement: "paid-brand-link",
    });

    return NextResponse.json({ campaign: data, charged: cost, campaignHours: CAMPAIGN_HOURS });
  } catch {
    await refundServiceCredits(user.id, reservation.jobId).catch(() => null);
    return NextResponse.json({ error: "Could not start the Paid Brand Link campaign. Your credits were returned." }, { status: 500 });
  }
}
