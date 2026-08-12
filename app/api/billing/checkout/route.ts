import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  getBillingConfig,
  getStripeClient,
} from "../../../../lib/billing/stripe";
import { hasPaidAccess } from "../../../../lib/auth/provider-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  }

  if (!user.email || !user.email_confirmed_at) {
    return NextResponse.json(
      { error: "Verify your email before starting the trial." },
      { status: 403 },
    );
  }

  const { data: subscription } = await supabase
    .from("pro_subscriptions")
    .select("status,current_period_end,trial_end")
    .eq("user_id", user.id)
    .maybeSingle();

  if (hasPaidAccess(subscription)) {
    return NextResponse.json({ url: "/sound-furnace" });
  }

  const { secretKey, priceId } = getBillingConfig();

  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Billing setup is not complete. Access remains locked." },
      { status: 503 },
    );
  }

  const origin = new URL(request.url).origin;

  try {
    const stripe = getStripeClient(secretKey);
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [{ price: priceId, quantity: 1 }],
        payment_method_collection: "always",
        subscription_data: {
          trial_period_days: 30,
          metadata: { user_id: user.id },
        },
        metadata: { user_id: user.id },
        success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/subscribe?checkout=canceled`,
      },
      {
        idempotencyKey: `trial-checkout:${user.id}:${Math.floor(Date.now() / 60_000)}`,
      },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout creation failed", error);
    return NextResponse.json(
      { error: "Checkout could not be started safely." },
      { status: 502 },
    );
  }
}
