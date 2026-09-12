import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { authenticatePartner, hashPartnerSecret, PartnerApiError } from "../../../../lib/partner-api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreateBody = {
  external_user_id?: unknown;
  email?: unknown;
  return_url?: unknown;
  metadata?: unknown;
};

function cleanReturnUrl(value: unknown) {
  if (value == null || value === "") return null;
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const encoded = JSON.stringify(value);
  if (encoded.length > 8_000) throw new Error("metadata-too-large");
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const { client, rateHeaders } = await authenticatePartner(request, "vault_sessions:create");
    const body = (await request.json().catch(() => ({}))) as CreateBody;
    const externalUserId = String(body.external_user_id ?? "").trim().slice(0, 200);
    const email = String(body.email ?? "").trim().toLowerCase().slice(0, 320) || null;
    const returnUrl = cleanReturnUrl(body.return_url);
    const metadata = cleanMetadata(body.metadata);

    if (!externalUserId) {
      return NextResponse.json({ error: "external_user_id is required." }, { status: 400, headers: rateHeaders });
    }
    if (body.return_url && !returnUrl) {
      return NextResponse.json({ error: "return_url must be a valid HTTPS URL." }, { status: 400, headers: rateHeaders });
    }

    const token = `cvs_${randomBytes(32).toString("base64url")}`;
    const tokenHash = hashPartnerSecret(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const rows = await adminRequest<Array<{ id: string; status: string; expires_at: string }>>("partner_vault_sessions", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        client_id: client.id,
        external_user_id: externalUserId,
        email_hint: email,
        session_token_hash: tokenHash,
        return_url: returnUrl,
        metadata,
        expires_at: expiresAt,
      }),
    });
    const session = rows[0];
    if (!session) throw new Error("session-create-failed");

    const origin = new URL(request.url).origin;
    const hostedUrl = `${origin}/owner-vault/start?session=${encodeURIComponent(token)}`;

    return NextResponse.json({
      id: session.id,
      object: "vault_session",
      status: session.status,
      expires_at: session.expires_at,
      hosted_url: hostedUrl,
    }, { status: 201, headers: { ...rateHeaders, "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: error.headers });
    }
    if (error instanceof Error && error.message === "metadata-too-large") {
      return NextResponse.json({ error: "metadata must be 8 KB or smaller." }, { status: 400 });
    }
    console.error("Partner vault session creation failed", error);
    return NextResponse.json({ error: "Could not create a vault session." }, { status: 500 });
  }
}
