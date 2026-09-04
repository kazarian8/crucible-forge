import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import { hasPaidAccess } from "../../../../lib/auth/provider-access";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, entitled: false });
  }

  const [{ data: subscription }, { data: wallet }, { data: developerAccess }] = await Promise.all([
    supabase
      .from("pro_subscriptions")
      .select("status,current_period_end,trial_end")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("credit_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("expert_musician_dev_access")
      .select("enabled,invite_expires_at")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .gt("invite_expires_at", new Date().toISOString())
      .maybeSingle(),
  ]);

  const developerValid =
    Boolean(developerAccess?.enabled) &&
    Boolean(developerAccess?.invite_expires_at) &&
    new Date(developerAccess!.invite_expires_at as string).getTime() > Date.now();
  const entitled = hasPaidAccess(subscription) || developerValid;

  return NextResponse.json({
    authenticated: true,
    creditBalance: wallet?.balance ?? 0,
    emailVerified: Boolean(user.email_confirmed_at),
    entitled,
    status: developerValid ? "developer" : (subscription?.status ?? "inactive"),
    currentPeriodEnd: developerValid
      ? developerAccess?.invite_expires_at ?? null
      : subscription?.current_period_end ?? null,
    trialEnd: subscription?.trial_end ?? null,
  });
}
