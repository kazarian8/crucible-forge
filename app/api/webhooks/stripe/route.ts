import { NextResponse } from "next/server";
import { adminRequest } from "../../../../lib/billing/admin";
import {
  getBillingConfig,
  stripeRequest,
  unixToIso,
  verifyStripeSignature,
} from "../../../../lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_start?: number | null;
  current_period_end?: number | null;
  trial_end?: number | null;
  metadata?: { user_id?: string };
};

function allowedStatus(value: string) {
  return [
    "inactive",
    "trialing",
    "active",
    "past_due",
    "unpaid",
    "canceled",
    "paused",
  ].includes(value)
    ? value
    : "inactive";
}

async function reserveEvent(event: StripeEvent) {
  const rows = await adminRequest<Array<{ event_id: string }>>(
    "stripe_webhook_events?on_conflict=event_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=ignore-duplicates,return=representation",
      },
      body: JSON.stringify({
        event_id: event.id,
        event_type: event.type,
      }),
    },
  );

  return rows.length > 0;
}

async function releaseEvent(eventId: string) {
  await adminRequest(
    `stripe_webhook_events?event_id=eq.${encodeURIComponent(eventId)}`,
    { method: "DELETE" },
  );
}

async function findUserId(subscription: StripeSubscription) {
  if (subscription.metadata?.user_id) {
    return subscription.metadata.user_id;
  }

  const rows = await adminRequest<Array<{ user_id: string }>>(
    `pro_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscription.id)}&select=user_id&limit=1`,
  );

  return rows[0]?.user_id ?? null;
}

async function syncSubscription(subscription: StripeSubscription) {
  const userId = await findUserId(subscription);
  if (!userId) {
    throw new Error(`Subscription ${subscription.id} is missing user metadata.`);
  }

  await adminRequest("pro_subscriptions?on_conflict=user_id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      stripe_customer_id:
        typeof subscription.customer === "string"
          ? subscription.customer
          : null,
      stripe_subscription_id: subscription.id,
      status: allowedStatus(subscription.status),
      current_period_start: unixToIso(subscription.current_period_start),
      current_period_end: unixToIso(subscription.current_period_end),
      trial_end: unixToIso(subscription.trial_end),
      updated_at: new Date().toISOString(),
    }),
  });

  return userId;
}

function invoiceSubscriptionId(invoice: Record<string, unknown>) {
  const direct = invoice.subscription;
  if (typeof direct === "string") return direct;

  const parent = invoice.parent;
  if (!parent || typeof parent !== "object") return null;

  const details = (parent as Record<string, unknown>).subscription_details;
  if (!details || typeof details !== "object") return null;

  const subscription = (details as Record<string, unknown>).subscription;
  if (typeof subscription === "string") return subscription;
  if (subscription && typeof subscription === "object") {
    const id = (subscription as Record<string, unknown>).id;
    return typeof id === "string" ? id : null;
  }

  return null;
}

async function retrieveSubscription(
  subscriptionId: string,
  secretKey: string,
) {
  return stripeRequest<StripeSubscription>(
    `/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
    secretKey,
  );
}

async function grantCredits(
  userId: string,
  eventId: string,
  periodStart?: number | null,
) {
  await adminRequest("rpc/grant_subscription_credits", {
    method: "POST",
    body: JSON.stringify({
      p_user_id: userId,
      p_stripe_event_id: eventId,
      p_period_start: unixToIso(periodStart) ?? new Date().toISOString(),
      p_amount: 5000,
    }),
  });
}

export async function POST(request: Request) {
  const { secretKey, webhookSecret } = getBillingConfig();

  if (!secretKey || !webhookSecret) {
    console.error("Stripe webhook configuration is incomplete.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (
    !signature ||
    !verifyStripeSignature(payload, signature, webhookSecret)
  ) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const reserved = await reserveEvent(event);
  if (!reserved) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as unknown as StripeSubscription);
    } else if (event.type === "checkout.session.completed") {
      const subscriptionId = event.data.object.subscription;
      if (typeof subscriptionId === "string") {
        const subscription = await retrieveSubscription(
          subscriptionId,
          secretKey,
        );
        const userId = await syncSubscription(subscription);
        await grantCredits(
          userId,
          event.id,
          subscription.current_period_start,
        );
      }
    } else if (
      event.type === "invoice.paid" ||
      event.type === "invoice.payment_failed"
    ) {
      const subscriptionId = invoiceSubscriptionId(event.data.object);

      if (subscriptionId) {
        const subscription = await retrieveSubscription(
          subscriptionId,
          secretKey,
        );
        const userId = await syncSubscription(subscription);

        if (
          event.type === "invoice.paid" &&
          Number(event.data.object.amount_paid ?? 0) > 0
        ) {
          await grantCredits(
            userId,
            event.id,
            subscription.current_period_start,
          );
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    await releaseEvent(event.id);
    console.error("Stripe webhook processing failed", {
      eventId: event.id,
      eventType: event.type,
      error,
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
