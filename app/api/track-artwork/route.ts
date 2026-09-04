import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { authorizePaidProvider } from "../../../lib/auth/provider-access";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../lib/credits/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const CREDIT_COST = 8;
const MODEL = "gpt-image-1";

export async function GET() {
  return NextResponse.json({
    service: "track-artwork",
    ready: Boolean(process.env.OPENAI_API_KEY),
    model: MODEL,
    creditCost: CREDIT_COST,
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const access = await authorizePaidProvider("track-artwork", 4);
  if (access.response) return access.response;
  if (!access.user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  let body: { prompt?: string; confirmedCost?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid artwork request." }, { status: 400 });
  }

  const prompt = body.prompt?.trim() ?? "";
  if (prompt.length < 3) {
    return NextResponse.json({ error: "Describe the cover you want in at least 3 characters." }, { status: 400 });
  }
  if (prompt.length > 700) {
    return NextResponse.json({ error: "Keep the artwork prompt under 700 characters." }, { status: 400 });
  }

  if (body.confirmedCost !== CREDIT_COST) {
    return NextResponse.json(
      {
        error: "Credit confirmation required.",
        requiresConfirmation: true,
        creditCost: CREDIT_COST,
      },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let reservation;
  try {
    reservation = await reserveServiceCredits({
      userId: access.user.id,
      serviceId: "track-artwork:generate",
      fileName: "ai-track-cover.png",
      cost: CREDIT_COST,
    });
  } catch (error) {
    if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: `Generating a cover costs ${CREDIT_COST} credits. Add credits or wait for your monthly refresh.`, creditCost: CREDIT_COST },
        { status: 402, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.json(
      { error: "The Crucible credit service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 240_000, maxRetries: 1 });
    const result = await openai.images.generate({
      model: MODEL,
      prompt: [
        "Create original square cover artwork for a music track.",
        "Make it visually striking and suitable for a professional album or single thumbnail.",
        "Do not add text, letters, logos, signatures, borders, or watermarks unless the user explicitly asks for them.",
        `Artist prompt: ${prompt}`,
      ].join("\n"),
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("The image generator returned no artwork.");

    const balance = await completeServiceCredits(access.user.id, reservation.jobId, {
      provider: "openai",
      model: MODEL,
      purpose: "track-artwork",
    });

    return NextResponse.json(
      {
        success: true,
        image: `data:image/png;base64,${b64}`,
        creditCost: CREDIT_COST,
        creditBalance: balance ?? reservation.balance,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Crucible-Credit-Cost": String(CREDIT_COST),
          "X-Crucible-Credit-Balance": String(balance ?? reservation.balance),
        },
      },
    );
  } catch (error) {
    await refundServiceCredits(access.user.id, reservation.jobId).catch((refundError) =>
      console.error("Track artwork credit refund failed", refundError),
    );
    console.error("Track artwork generation error:", error);
    const message = error instanceof Error ? error.message : "The cover could not be generated.";
    return NextResponse.json(
      { error: message, refunded: true, creditCost: CREDIT_COST },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
