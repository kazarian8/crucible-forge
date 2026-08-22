import { NextResponse } from "next/server";
import { adminRequest } from "../billing/admin";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

type Subscription = {
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
};

function isFuture(value: string | null | undefined) {
  return Boolean(value) && new Date(value as string).getTime() > Date.now();
}

export function hasPaidAccess(subscription: Subscription | null) {
  return Boolean(
    subscription &&
      ((subscription.status === "trialing" && isFuture(subscription.trial_end)) ||
        (subscription.status === "active" &&
          isFuture(subscription.current_period_end))),
  );
}

async function hasExpertMusicianDevAccess(userId: string) {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("expert_musician_dev_access")
      .select("enabled")
      .eq("user_id", userId)
      .eq("enabled", true)
      .maybeSingle<{ enabled: boolean }>();
    return !error && Boolean(data?.enabled);
  } catch {
    return false;
  }
}

export async function authorizePaidProvider(
  route: string,
  requestsPerMinute: number,
) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Sign in is required." },
        { status: 401, headers: { "Cache-Control": "private, no-store" } },
      ),
    };
  }

  if (!user.email_confirmed_at) {
    return {
      response: NextResponse.json(
        { error: "Verify your email before using this forge." },
        { status: 403, headers: { "Cache-Control": "private, no-store" } },
      ),
    };
  }

  const expertMusicianDev = await hasExpertMusicianDevAccess(user.id);

  if (!expertMusicianDev) {
    const { data: subscription, error: subscriptionError } = await supabase
      .from("pro_subscriptions")
      .select("status,current_period_end,trial_end")
      .eq("user_id", user.id)
      .maybeSingle<Subscription>();

    if (subscriptionError || !hasPaidAccess(subscription)) {
      return {
        response: NextResponse.json(
          { error: "An active trial or subscription is required." },
          { status: 402, headers: { "Cache-Control": "private, no-store" } },
        ),
      };
    }
  }

  const rateLimit = await adminRequest<Array<{ allowed: boolean }>>(
    "rpc/consume_api_rate_limit",
    {
      method: "POST",
      body: JSON.stringify({
        p_user_id: user.id,
        p_route: route,
        p_limit: requestsPerMinute,
        p_window_seconds: 60,
      }),
    },
  );

  if (!rateLimit[0]?.allowed) {
    return {
      response: NextResponse.json(
        { error: "This forge is receiving requests too quickly. Try again shortly." },
        {
          status: 429,
          headers: {
            "Cache-Control": "private, no-store",
            "Retry-After": "60",
          },
        },
      ),
    };
  }

  return { user, response: null };
}
