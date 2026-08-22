import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { authorizePaidProvider } from "../../../lib/auth/provider-access";
import { getPictureActionPrice } from "../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../lib/credits/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const SYSTEM_RULE = "Change only what the user requests. Preserve every other visible detail, subject, composition, identity cue, lighting relationship, and object as closely as possible.";

const PRESETS: Record<string, string> = {
  "Enhance Natural": "Naturally enhance clarity, exposure, color balance, texture and sharpness. Keep the result realistic and faithful to the original. Do not redesign faces, bodies, objects or the scene.",
  "Enhance Blurry Image": "Reconstruct detail lost to blur or low resolution while preserving the original composition, pose and visible characteristics. Keep the result realistic. This is AI reconstruction, so infer only what is necessary to restore a coherent image.",
  "Enhance Beauty": "Polish the portrait naturally: improve skin, eyes, hair or beard detail, color and lighting while preserving facial geometry, age characteristics, expression and identity. Beauty enhancement must polish, not redesign.",
  "Remove Background": "Remove the background cleanly and isolate the intended foreground subject or subjects with precise natural edges. Return a transparent background.",
  "Restore Photo": "Repair fading, scratches, dust, damage and age-related defects while preserving the people, scene and period character.",
  "Colorize Photo": "Add realistic, restrained color to a black-and-white image while preserving all structure and details.",
  "Sharpen": "Increase edge and texture clarity naturally without halos or invented scene changes.",
  "Denoise": "Reduce visible grain and digital noise while retaining natural detail and texture.",
  "Brighten": "Raise exposure and shadow visibility naturally without clipping highlights or changing the scene.",
  "Fix Lighting": "Balance exposure, highlights, shadows and local lighting while preserving the original mood.",
  "Fix Color": "Correct white balance, color casts and saturation while keeping realistic colors.",
  "Blur Background": "Apply natural shallow-depth-of-field blur to the background only. Keep the foreground subject unchanged.",
  "Vivid": "Increase color richness and contrast tastefully while preserving a photographic look.",
  "Warm": "Apply a natural warm color treatment without changing content.",
  "Cool": "Apply a natural cool color treatment without changing content.",
  "Noir": "Convert the image to a dramatic cinematic monochrome treatment while preserving composition and subjects.",
  "Black & White": "Convert the image to clean photographic black and white while preserving tonal detail.",
  "Pencil Drawing": "Transform the image into a detailed pencil drawing while preserving composition and recognizable subjects.",
  "Oil Painting": "Transform the image into a realistic oil-painted interpretation while preserving composition and recognizable subjects.",
};

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/);
  if (!match) throw new Error("Unsupported image format. Use PNG, JPEG or WebP.");
  const mime = match[1];
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.byteLength > 12 * 1024 * 1024) throw new Error("Image is too large. Maximum upload is 12 MB.");
  const ext = mime === "image/jpeg" ? "jpg" : mime.split("/")[1];
  return { mime, buffer, ext };
}

export async function GET() {
  return NextResponse.json({
    service: "picture-furnace",
    ready: Boolean(process.env.OPENAI_API_KEY),
    model: "gpt-image-1",
  });
}

export async function POST(request: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
  }

  const access = await authorizePaidProvider("picture-furnace", 6);
  if (access.response) return access.response;
  if (!access.user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  let body: { image?: string; command?: string; customPrompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid image request." }, { status: 400 });
  }

  if (!body.image || !body.command) {
    return NextResponse.json({ error: "An image and command are required." }, { status: 400 });
  }

  let parsed: ReturnType<typeof parseDataUrl>;
  try {
    parsed = parseDataUrl(body.image);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be prepared.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const cost = getPictureActionPrice(body.command);
  let reservation;
  try {
    reservation = await reserveServiceCredits({
      userId: access.user.id,
      serviceId: `picture-furnace:${body.command}`,
      fileName: `picture-${body.command.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "edit"}.${parsed.ext}`,
      cost,
    });
  } catch (error) {
    if (error instanceof CreditReservationError && error.code === "INSUFFICIENT_CREDITS") {
      return NextResponse.json(
        { error: `${body.command} costs ${cost} credits. Add credits or wait for your monthly refresh.`, creditCost: cost },
        { status: 402, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return NextResponse.json(
      { error: "The Crucible credit service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const { mime, buffer, ext } = parsed;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 240_000, maxRetries: 1 });
    const preset = PRESETS[body.command];
    const requestedEdit = preset ?? body.customPrompt?.trim() ?? body.command.trim();
    const removeBackground = body.command === "Remove Background";

    const image = await toFile(buffer, `picture-furnace-input.${ext}`, { type: mime });
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image,
      prompt: `${SYSTEM_RULE}\n\nRequested edit: ${requestedEdit}`,
      input_fidelity: "high",
      quality: "high",
      size: "auto",
      background: removeBackground ? "transparent" : "auto",
      output_format: "png",
    });

    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("The image editor returned no image.");

    const balance = await completeServiceCredits(access.user.id, reservation.jobId, {
      command: body.command,
      provider: "openai",
      model: "gpt-image-1",
    });

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${b64}`,
      creditCost: cost,
      creditBalance: balance ?? reservation.balance,
    }, {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Crucible-Credit-Cost": String(cost),
        "X-Crucible-Credit-Balance": String(balance ?? reservation.balance),
      },
    });
  } catch (error) {
    await refundServiceCredits(access.user.id, reservation.jobId).catch((refundError) =>
      console.error("Picture Furnace credit refund failed", refundError),
    );
    console.error("Picture Furnace error:", error);
    const message = error instanceof Error ? error.message : "The image could not be edited.";
    return NextResponse.json(
      { error: message, refunded: true, creditCost: cost },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
