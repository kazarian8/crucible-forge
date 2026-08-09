import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  getBillingConfig,
  stripeRequest,
} from "../../../../lib/billing/stripe";

export const runtime = "nodejs";

type PortalSession = { url?: string | null };

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("pro_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { secretKey } = getBillingConfig();

  if (!secretKey || !subscription?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No managed subscription was found." },
      { status: 404 },
    );
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    customer: subscription.stripe_customer_id,
    return_url: `${origin}/account`,
  });

  try {
    const session = await stripeRequest<PortalSession>(
      "/v1/billing_portal/sessions",
      secretKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      },
    );

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal creation failed", error);
    return NextResponse.json(
      { error: "Subscription management is temporarily unavailable." },
      { status: 502 },
    );
  }
}
