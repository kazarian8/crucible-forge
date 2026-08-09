import { NextResponse } from "next/server";
import { createClient } from "../../../../lib/supabase/server";
import {
  getBillingConfig,
  stripeRequest,
} from "../../../../lib/billing/stripe";

export const runtime = "nodejs";

type CheckoutSession = {
  url?: string | null;
};

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
    .select("status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    subscription?.status === "trialing" ||
    subscription?.status === "active"
  ) {
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
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("customer_email", user.email);
  form.set("client_reference_id", user.id);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("payment_method_collection", "always");
  form.set("subscription_data[trial_period_days]", "30");
  form.set("subscription_data[metadata][user_id]", user.id);
  form.set("metadata[user_id]", user.id);
  form.set(
    "success_url",
    `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
  );
  form.set("cancel_url", `${origin}/subscribe?checkout=canceled`);

  try {
    const session = await stripeRequest<CheckoutSession>(
      "/v1/checkout/sessions",
      secretKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
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
