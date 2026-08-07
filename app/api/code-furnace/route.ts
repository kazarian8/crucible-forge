import { NextRequest, NextResponse } from "next/server";
import { assertWithinBudget, DEFAULT_JOB_BUDGET, type JobUsage } from "../../../lib/code-furnace/budget";
import { assertActionAllowed, DEFAULT_CODE_FURNACE_POLICY } from "../../../lib/code-furnace/policy";
import { buildMissionSystemPrompt, DEFAULT_MISSION_BOUNDARY } from "../../../lib/code-furnace/mission";
import { scanUntrustedText } from "../../../lib/code-furnace/untrusted-input";

export const runtime = "nodejs";
const MAX_REQUEST_BYTES = 1_000_000;

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: "Request too large." }, { status: 413 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.prompt !== "string" || typeof body.code !== "string") {
    return NextResponse.json({ error: "prompt and code are required." }, { status: 400 });
  }

  const usage: JobUsage = {
    usd: 0,
    inputTokens: 0,
    outputTokens: 0,
    toolCalls: 0,
    retries: 0,
    startedAt: Date.now(),
  };

  try {
    assertWithinBudget(DEFAULT_JOB_BUDGET, usage, {
      inputTokens: Math.ceil((body.prompt.length + body.code.length) / 4),
    });
    assertActionAllowed(DEFAULT_CODE_FURNACE_POLICY, "read_file", "/workspace/submission.txt");

    return NextResponse.json({
      status: "guardrails-ready",
      systemPrompt: buildMissionSystemPrompt(DEFAULT_MISSION_BOUNDARY),
      findings: scanUntrustedText(`${body.prompt}\n${body.code}`),
      limits: DEFAULT_JOB_BUDGET,
      message: "Guardrails passed. Model execution is intentionally not enabled in this starter route.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Code Furnace request blocked." },
      { status: 400 },
    );
  }
}
