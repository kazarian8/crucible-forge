import { NextResponse } from "next/server";
import { adminRequest } from "../../../../../lib/billing/admin";
import { getBillingConfig, getStripeClient } from "../../../../../lib/billing/stripe";
import { auditVaultEvent, currentVaultUser, getVaultSecurity, hasSafeSameOrigin, isStarRequest } from "../../../../../lib/owner-vault/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Owner Vault identity verification is available only on CrucibleStar." }, { status: 403 });
  if (!hasSafeSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const user = await currentVaultUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const vault = await getVaultSecurity(user.id);
  if (!vault) return NextResponse.json({ error: "Create your Owner Vault before starting ID verification." }, { status: 404 });
  if (!vault.address_on_file || !vault.legal_name) {
    return NextResponse.json({ error: "Legal name and complete address are required before ID verification." }, { status: 400 });
  }
  if (vault.identity_status === "verified" && vault.legal_name_verified) {
    return NextResponse.json({ verified: true });
  }

  const { secretKey } = getBillingConfig();
  if (!secretKey) return NextResponse.json({ error: "Identity verification is temporarily unavailable." }, { status: 503 });
  const stripe = getStripeClient(secretKey);

  try {
    if (vault.identity_status === "pending") {
      const current = await stripe.identity.verificationSessions.retrieve(
        (await adminRequest<Array<{ identity_session_id: string | null }>>(
          `creator_vaults?id=eq.${encodeURIComponent(vault.id)}&select=identity_session_id&limit=1`,
        ))[0]?.identity_session_id ?? "",
      ).catch(() => null);
      if (current?.url && current.status !== "verified" && current.status !== "canceled") {
        return NextResponse.json({ url: current.url, session_id: current.id, reused: true }, { headers: { "Cache-Control": "no-store" } });
      }
    }

    const session = await stripe.identity.verificationSessions.create({
      type: "document",
      options: {
        document: {
          require_matching_selfie: true,
        },
      },
      metadata: {
        user_id: user.id,
        vault_id: vault.id,
      },
      return_url: "https://www.cruciblestar.com/owner-vault?identity=returned",
    });

    await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vault.id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        identity_provider: "stripe_identity",
        identity_status: "pending",
        identity_session_id: session.id,
        updated_at: new Date().toISOString(),
      }),
    });
    await adminRequest(
      `partner_vault_sessions?user_id=eq.${encodeURIComponent(user.id)}&vault_id=eq.${encodeURIComponent(vault.id)}&status=in.(created,started,identity_pending)`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status: "identity_pending", updated_at: new Date().toISOString() }),
      },
    ).catch(() => null);

    await auditVaultEvent({
      vaultId: vault.id,
      userId: user.id,
      eventType: "identity_verification_started",
      eventData: { provider: "stripe_identity", sessionId: session.id },
      userAgent: request.headers.get("user-agent"),
    }).catch(() => null);

    if (!session.url) return NextResponse.json({ error: "Stripe Identity did not return a verification URL." }, { status: 502 });
    return NextResponse.json({ url: session.url, session_id: session.id }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Stripe Identity session creation failed", error);
    return NextResponse.json({ error: "ID verification could not be started. Stripe Identity may need to be enabled for the Crucible account." }, { status: 503 });
  }
}
