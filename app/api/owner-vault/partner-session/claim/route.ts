import { NextResponse } from "next/server";
import { adminRequest } from "../../../../../lib/billing/admin";
import { currentVaultUser, getVaultSecurity, hasSafeSameOrigin, isStarRequest, vaultIdentityReady } from "../../../../../lib/owner-vault/access";
import { hashVaultSecret } from "../../../../../lib/owner-vault/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PartnerSessionRow = {
  id: string;
  status: string;
  expires_at: string;
  return_url: string | null;
  client_id: string;
};

export async function POST(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Partner vault sessions are hosted only on CrucibleStar." }, { status: 403 });
  if (!hasSafeSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentVaultUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const token = String(body.session ?? "").trim();
  if (!token.startsWith("cvs_") || token.length < 30) {
    return NextResponse.json({ error: "Invalid or expired vault session." }, { status: 400 });
  }

  const rows = await adminRequest<PartnerSessionRow[]>(
    `partner_vault_sessions?session_token_hash=eq.${hashVaultSecret(token)}&select=id,status,expires_at,return_url,client_id&limit=1`,
  );
  const session = rows[0];
  if (!session || new Date(session.expires_at).getTime() <= Date.now() || ["expired", "canceled"].includes(session.status)) {
    return NextResponse.json({ error: "Invalid or expired vault session." }, { status: 410 });
  }

  const vault = await getVaultSecurity(user.id);
  const completed = vaultIdentityReady(vault);
  const now = new Date().toISOString();
  await adminRequest(`partner_vault_sessions?id=eq.${encodeURIComponent(session.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      user_id: user.id,
      vault_id: vault?.id ?? null,
      status: completed ? "completed" : vault ? "identity_pending" : "started",
      started_at: now,
      completed_at: completed ? now : null,
      updated_at: now,
    }),
  });

  return NextResponse.json({
    session_id: session.id,
    status: completed ? "completed" : vault ? "identity_pending" : "started",
    return_url: session.return_url,
    has_vault: Boolean(vault),
    identity_verified: completed,
  }, { headers: { "Cache-Control": "no-store" } });
}
