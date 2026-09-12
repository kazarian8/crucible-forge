import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { adminRequest } from "../billing/admin";
import { createClient } from "../supabase/server";
import { hashVaultSecret } from "./security";

export const VAULT_COOKIE = "__Host-crucible_vault";
export const VAULT_SESSION_SECONDS = 15 * 60;

export type VaultSecurityRow = {
  id: string;
  user_id: string;
  vault_number: string;
  legal_name: string;
  legal_name_verified: boolean;
  address_on_file: boolean;
  identity_status: string;
  identity_verified_at: string | null;
  unlock_failed_count: number;
  unlock_locked_until: string | null;
};

type UnlockSessionRow = {
  id: string;
  token_hash: string;
  user_agent_hash: string | null;
  expires_at: string;
  revoked_at: string | null;
};

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function safeUserAgentHash(value: string | null) {
  return value ? sha256(value.slice(0, 1000)) : null;
}

export function newUnlockToken() {
  return `cvu_${randomBytes(32).toString("base64url")}`;
}

export async function currentVaultUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getVaultSecurity(userId: string) {
  const rows = await adminRequest<VaultSecurityRow[]>(
    `creator_vaults?user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,vault_number,legal_name,legal_name_verified,address_on_file,identity_status,identity_verified_at,unlock_failed_count,unlock_locked_until&limit=1`,
  );
  return rows[0] ?? null;
}

export function vaultIdentityReady(vault: VaultSecurityRow | null) {
  return Boolean(vault && vault.identity_status === "verified" && vault.legal_name_verified && vault.address_on_file);
}

export async function validUnlockForUser(userId: string, vaultId: string, token?: string | null) {
  const rawToken = token ?? (await cookies()).get(VAULT_COOKIE)?.value ?? null;
  if (!rawToken) return false;

  const requestHeaders = await headers();
  const uaHash = safeUserAgentHash(requestHeaders.get("user-agent"));
  const rows = await adminRequest<UnlockSessionRow[]>(
    `creator_vault_unlock_sessions?user_id=eq.${encodeURIComponent(userId)}&vault_id=eq.${encodeURIComponent(vaultId)}&token_hash=eq.${hashVaultSecret(rawToken)}&revoked_at=is.null&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,token_hash,user_agent_hash,expires_at,revoked_at&limit=1`,
  );
  const session = rows[0];
  if (!session) return false;
  if (session.user_agent_hash && uaHash && session.user_agent_hash !== uaHash) return false;
  return true;
}

export async function requireUnlockedVault() {
  const user = await currentVaultUser();
  if (!user) return { ok: false as const, status: 401, error: "Sign in required." };
  const vault = await getVaultSecurity(user.id);
  if (!vault) return { ok: false as const, status: 404, error: "Owner Vault not created." };
  if (!vaultIdentityReady(vault)) return { ok: false as const, status: 403, error: "Verified identity, legal name, and address are required." };
  if (!(await validUnlockForUser(user.id, vault.id))) return { ok: false as const, status: 423, error: "Owner Vault is locked." };
  return { ok: true as const, user, vault };
}

export async function auditVaultEvent(args: {
  vaultId?: string | null;
  userId?: string | null;
  eventType: string;
  eventData?: Record<string, unknown>;
  userAgent?: string | null;
}) {
  await adminRequest("creator_vault_audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      vault_id: args.vaultId ?? null,
      user_id: args.userId ?? null,
      event_type: args.eventType,
      event_data: args.eventData ?? {},
      user_agent_hash: safeUserAgentHash(args.userAgent ?? null),
    }),
  });
}

export function isStarRequest(request: Request) {
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  return host === "cruciblestar.com" || host === "www.cruciblestar.com" || host === "localhost" || host === "127.0.0.1";
}

export function hasSafeSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
