import { authorizePaidProvider } from "../../../../lib/auth/provider-access";
import { CREDIT_PRICES } from "../../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../../lib/credits/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const access = await authorizePaidProvider("promotion-best-track-status", 30);
  if (access.response) return access.response;
  if (!access.user) return Response.json({ error: "Sign in is required." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("promotion_campaigns")
    .select("id,request_id,track_ref,track_title,campaign_type,status,credits_charged,requested_at,started_at,completed_at,updated_at,promotion_placements(id,platform,playlist_name,playlist_url,track_url,status,notes,placed_at,updated_at)")
    .eq("user_id", access.user.id)
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Promotion campaign lookup failed", error);
    return Response.json({ error: "Crucible could not load your promotion campaigns." }, { status: 500 });
  }

  return Response.json({ campaigns: data ?? [] }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const access = await authorizePaidProvider("promotion-best-track", 6);
  if (access.response) return access.response;
  if (!access.user) return Response.json({ error: "Sign in is required." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid promotion request." }, { status: 400 });
  }

  const requestId = cleanText(body.requestId, 36);
  const trackRef = cleanText(body.trackRef, 500);
  const trackTitle = cleanText(body.trackTitle, 160);

  if (!UUID_RE.test(requestId)) {
    return Response.json({ error: "A valid promotion request ID is required." }, { status: 400 });
  }
  if (!trackRef || !trackTitle) {
    return Response.json({ error: "Choose a saved track before starting promotion." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("promotion_campaigns")
    .select("id,request_id,track_ref,track_title,status,credits_charged,requested_at")
    .eq("user_id", access.user.id)
    .eq("request_id", requestId)
    .maybeSingle();

  if (existing) {
    return Response.json({ campaign: existing, duplicate: true }, { status: 200 });
  }

  let reservation;
  try {
    reservation = await reserveServiceCredits({
      userId: access.user.id,
      serviceId: "promote-best-track",
      fileName: trackTitle,
      cost: CREDIT_PRICES.promoteBestTrack,
    });
  } catch (error) {
    if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
      return Response.json(
        { error: `Promote Your Best Track costs ${CREDIT_PRICES.promoteBestTrack} credits.` },
        { status: 402, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return Response.json(
      { error: "The Crucible credit service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const { data: campaign, error: insertError } = await admin
    .from("promotion_campaigns")
    .insert({
      user_id: access.user.id,
      request_id: requestId,
      credit_job_id: reservation.jobId,
      service_id: "promote-best-track",
      track_ref: trackRef,
      track_title: trackTitle,
      campaign_type: "best_track_playlist",
      status: "queued",
      credits_charged: CREDIT_PRICES.promoteBestTrack,
    })
    .select("id,request_id,track_ref,track_title,status,credits_charged,requested_at")
    .single();

  if (insertError || !campaign) {
    await refundServiceCredits(access.user.id, reservation.jobId).catch((refundError) =>
      console.error("Promotion reservation refund failed", refundError),
    );

    if (insertError?.code === "23505") {
      const { data: duplicate } = await admin
        .from("promotion_campaigns")
        .select("id,request_id,track_ref,track_title,status,credits_charged,requested_at")
        .eq("user_id", access.user.id)
        .eq("request_id", requestId)
        .maybeSingle();
      if (duplicate) return Response.json({ campaign: duplicate, duplicate: true }, { status: 200 });
    }

    console.error("Promotion campaign creation failed", insertError);
    return Response.json({ error: "Crucible could not create the promotion order." }, { status: 500 });
  }

  try {
    const balance = await completeServiceCredits(access.user.id, reservation.jobId, {
      campaignId: campaign.id,
      campaignType: "best_track_playlist",
    });

    return Response.json(
      {
        campaign,
        creditCost: CREDIT_PRICES.promoteBestTrack,
        creditBalance: balance ?? reservation.balance,
        message: "Your track is in the Crucible promotion queue.",
      },
      { status: 201, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Promotion credit completion failed", error);
    const refunded = await refundServiceCredits(access.user.id, reservation.jobId)
      .then(() => true)
      .catch((refundError) => {
        console.error("Promotion credit refund failed", refundError);
        return false;
      });

    await admin
      .from("promotion_campaigns")
      .update({ status: refunded ? "refunded" : "payment_review", updated_at: new Date().toISOString() })
      .eq("id", campaign.id);

    return Response.json(
      { error: refunded ? "The promotion order could not be completed. Your credits were returned." : "The promotion order needs payment review before fulfillment." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
