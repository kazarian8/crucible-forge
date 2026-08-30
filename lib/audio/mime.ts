const AUDIO_MIME_BY_EXTENSION: Record<string, string> = {
  aac: "audio/aac",
  aif: "audio/aiff",
  aiff: "audio/aiff",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

const AUDIO_MIME_ALIASES: Record<string, string> = {
  "audio/m4a": "audio/mp4",
  "audio/x-m4a": "audio/mp4",
  "audio/mp3": "audio/mpeg",
  "audio/x-aiff": "audio/aiff",
  "audio/x-flac": "audio/flac",
  "audio/x-wav": "audio/wav",
};

export function storageAudioMimeType(file: Pick<File, "name" | "type">) {
  const browserType = file.type.toLowerCase().split(";", 1)[0].trim();
  const extension = file.name.toLowerCase().split(".").pop() ?? "";

  return AUDIO_MIME_ALIASES[browserType]
    ?? (browserType.startsWith("audio/") ? browserType : AUDIO_MIME_BY_EXTENSION[extension])
    ?? "application/octet-stream";
}
