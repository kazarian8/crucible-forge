import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../../lib/supabase/server";
import { createAdminClient } from "../../../lib/supabase/admin";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

async function emailAlreadyExists(email: string): Promise<boolean | undefined> {
  try {
    const admin = createAdminClient();
    for (let page = 1; page <= 10; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return undefined;
      if (data.users.some((user) => user.email?.toLowerCase() === email)) return true;
      if (data.users.length < 1000) return false;
    }
    return false;
  } catch {
    return undefined;
  }
}

async function validateExpertMusicianInvite(email: string, token: string) {
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("expert_musician_dev_access")
    .select("id,email,invite_expires_at,redeemed_at,enabled")
    .eq("invite_token_hash", tokenHash)
    .eq("email", email)
    .eq("enabled", true)
    .maybeSingle<{
      id: string;
      email: string;
      invite_expires_at: string;
      redeemed_at: string | null;
      enabled: boolean;
    }>();

  if (error || !data || data.redeemed_at) return null;
  if (new Date(data.invite_expires_at).getTime() <= Date.now()) return null;
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
      usernameFont?: "default" | "gochi_hand";
      next?: string;
      website?: string;
      startedAt?: number;
      inviteToken?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const username = body.username?.trim() ?? "";
    const usernameFont = body.usernameFont === "gochi_hand" ? "gochi_hand" : "default";
    const startedAt = Number(body.startedAt || 0);
    const now = Date.now();

    if (body.website) return NextResponse.json({ error: "blocked" }, { status: 400 });
    if (!startedAt || now - startedAt < 2500 || now - startedAt > 30 * 60 * 1000) {
      return NextResponse.json({ error: "blocked" }, { status: 400 });
    }
    if (!email || !password || !/^[A-Za-z0-9_]{3,24}$/.test(username) || password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    }

    let expertInvite: Awaited<ReturnType<typeof validateExpertMusicianInvite>> = null;
    if (body.inviteToken) {
      expertInvite = await validateExpertMusicianInvite(email, body.inviteToken);
      if (!expertInvite) {
        return NextResponse.json({ error: "invalid-invite" }, { status: 403 });
      }
    }

    const existing = await emailAlreadyExists(email);
    if (existing === true) {
      return NextResponse.json({ error: "email-in-use" }, { status: 409 });
    }

    let admin: ReturnType<typeof createAdminClient> | null = null;
    try {
      admin = createAdminClient();
      const { data: guardData, error: guardError } = await admin.rpc("consume_signup_attempt", {
        p_ip: getClientIp(request),
        p_email: email,
      });
      if (!guardError) {
        const guard = Array.isArray(guardData) ? guardData[0] : guardData;
        if (guard && guard.allowed === false) {
          return NextResponse.json({ error: "rate-limited" }, { status: 429, headers: { "Retry-After": "900" } });
        }
      } else {
        console.warn("Signup abuse guard unavailable", { message: guardError.message });
      }
    } catch (guardFailure) {
      console.warn("Signup abuse guard failed open", {
        message: guardFailure instanceof Error ? guardFailure.message : "unknown",
      });
      admin = null;
    }

    const supabase = await createClient();
    let usernameAvailable: boolean | null = null;
    if (admin) {
      const result = await admin.rpc("username_available", { p_username: username });
      if (!result.error) usernameAvailable = Boolean(result.data);
    }
    if (usernameAvailable === null) {
      const result = await supabase.rpc("username_available", { p_username: username });
      if (result.error) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
      usernameAvailable = Boolean(result.data);
    }
    if (!usernameAvailable) return NextResponse.json({ error: "username-taken" }, { status: 409 });

    const origin = request.nextUrl.origin;
    const callback = new URL("/auth/callback", origin);
    const safeNext = expertInvite
      ? "/sound-furnace"
      : body.next?.startsWith("/") && !body.next.startsWith("//")
        ? body.next
        : "/subscribe";
    callback.searchParams.set("next", safeNext);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: callback.toString(), data: { username, username_font: usernameFont } },
    });

    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
        return NextResponse.json({ error: "email-in-use" }, { status: 409 });
      }
      const status = lower.includes("rate") ? 429 : 400;
      return NextResponse.json({ error: status === 429 ? "rate-limited" : "signup-failed" }, { status });
    }

    if (data.user && data.user.identities?.length === 0) {
      return NextResponse.json({ error: "email-in-use" }, { status: 409 });
    }

    if (expertInvite && data.user) {
      const expertAdmin = createAdminClient();
      const { error: accessError } = await expertAdmin
        .from("expert_musician_dev_access")
        .update({ user_id: data.user.id, redeemed_at: new Date().toISOString() })
        .eq("id", expertInvite.id)
        .is("redeemed_at", null);
      if (accessError) {
        await expertAdmin.auth.admin.deleteUser(data.user.id).catch(() => undefined);
        return NextResponse.json({ error: "invite-activation-failed" }, { status: 503 });
      }
    }

    return NextResponse.json(
      { ok: true, pendingVerification: !data.session, expertMusicianDev: Boolean(expertInvite) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Signup route failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
  }
}
