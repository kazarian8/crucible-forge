import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  getBillingConfig,
  getStripeClient,
} from "../../../../lib/billing/stripe";

export const runtime = "nodejs";

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

  try {
    const stripe = getStripeClient(secretKey);
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/account`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe portal creation failed", error);
    return NextResponse.json(
      { error: "Subscription management is temporarily unavailable." },
      { status: 502 },
    );
  }
}
