import type Stripe from "stripe";
import { adminRequest } from "./admin";
import { getBillingConfig, getStripeClient, unixToIso } from "./stripe";

type SubscriptionShape = {
  id: string;
  customer: string | { id?: string } | null;
  status: string;
  current_period_start?: number | null;
  current_period_end?: number | null;
  trial_end?: number | null;
  metadata?: { user_id?: string };
  items?: {
    data?: Array<{
      current_period_start?: number | null;
      current_period_end?: number | null;
    }>;
  };
};

function subscriptionPeriod(
  subscription: SubscriptionShape,
  key: "current_period_start" | "current_period_end",
) {
  const direct = subscription[key];
  if (typeof direct === "number") return direct;

  const values = (subscription.items?.data ?? [])
    .map((item) => item[key])
    .filter((value): value is number => typeof value === "number");

  if (!values.length) return null;
  return key === "current_period_start"
    ? Math.min(...values)
    : Math.max(...values);
}

function normalizedStatus(status: string) {
  return [
    "inactive",
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
  ].includes(status)
    ? status
    : "inactive";
}

function customerId(customer: SubscriptionShape["customer"]) {
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

export async function syncStripeSubscription(
  subscription: SubscriptionShape,
  userId: string,
) {
  const periodStart = subscriptionPeriod(subscription, "current_period_start");
  const periodEnd = subscriptionPeriod(subscription, "current_period_end");

  await adminRequest("pro_subscriptions?on_conflict=user_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id: customerId(subscription.customer),
      stripe_subscription_id: subscription.id,
      status: normalizedStatus(subscription.status),
      current_period_start: unixToIso(periodStart),
      current_period_end: unixToIso(periodEnd),
      trial_end: unixToIso(subscription.trial_end),
      updated_at: new Date().toISOString(),
    }),
  });

  return { periodStart, periodEnd };
}

export async function grantPeriodCredits({
  userId,
  reference,
  periodStart,
}: {
  userId: string;
  reference: string;
  periodStart?: number | null;
}) {
  await adminRequest("rpc/grant_subscription_credits", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_stripe_event_id: reference,
      p_period_start: unixToIso(periodStart) ?? new Date().toISOString(),
      p_amount: 5000,
    }),
  });
}

export async function confirmCheckoutForUser({
  sessionId,
  userId,
  email,
}: {
  sessionId: string;
  userId: string;
  email: string;
}) {
  const { secretKey } = getBillingConfig();
  if (!secretKey) throw new Error("Billing is not configured.");

  const stripe = getStripeClient(secretKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  const sessionUserId = session.client_reference_id ?? session.metadata?.user_id;
  if (sessionUserId !== userId) {
    throw new Error("This checkout does not belong to the signed-in account.");
  }

  const checkoutEmail = session.customer_details?.email ?? session.customer_email;
  if (checkoutEmail && checkoutEmail.toLowerCase() !== email.toLowerCase()) {
    throw new Error("The checkout email does not match the signed-in account.");
  }

  if (session.status !== "complete") {
    throw new Error("Stripe has not completed this checkout yet.");
  }

  let subscription: SubscriptionShape;
  if (typeof session.subscription === "string") {
    subscription = (await stripe.subscriptions.retrieve(
      session.subscription,
    )) as unknown as SubscriptionShape;
  } else if (session.subscription) {
    subscription = session.subscription as unknown as SubscriptionShape;
  } else {
    throw new Error("Stripe did not attach a subscription to this checkout.");
  }

  const { periodStart } = await syncStripeSubscription(subscription, userId);
  await grantPeriodCredits({
    userId,
    reference: `checkout-confirm:${session.id}`,
    periodStart,
  });

  return { status: normalizedStatus(subscription.status) };
}

export type { SubscriptionShape };

