import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";

function validUsername(value: string) {
  return /^[A-Za-z0-9_]{3,24}$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      username?: string;
      inviteToken?: string;
      website?: string;
      startedAt?: number;
    };

    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const username = body.username?.trim() ?? "";
    const inviteToken = body.inviteToken?.trim() ?? "";
    const startedAt = Number(body.startedAt || 0);

    if (body.website) return NextResponse.json({ error: "blocked" }, { status: 400 });
    if (!startedAt || Date.now() - startedAt < 1500 || Date.now() - startedAt > 30 * 60 * 1000) {
      return NextResponse.json({ error: "blocked" }, { status: 400 });
    }
    if (!email || !inviteToken || !validUsername(username) || password.length < 12 || password.length > 128) {
      return NextResponse.json({ error: "invalid-input" }, { status: 400 });
    }

    const admin = createAdminClient();
    const tokenHash = createHash("sha256").update(inviteToken).digest("hex");
    const { data: invite, error: inviteError } = await admin
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

    if (inviteError || !invite || invite.redeemed_at || new Date(invite.invite_expires_at).getTime() <= Date.now()) {
      return NextResponse.json({ error: "invalid-invite" }, { status: 403 });
    }

    const availability = await admin.rpc("username_available", { p_username: username });
    if (availability.error) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
    if (!availability.data) return NextResponse.json({ error: "username-taken" }, { status: 409 });

    const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (existing.error) return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
    if (existing.data.users.some((user) => user.email?.toLowerCase() === email)) {
      return NextResponse.json({ error: "email-in-use" }, { status: 409 });
    }

    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, username_font: "default", account_class: "engineer" },
    });

    if (created.error || !created.data.user) {
      const message = created.error?.message.toLowerCase() ?? "";
      if (message.includes("already") || message.includes("registered") || message.includes("exists")) {
        return NextResponse.json({ error: "email-in-use" }, { status: 409 });
      }
      return NextResponse.json({ error: "account-create-failed" }, { status: 503 });
    }

    const userId = created.data.user.id;
    const activatedAt = new Date().toISOString();
    const { error: bindError } = await admin
      .from("expert_musician_dev_access")
      .update({ user_id: userId, redeemed_at: activatedAt })
      .eq("id", invite.id)
      .is("redeemed_at", null);

    if (bindError) {
      await admin.auth.admin.deleteUser(userId).catch(() => undefined);
      return NextResponse.json({ error: "invite-activation-failed" }, { status: 503 });
    }

    await admin
      .from("profiles")
      .update({ username, account_class: "engineer", display_name: username })
      .eq("id", userId);

    const supabase = await createClient();
    const signedIn = await supabase.auth.signInWithPassword({ email, password });
    if (signedIn.error) {
      return NextResponse.json({ ok: true, signedIn: false, next: "/login?next=/sound-furnace" }, { headers: { "Cache-Control": "private, no-store" } });
    }

    return NextResponse.json({ ok: true, signedIn: true, next: "/sound-furnace" }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Expert developer activation failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "service-unavailable" }, { status: 503 });
  }
}
