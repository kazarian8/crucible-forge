import { NextResponse } from "next/server";
import { adminRequest } from "../../../../../lib/billing/admin";
import { authenticatePartner, PartnerApiError } from "../../../../../lib/partner-api/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessionRow = {
  id: string;
  external_user_id: string;
  status: string;
  expires_at: string;
  vault_id: string | null;
  completed_at: string | null;
  created_at: string;
};

type VaultRow = {
  identity_status: string;
  identity_verified_at: string | null;
  vault_number: string;
};

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { client, rateHeaders } = await authenticatePartner(request, "vault_status:read");
    const { id } = await context.params;
    const rows = await adminRequest<SessionRow[]>(
      `partner_vault_sessions?id=eq.${encodeURIComponent(id)}&client_id=eq.${encodeURIComponent(client.id)}&select=id,external_user_id,status,expires_at,vault_id,completed_at,created_at&limit=1`,
    );
    const session = rows[0];
    if (!session) return NextResponse.json({ error: "Vault session not found." }, { status: 404, headers: rateHeaders });

    const expired = new Date(session.expires_at).getTime() <= Date.now() && !["completed", "canceled"].includes(session.status);
    let identityStatus = "not_started";
    let identityVerifiedAt: string | null = null;
    let vaultNumber: string | null = null;

    if (session.vault_id) {
      const vaults = await adminRequest<VaultRow[]>(
        `creator_vaults?id=eq.${encodeURIComponent(session.vault_id)}&select=identity_status,identity_verified_at,vault_number&limit=1`,
      );
      if (vaults[0]) {
        identityStatus = vaults[0].identity_status;
        identityVerifiedAt = vaults[0].identity_verified_at;
        vaultNumber = vaults[0].vault_number;
      }
    }

    const status = expired ? "expired" : identityStatus === "verified" ? "completed" : session.status;
    return NextResponse.json({
      id: session.id,
      object: "vault_session",
      external_user_id: session.external_user_id,
      status,
      identity_status: identityStatus,
      identity_verified: identityStatus === "verified",
      identity_verified_at: identityVerifiedAt,
      vault_number: vaultNumber,
      expires_at: session.expires_at,
      completed_at: status === "completed" ? session.completed_at ?? identityVerifiedAt : null,
      created_at: session.created_at,
    }, { headers: { ...rateHeaders, "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status, headers: error.headers });
    }
    console.error("Partner vault status failed", error);
    return NextResponse.json({ error: "Could not retrieve the vault session." }, { status: 500 });
  }
}
