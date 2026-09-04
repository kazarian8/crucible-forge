import { createHash } from "node:crypto";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 300;

const TEST_USER_ID = "b411defb-3de6-4b3a-b498-6763acbf9b49";
const TOKEN_HASH = "ca3375746379a7f6bbbc020984c461d5aa9339535dd49335dbffcd5377dd877a";
const EXPIRES_AT = 1788485939921;

function silentWav() {
  const sampleRate = 8_000;
  const samples = sampleRate;
  const dataSize = samples * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVEfmt ", 8);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  return wav;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const receivedHash = createHash("sha256").update(token).digest("hex");
  if (Date.now() > EXPIRES_AT || receivedHash !== TOKEN_HASH) {
    return NextResponse.json({ error: "Test authorization expired." }, { status: 404 });
  }

  const admin = createAdminClient();
  const artworkPath = `${TEST_USER_ID}/e2e-${crypto.randomUUID()}.png`;
  const audioPath = `${TEST_USER_ID}/e2e-${crypto.randomUUID()}.wav`;
  let trackId = "";

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 240_000, maxRetries: 1 });
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: "Original square music cover art: a molten orange phoenix made of sound waves above a black forge, cinematic, no text, no logo, no watermark.",
      size: "1024x1024",
      quality: "medium",
      output_format: "png",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI returned no image.");
    const artwork = Buffer.from(b64, "base64");
    const pngValid = artwork.length > 8 && artwork.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
    if (!pngValid) throw new Error("OpenAI output was not a valid PNG.");

    const wav = silentWav();
    const { error: artError } = await admin.storage.from("track-artwork").upload(artworkPath, artwork, {
      contentType: "image/png",
      upsert: false,
    });
    if (artError) throw artError;
    const { error: audioError } = await admin.storage.from("star-music").upload(audioPath, wav, {
      contentType: "audio/wav",
      upsert: false,
    });
    if (audioError) throw audioError;

    const { data: publicData } = admin.storage.from("track-artwork").getPublicUrl(artworkPath);
    const { data: saved, error: saveError } = await admin.from("star_music_files").insert({
      user_id: TEST_USER_ID,
      title: "AI Cover E2E Test",
      original_filename: "e2e-test.wav",
      storage_path: audioPath,
      artwork_url: publicData.publicUrl,
      mime_type: "audio/wav",
      size_bytes: wav.length,
      sha256: createHash("sha256").update(wav).digest("hex"),
      category: "track",
      duration_seconds: 1,
      sample_rate: 8000,
      channels: 1,
      verification_status: "verified",
      verification_notes: ["Disposable production E2E test"],
      analysis: { test: true },
      publish_status: "draft",
    }).select("id,artwork_url,storage_path").single();
    if (saveError || !saved) throw saveError ?? new Error("Track save returned no row.");
    trackId = saved.id;

    const savedToTrack =
      saved.artwork_url === publicData.publicUrl &&
      saved.storage_path === audioPath;

    return NextResponse.json({
      success: pngValid && savedToTrack,
      generatedPng: pngValid,
      generatedBytes: artwork.length,
      savedToTrack,
      cleanupScheduled: true,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown E2E failure",
    }, { status: 500, headers: { "Cache-Control": "private, no-store" } });
  } finally {
    if (trackId) await admin.from("star_music_files").delete().eq("id", trackId);
    await Promise.all([
      admin.storage.from("track-artwork").remove([artworkPath]),
      admin.storage.from("star-music").remove([audioPath]),
    ]);
    await admin.auth.admin.deleteUser(TEST_USER_ID).catch(() => undefined);
  }
}
