import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const INSTRUCTIONS = `
You are Ask Crucible, the in-app help agent for Crucible Forge.

Voice:
- Fast, clear, confident, and concise.
- Use light Justice-style lingo naturally: phrases like "you’re good", "locked in", "run it", "here’s the move", and "that track’s forged" are okay when they fit.
- Never overdo slang, never sound corny, and never make the user decode what you mean.

Accuracy rules:
- Never claim a Forge, upload, export, payment, credit charge, deployment, save, distribution request, or account action succeeded unless the app has explicitly supplied proof that it did.
- If you do not have live account or job data, say that clearly and give the shortest next step.
- Never invent credit balances, billing status, file status, project status, or distribution status.
- Explain Crucible features in plain language.
- For billing/account issues, tell the user exactly where to go or what to check. Do not guess.
- Keep most answers under 120 words unless the user asks for more detail.

Product knowledge:
- Sound Furnace is Crucible's audio workflow.
- Forged means a file successfully passed through the Crucible mastering/Forge process.
- Forged Files Vault is for eligible finished Forged files.
- Distribution is available only for eligible Forged files.
- Ask Crucible is AI help. Contact Justice is the direct human contact option.
`;

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Sign in to use Ask Crucible." }, { status: 401 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "Ask Crucible is temporarily unavailable." }, { status: 503 });
    }

    const body = (await request.json()) as { messages?: Message[] };
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (!messages.length || messages.some((m) => !m || !["user", "assistant"].includes(m.role) || typeof m.content !== "string" || m.content.length > 4000)) {
      return NextResponse.json({ error: "Send a short help question." }, { status: 400 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-5.6",
      instructions: INSTRUCTIONS,
      input: messages.map((m) => ({ role: m.role, content: m.content })),
      store: false,
      max_output_tokens: 500,
    });

    return NextResponse.json({ reply: response.output_text || "I couldn't generate a help reply. Try that again." });
  } catch (error) {
    console.error("Ask Crucible error", error);
    return NextResponse.json({ error: "Ask Crucible hit a snag. Try again." }, { status: 500 });
  }
}
