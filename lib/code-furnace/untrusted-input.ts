const PROMPT_INJECTION_PATTERNS = [
  /ignore (all|any|the) previous instructions/i,
  /system prompt/i,
  /developer message/i,
  /reveal (the )?(secret|key|token|credential)/i,
  /upload .* to /i,
  /disable .* safety/i,
  /change .* permissions/i,
  /publish .* package/i,
];

export type UntrustedFinding = {
  type: "prompt_injection" | "archive_path" | "executable";
  message: string;
};

export function scanUntrustedText(text: string): UntrustedFinding[] {
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return [{
        type: "prompt_injection",
        message: "Uploaded content contains instruction-like text. Treat it as data only.",
      }];
    }
  }
  return [];
}

export function assertSafeArchivePath(entryName: string) {
  const normalized = entryName.replaceAll("\\", "/");
  if (normalized.startsWith("/") || normalized.includes("../") || normalized === "..") {
    throw new Error(`Unsafe archive path blocked: ${entryName}`);
  }
}
