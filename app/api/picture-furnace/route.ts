import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 503 });
    }

    const body = await request.json() as { image?: string; command?: string; customPrompt?: string };
    if (!body.image || !body.command) {
      return NextResponse.json({ error: "An image and command are required." }, { status: 400 });
    }

    const { mime, buffer, ext } = parseDataUrl(body.image);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const preset = PRESETS[body.command];
    const requestedEdit = preset ?? body.customPrompt?.trim() ?? body.command.trim();
    const removeBackground = body.command === "Remove Background";

    const image = new File([buffer], `picture-furnace-input.${ext}`, { type: mime });
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

    return NextResponse.json({ success: true, image: `data:image/png;base64,${b64}` });
  } catch (error) {
    console.error("Picture Furnace error:", error);
    const message = error instanceof Error ? error.message : "The image could not be edited.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
