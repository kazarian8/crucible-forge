export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_FILE_BYTES = 250 * 1024 * 1024;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "ElevenLabs is not configured on this deployment." }, { status: 503 });
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an audio file before separating stems." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "The audio file is empty or larger than 250 MB." }, { status: 413 });
  }

  const upstreamBody = new FormData();
  upstreamBody.append("file", file, file.name);
  upstreamBody.append("stem_variation_id", "six_stems_v1");

  const upstream = await fetch(
    "https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_128",
    {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: upstreamBody,
      cache: "no-store",
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text();
    console.error("ElevenLabs stem separation failed", upstream.status, detail.slice(0, 1000));
    const message = upstream.status === 401 || upstream.status === 403
      ? "The ElevenLabs key does not have Music Stem Separation access."
      : upstream.status === 429
        ? "ElevenLabs is rate-limited or out of credits. Try again shortly."
        : "ElevenLabs could not separate this track.";
    return Response.json({ error: message }, { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/zip",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? 'attachment; filename="crucible-stems.zip"',
      "Cache-Control": "private, no-store",
    },
  });
}
