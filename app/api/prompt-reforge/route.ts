import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { promptReforgeSchema } from "../../../lib/promptReforgeSchema";
import { authorizePaidProvider } from "../../../lib/auth/provider-access";
import { CREDIT_PRICES } from "../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../lib/credits/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const REFORGE_INSTRUCTIONS = `
You are Prompt Reforge, a professional video reverse-engineering system.

Analyze the supplied chronological video frames as one continuous video.

Reconstruct the video's production logic so another creator can produce a
visually similar but original video.

Analyze the concept, subjects, environment, composition, camera movement,
lighting, color grading, scene sequence, transitions, effects, typography,
audio direction, pacing and continuity.

Create:
- A detailed master recreation prompt
- Scene-by-scene generation prompts
- CapCut, Sora, Veo, Kling and Runway adaptations
- A negative prompt
- An editing recipe
- Continuity rules

Do not identify private individuals. Do not copy logos, protected characters
or a creator's exact signature style. Describe general production techniques.
Clearly label uncertain technical details as estimates.
`;

type ReforgeRequest = {
  frames: string[];
  duration?: number;
  aspectRatio?: string;
  userNotes?: string;
};

export async function POST(request: NextRequest) {
  try {
    if (process.env.PAID_PROVIDER_ROUTES_ENABLED !== "true") {
      return NextResponse.json(
        { error: "Prompt Reforge is temporarily unavailable while Crucible completes access-control verification." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const access = await authorizePaidProvider("prompt-reforge", 4);
    if (access.response) return access.response;
    if (!access.user) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const body = (await request.json()) as ReforgeRequest;

    if (!Array.isArray(body.frames) || body.frames.length < 3) {
      return NextResponse.json(
        { error: "At least three video frames are required." },
        { status: 400 }
      );
    }

    if (body.frames.length > 16) {
      return NextResponse.json(
        { error: "A maximum of sixteen frames is allowed." },
        { status: 400 }
      );
    }

    const framePattern = /^data:image\/(?:jpeg|png|webp);base64,/;
    const totalFrameBytes = body.frames.reduce(
      (total, frame) => total + (typeof frame === "string" ? frame.length : 0),
      0,
    );
    if (
      body.frames.some(
        (frame) =>
          typeof frame !== "string" ||
          !framePattern.test(frame) ||
          frame.length > 1_500_000,
      ) ||
      totalFrameBytes > 8_000_000
    ) {
      return NextResponse.json(
        { error: "Video frames must be supported images within the upload limit." },
        { status: 413, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const imageInputs = body.frames.map((frame) => ({
      type: "input_image" as const,
      image_url: frame,
      detail: "high" as const,
    }));

    const videoInformation = `
Video duration: ${body.duration ?? "unknown"} seconds
Aspect ratio: ${body.aspectRatio ?? "unknown"}
Creator notes: ${body.userNotes?.trim() || "None supplied"}

The images are chronological frames extracted at evenly spaced intervals.
`;

    let reservation;
    try {
      reservation = await reserveServiceCredits({
        userId: access.user.id,
        serviceId: "prompt-reforge",
        fileName: "video-frame-analysis",
        cost: CREDIT_PRICES.promptReforge,
      });
    } catch (error) {
      if (
        error instanceof CreditReservationError &&
        error.code === "INSUFFICIENT_CREDITS"
      ) {
        return NextResponse.json(
          {
            error: `Prompt Reforge costs ${CREDIT_PRICES.promptReforge} coins. Add credits or wait for your monthly refresh.`,
          },
          { status: 402, headers: { "Cache-Control": "private, no-store" } },
        );
      }
      return NextResponse.json(
        { error: "The Crucible credit service is temporarily unavailable." },
        { status: 503, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    try {
      const response = await openai.responses.create({
        model: "gpt-5",
        instructions: REFORGE_INSTRUCTIONS,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: videoInformation,
              },
              ...imageInputs,
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "prompt_reforge_analysis",
            strict: true,
            schema: promptReforgeSchema,
          },
        },
      });

      if (!response.output_text) {
        throw new Error("The analysis returned no output.");
      }

      const analysis = JSON.parse(response.output_text);
      const balance = await completeServiceCredits(
        access.user.id,
        reservation.jobId,
        { model: "gpt-5", frameCount: body.frames.length },
      );

      return NextResponse.json({
        success: true,
        analysis,
        credits: {
          cost: CREDIT_PRICES.promptReforge,
          balance: balance ?? reservation.balance,
        },
      });
    } catch (error) {
      await refundServiceCredits(access.user.id, reservation.jobId).catch(
        (refundError) => console.error("Prompt credit refund failed", refundError),
      );
      throw error;
    }
  } catch (error) {
    console.error("Prompt Reforge error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "The video could not be analyzed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
