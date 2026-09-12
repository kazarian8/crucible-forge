import { NextResponse } from "next/server";
import { adminRequest } from "../../../../lib/billing/admin";
import { auditVaultEvent, currentVaultUser, getVaultSecurity, hasSafeSameOrigin, isStarRequest, newUnlockToken, safeUserAgentHash, VAULT_COOKIE, VAULT_SESSION_SECONDS, vaultIdentityReady } from "../../../../lib/owner-vault/access";
import { hashVaultSecret } from "../../../../lib/owner-vault/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type KeyRow = { id: string; secret_last4: string };

export async function POST(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Owner Vault is available only on CrucibleStar." }, { status: 403 });
  if (!hasSafeSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });

  const user = await currentVaultUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const vault = await getVaultSecurity(user.id);
  if (!vault) return NextResponse.json({ error: "Owner Vault not created." }, { status: 404 });
  if (!vaultIdentityReady(vault)) {
    return NextResponse.json({ error: "Complete ID verification and legal-name verification before unlocking the vault." }, { status: 403 });
  }

  const lockedUntil = vault.unlock_locked_until ? new Date(vault.unlock_locked_until).getTime() : 0;
  if (lockedUntil > Date.now()) {
    return NextResponse.json({ error: "Too many failed vault-key attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000))) } });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const key = String(body.key ?? "").trim();
  const userAgent = request.headers.get("user-agent");
  if (!key.startsWith("cvv_live_") || key.length < 40) {
    await recordFailure(vault.id, user.id, vault.unlock_failed_count, userAgent);
    return NextResponse.json({ error: "Invalid vault key." }, { status: 401 });
  }

  const rows = await adminRequest<KeyRow[]>(
    `creator_vault_access_keys?vault_id=eq.${encodeURIComponent(vault.id)}&user_id=eq.${encodeURIComponent(user.id)}&secret_hash=eq.${hashVaultSecret(key)}&revoked_at=is.null&select=id,secret_last4&limit=1`,
  );
  if (!rows[0]) {
    await recordFailure(vault.id, user.id, vault.unlock_failed_count, userAgent);
    return NextResponse.json({ error: "Invalid vault key." }, { status: 401 });
  }

  const token = newUnlockToken();
  const expiresAt = new Date(Date.now() + VAULT_SESSION_SECONDS * 1000).toISOString();
  await adminRequest("creator_vault_unlock_sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      vault_id: vault.id,
      user_id: user.id,
      token_hash: hashVaultSecret(token),
      user_agent_hash: safeUserAgentHash(userAgent),
      expires_at: expiresAt,
    }),
  });
  await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vault.id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ unlock_failed_count: 0, unlock_locked_until: null, last_unlocked_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
  });
  await auditVaultEvent({
    vaultId: vault.id,
    userId: user.id,
    eventType: "vault_unlocked",
    eventData: { expiresAt, keyLast4: rows[0].secret_last4 },
    userAgent,
  }).catch(() => null);

  const response = NextResponse.json({ unlocked: true, expires_at: expiresAt }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(VAULT_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: VAULT_SESSION_SECONDS,
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Owner Vault is available only on CrucibleStar." }, { status: 403 });
  if (!hasSafeSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentVaultUser();
  const vault = user ? await getVaultSecurity(user.id) : null;
  const response = NextResponse.json({ locked: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(VAULT_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
  if (user && vault) {
    await adminRequest(`creator_vault_unlock_sessions?user_id=eq.${encodeURIComponent(user.id)}&vault_id=eq.${encodeURIComponent(vault.id)}&revoked_at=is.null`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    }).catch(() => null);
    await auditVaultEvent({ vaultId: vault.id, userId: user.id, eventType: "vault_locked", userAgent: request.headers.get("user-agent") }).catch(() => null);
  }
  return response;
}

async function recordFailure(vaultId: string, userId: string, currentCount: number, userAgent: string | null) {
  const next = Math.max(0, Number(currentCount) || 0) + 1;
  const lockedUntil = next >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
  await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vaultId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ unlock_failed_count: lockedUntil ? 0 : next, unlock_locked_until: lockedUntil, updated_at: new Date().toISOString() }),
  }).catch(() => null);
  await auditVaultEvent({
    vaultId,
    userId,
    eventType: lockedUntil ? "vault_key_lockout" : "vault_key_failed",
    eventData: { attempt: next },
    userAgent,
  }).catch(() => null);
}
