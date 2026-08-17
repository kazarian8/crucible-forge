import { authorizePaidProvider } from "../../../lib/auth/provider-access";
import { CREDIT_PRICES } from "../../../lib/credits/pricing";
import {
  completeServiceCredits,
  CreditReservationError,
  refundServiceCredits,
  reserveServiceCredits,
} from "../../../lib/credits/server";

export const runtime = "nodejs";
export const maxDuration = 300;

// Vercel Functions accept request bodies up to 100 MB. Leave headroom for
// multipart framing and headers; the browser prepares a 16-bit WAV below this.
const MAX_FILE_BYTES = 95 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/flac",
  "audio/x-flac",
  "audio/aiff",
  "audio/x-aiff",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/ogg",
]);

function matchesAudioSignature(bytes: Uint8Array) {
  const text = (start: number, end: number) =>
    String.fromCharCode(...bytes.slice(start, end));

  const wav = text(0, 4) === "RIFF" && text(8, 12) === "WAVE";
  const aiff =
    text(0, 4) === "FORM" &&
    (text(8, 12) === "AIFF" || text(8, 12) === "AIFC");
  const mp3 =
    text(0, 3) === "ID3" ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
  const aac = bytes[0] === 0xff && (bytes[1] & 0xf6) === 0xf0;
  const mp4 = text(4, 8) === "ftyp";

  return (
    wav ||
    aiff ||
    mp3 ||
    aac ||
    mp4 ||
    text(0, 4) === "fLaC" ||
    text(0, 4) === "OggS"
  );
}

export async function POST(request: Request) {
  if (process.env.PAID_PROVIDER_ROUTES_ENABLED !== "true") {
    return Response.json(
      { error: "Stem separation is temporarily unavailable while Crucible completes access-control verification." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const access = await authorizePaidProvider("stem-separation", 2);
  if (access.response) return access.response;
  if (!access.user) {
    return Response.json({ error: "Sign in is required." }, { status: 401 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY ?? process.env.ELEVEN_LABS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Stem separation is temporarily unavailable on this deployment." }, { status: 503 });
  }

  const incoming = await request.formData();
  const file = incoming.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an audio file before separating stems." }, { status: 400 });
  }
  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "The stem source is empty or larger than 95 MB." }, { status: 413 });
  }
  if (!ALLOWED_AUDIO_TYPES.has(file.type.toLowerCase())) {
    return Response.json(
      { error: "Upload a supported WAV, MP3, FLAC, AIFF, M4A, AAC, or OGG audio file." },
      { status: 415 },
    );
  }

  const signature = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (!matchesAudioSignature(signature)) {
    return Response.json(
      { error: "The uploaded file does not contain a supported audio format." },
      { status: 415, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const upstreamBody = new FormData();
  upstreamBody.append("file", file, file.name);
  upstreamBody.append("stem_variation_id", "six_stems_v1");

  let reservation;
  try {
    reservation = await reserveServiceCredits({
      userId: access.user.id,
      serviceId: "stem-separation",
      fileName: file.name,
      cost: CREDIT_PRICES.stemSeparation,
    });
  } catch (error) {
    if (
      error instanceof CreditReservationError &&
      error.code === "INSUFFICIENT_CREDITS"
    ) {
      return Response.json(
        {
          error: `Stem separation costs ${CREDIT_PRICES.stemSeparation} coins. Add credits or wait for your monthly refresh.`,
        },
        { status: 402, headers: { "Cache-Control": "private, no-store" } },
      );
    }
    return Response.json(
      { error: "The Crucible credit service is temporarily unavailable." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      "https://api.elevenlabs.io/v1/music/stem-separation?output_format=mp3_44100_128",
      {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: upstreamBody,
        cache: "no-store",
      },
    );
  } catch (error) {
    await refundServiceCredits(access.user.id, reservation.jobId).catch(
      (refundError) => console.error("Stem credit refund failed", refundError),
    );
    console.error("Stem separation request failed", error);
    return Response.json(
      { error: "Crucible could not reach the stem forge." },
      { status: 502, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  if (!upstream.ok) {
    const detail = await upstream.text();
    await refundServiceCredits(access.user.id, reservation.jobId).catch(
      (refundError) => console.error("Stem credit refund failed", refundError),
    );
    console.error("ElevenLabs stem separation failed", upstream.status, detail.slice(0, 1000));
    const message = upstream.status === 401 || upstream.status === 403
      ? "Stem separation is temporarily unavailable."
      : upstream.status === 429
        ? "The stem forge is at capacity. Try again shortly."
        : "Crucible could not separate this track.";
    return Response.json({ error: message }, { status: upstream.status });
  }

  const balance = await completeServiceCredits(
    access.user.id,
    reservation.jobId,
    { providerStatus: upstream.status },
  );

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/zip",
      "Content-Disposition": upstream.headers.get("content-disposition") ?? 'attachment; filename="crucible-stems.zip"',
      "Cache-Control": "private, no-store",
      "X-Crucible-Credit-Cost": String(CREDIT_PRICES.stemSeparation),
      "X-Crucible-Credit-Balance": String(balance ?? reservation.balance),
    },
  });
}
