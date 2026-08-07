export type JobBudget = {
  maxUsd: number;
  maxInputTokens: number;
  maxOutputTokens: number;
  maxToolCalls: number;
  maxRetries: number;
  maxRuntimeMs: number;
};

export type JobUsage = {
  usd: number;
  inputTokens: number;
  outputTokens: number;
  toolCalls: number;
  retries: number;
  startedAt: number;
};

export const DEFAULT_JOB_BUDGET: JobBudget = {
  maxUsd: 0.75,
  maxInputTokens: 120_000,
  maxOutputTokens: 24_000,
  maxToolCalls: 30,
  maxRetries: 2,
  maxRuntimeMs: 5 * 60 * 1000,
};

export function assertWithinBudget(
  budget: JobBudget,
  usage: JobUsage,
  projected?: Partial<JobUsage>,
) {
  const next = {
    usd: usage.usd + (projected?.usd ?? 0),
    inputTokens: usage.inputTokens + (projected?.inputTokens ?? 0),
    outputTokens: usage.outputTokens + (projected?.outputTokens ?? 0),
    toolCalls: usage.toolCalls + (projected?.toolCalls ?? 0),
    retries: usage.retries + (projected?.retries ?? 0),
    runtimeMs: Date.now() - usage.startedAt,
  };

  if (next.usd > budget.maxUsd) throw new Error("Job stopped: dollar budget exceeded.");
  if (next.inputTokens > budget.maxInputTokens) throw new Error("Job stopped: input-token budget exceeded.");
  if (next.outputTokens > budget.maxOutputTokens) throw new Error("Job stopped: output-token budget exceeded.");
  if (next.toolCalls > budget.maxToolCalls) throw new Error("Job stopped: tool-call limit exceeded.");
  if (next.retries > budget.maxRetries) throw new Error("Job stopped: retry limit exceeded.");
  if (next.runtimeMs > budget.maxRuntimeMs) throw new Error("Job stopped: runtime limit exceeded.");
}
