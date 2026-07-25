import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { promptReforgeSchema } from "@/lib/promptReforgeSchema";

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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey,
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

    const invalidFrame = body.frames.some(
      (frame) => typeof frame !== "string" || frame.trim().length === 0
    );

    if (invalidFrame) {
      return NextResponse.json(
        { error: "Every frame must be a valid image URL or data URL." },
        { status: 400 }
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

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Prompt Reforge error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "The video could not be analyzed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
