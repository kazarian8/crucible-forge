import { NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { adminRequest } from "../../../lib/billing/admin";
import { createVaultNumber, createVaultSecret, hashVaultSecret } from "../../../lib/owner-vault/security";
import { auditVaultEvent, hasSafeSameOrigin, isStarRequest, validUnlockForUser } from "../../../lib/owner-vault/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type VaultRow = {
  id: string;
  vault_number: string;
  legal_name: string;
  legal_name_verified: boolean;
  artist_name: string | null;
  street_address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  address_on_file: boolean;
  business_name: string | null;
  business_type: string;
  identity_status: string;
  identity_verified_at: string | null;
  declaration_accepted_at: string | null;
  created_at: string;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  artist_name: string | null;
  street_address: string | null;
  apartment: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
};

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

function cleanText(value: unknown, max = 200) {
  return String(value ?? "").trim().slice(0, max);
}

function cleanBusinessType(value: unknown) {
  const allowed = new Set(["individual", "sole_proprietor", "llc", "corporation", "partnership", "other"]);
  const type = cleanText(value, 40) || "individual";
  return allowed.has(type) ? type : "individual";
}

async function getVault(userId: string) {
  const rows = await adminRequest<VaultRow[]>(
    `creator_vaults?user_id=eq.${encodeURIComponent(userId)}&select=id,vault_number,legal_name,legal_name_verified,artist_name,street_address,apartment,city,state,postal_code,country,address_on_file,business_name,business_type,identity_status,identity_verified_at,declaration_accepted_at,created_at&limit=1`,
  );
  return rows[0] ?? null;
}

async function getProfile(userId: string) {
  const rows = await adminRequest<ProfileRow[]>(
    `profiles?id=eq.${encodeURIComponent(userId)}&select=first_name,last_name,artist_name,street_address,apartment,city,state,zip_code,country&limit=1`,
  );
  return rows[0] ?? null;
}

function publicVaultView(vault: VaultRow, unlocked: boolean) {
  return {
    id: vault.id,
    vault_number: vault.vault_number,
    legal_name: unlocked ? vault.legal_name : `${vault.legal_name.slice(0, 1)}••••••`,
    legal_name_verified: vault.legal_name_verified,
    artist_name: vault.artist_name,
    street_address: unlocked ? vault.street_address : null,
    apartment: unlocked ? vault.apartment : null,
    city: unlocked ? vault.city : null,
    state: unlocked ? vault.state : null,
    postal_code: unlocked ? vault.postal_code : null,
    country: unlocked ? vault.country : null,
    address_on_file: vault.address_on_file,
    business_name: unlocked ? vault.business_name : null,
    business_type: vault.business_type,
    identity_status: vault.identity_status,
    identity_verified_at: vault.identity_verified_at,
    declaration_accepted_at: vault.declaration_accepted_at,
    created_at: vault.created_at,
    unlocked,
  };
}

export async function GET(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Owner Vault is available only on CrucibleStar." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [vault, profile] = await Promise.all([getVault(user.id), getProfile(user.id)]);
  const unlocked = vault ? await validUnlockForUser(user.id, vault.id) : false;
  return NextResponse.json({
    vault: vault ? publicVaultView(vault, unlocked) : null,
    defaults: vault ? null : {
      legal_name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
      artist_name: profile?.artist_name ?? "",
      street_address: profile?.street_address ?? "",
      apartment: profile?.apartment ?? "",
      city: profile?.city ?? "",
      state: profile?.state ?? "",
      postal_code: profile?.zip_code ?? "",
      country: profile?.country ?? "US",
    },
  }, { headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache" } });
}

export async function POST(request: Request) {
  if (!isStarRequest(request)) return NextResponse.json({ error: "Owner Vault is available only on CrucibleStar." }, { status: 403 });
  if (!hasSafeSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const legalName = cleanText(body.legal_name);
  const artistName = cleanText(body.artist_name) || null;
  const streetAddress = cleanText(body.street_address);
  const apartment = cleanText(body.apartment, 100) || null;
  const city = cleanText(body.city, 120);
  const state = cleanText(body.state, 120);
  const postalCode = cleanText(body.postal_code, 30);
  const country = cleanText(body.country, 80) || "US";
  const businessName = cleanText(body.business_name) || null;
  const businessType = cleanBusinessType(body.business_type);
  const declarationAccepted = body.declaration_accepted === true;

  if (!legalName || !streetAddress || !city || !state || !postalCode || !country) {
    return NextResponse.json({ error: "Legal name and complete mailing address are required." }, { status: 400 });
  }
  if (!declarationAccepted) {
    return NextResponse.json({ error: "You must accept the owner declaration before creating the vault." }, { status: 400 });
  }

  const existing = await getVault(user.id);
  const now = new Date().toISOString();
  const identityReset = existing && existing.legal_name !== legalName;
  const payload = {
    legal_name: legalName,
    artist_name: artistName,
    street_address: streetAddress,
    apartment,
    city,
    state,
    postal_code: postalCode,
    country,
    address_on_file: true,
    business_name: businessName,
    business_type: businessType,
    declaration_accepted_at: existing?.declaration_accepted_at ?? now,
    ...(identityReset ? { identity_status: "not_started", identity_session_id: null, identity_verified_at: null, legal_name_verified: false } : {}),
    updated_at: now,
  };

  if (existing) {
    const rows = await adminRequest<VaultRow[]>(
      `creator_vaults?id=eq.${encodeURIComponent(existing.id)}&select=id,vault_number,legal_name,legal_name_verified,artist_name,street_address,apartment,city,state,postal_code,country,address_on_file,business_name,business_type,identity_status,identity_verified_at,declaration_accepted_at,created_at`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) },
    );
    await auditVaultEvent({
      vaultId: existing.id,
      userId: user.id,
      eventType: identityReset ? "vault_identity_data_changed" : "vault_profile_updated",
      eventData: { identityReset: Boolean(identityReset) },
      userAgent: request.headers.get("user-agent"),
    }).catch(() => null);
    return NextResponse.json({ vault: publicVaultView(rows[0] ?? { ...existing, ...payload }, false), created: false });
  }

  const vaultNumber = createVaultNumber();
  const vaultRows = await adminRequest<VaultRow[]>("creator_vaults", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      user_id: user.id,
      vault_number: vaultNumber,
      ...payload,
    }),
  });
  const vault = vaultRows[0];
  if (!vault) return NextResponse.json({ error: "Could not create the owner vault." }, { status: 500 });

  const secret = createVaultSecret();
  await adminRequest("creator_vault_access_keys", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      vault_id: vault.id,
      user_id: user.id,
      secret_hash: hashVaultSecret(secret),
      secret_last4: secret.slice(-4),
    }),
  });

  await adminRequest(
    `partner_vault_sessions?user_id=eq.${encodeURIComponent(user.id)}&vault_id=is.null&status=in.(started,identity_pending)`,
    {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ vault_id: vault.id, status: "identity_pending", updated_at: now }),
    },
  ).catch(() => null);

  await auditVaultEvent({
    vaultId: vault.id,
    userId: user.id,
    eventType: "vault_created",
    eventData: { vaultNumber: vault.vault_number },
    userAgent: request.headers.get("user-agent"),
  }).catch(() => null);

  return NextResponse.json({
    vault: publicVaultView(vault, false),
    created: true,
    access_secret: secret,
    access_secret_notice: "Shown once. This is an additional vault unlock factor; Crucible stores only its hash.",
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
