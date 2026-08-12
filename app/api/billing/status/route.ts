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

  const { data: subscription } = await supabase
    .from("pro_subscriptions")
    .select("status,current_period_end,trial_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const entitled = hasPaidAccess(subscription);

  return NextResponse.json({
    authenticated: true,
    emailVerified: Boolean(user.email_confirmed_at),
    entitled,
    status: subscription?.status ?? "inactive",
    currentPeriodEnd: subscription?.current_period_end ?? null,
    trialEnd: subscription?.trial_end ?? null,
  });
}
