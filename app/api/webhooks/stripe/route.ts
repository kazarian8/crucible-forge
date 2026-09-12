import { NextResponse } from "next/server";
import { adminRequest } from "../../../../lib/billing/admin";
import {
  getBillingConfig,
  getStripeClient,
  unixToIso,
} from "../../../../lib/billing/stripe";
import type Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeSubscription = {
  id: string;
  customer: string;
  status: string;
  current_period_start?: number | null;
  current_period_end?: number | null;
  trial_end?: number | null;
  metadata?: { user_id?: string };
};

type VaultIdentityRow = {
  id: string;
  user_id: string;
  legal_name: string;
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

async function reserveEvent(event: Stripe.Event) {
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
  const rows = await adminRequest<Array<{ user_id: string }>>(
    `pro_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscription.id)}&select=user_id&limit=1`,
  );

  if (rows[0]?.user_id) {
    return rows[0].user_id;
  }

  return subscription.metadata?.user_id ?? null;
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
  const stripe = getStripeClient(secretKey);
  return stripe.subscriptions.retrieve(subscriptionId) as unknown as Promise<StripeSubscription>;
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

function normalizeName(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function legalNameMatches(entered: string, firstName: string, lastName: string) {
  const enteredParts = normalizeName(entered);
  const firstParts = normalizeName(firstName);
  const lastParts = normalizeName(lastName);
  if (!enteredParts.length || !firstParts.length || !lastParts.length) return false;
  const first = firstParts.join(" ");
  const last = lastParts.join(" ");
  return enteredParts[0] === first && enteredParts[enteredParts.length - 1] === last;
}

async function auditIdentity(vaultId: string, userId: string, eventType: string, data: Record<string, unknown> = {}) {
  await adminRequest("creator_vault_audit_log", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      vault_id: vaultId,
      user_id: userId,
      event_type: eventType,
      event_data: data,
    }),
  }).catch(() => null);
}

async function handleIdentityEvent(event: Stripe.Event, secretKey: string) {
  const eventObject = event.data.object as unknown as { id?: string; metadata?: Record<string, string> };
  const sessionId = typeof eventObject.id === "string" ? eventObject.id : null;
  const vaultId = eventObject.metadata?.vault_id ?? null;
  const userId = eventObject.metadata?.user_id ?? null;
  if (!sessionId || !vaultId || !userId) return;

  const vaultRows = await adminRequest<VaultIdentityRow[]>(
    `creator_vaults?id=eq.${encodeURIComponent(vaultId)}&user_id=eq.${encodeURIComponent(userId)}&select=id,user_id,legal_name&limit=1`,
  );
  const vault = vaultRows[0];
  if (!vault) return;

  if (event.type === "identity.verification_session.verified") {
    const stripe = getStripeClient(secretKey);
    const verified = await stripe.identity.verificationSessions.retrieve(sessionId);
    const outputs = verified.verified_outputs;
    const firstName = outputs?.first_name ?? "";
    const lastName = outputs?.last_name ?? "";
    const nameMatch = legalNameMatches(vault.legal_name, firstName, lastName);
    const now = new Date().toISOString();

    await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vaultId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        identity_session_id: sessionId,
        identity_status: nameMatch ? "verified" : "requires_input",
        identity_verified_at: nameMatch ? now : null,
        legal_name_verified: nameMatch,
        unlock_failed_count: 0,
        unlock_locked_until: null,
        updated_at: now,
      }),
    });

    if (nameMatch) {
      await adminRequest(
        `partner_vault_sessions?user_id=eq.${encodeURIComponent(userId)}&vault_id=eq.${encodeURIComponent(vaultId)}&status=in.(created,started,identity_pending)`,
        {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({ status: "completed", completed_at: now, updated_at: now }),
        },
      ).catch(() => null);
      await auditIdentity(vaultId, userId, "identity_verified", { provider: "stripe_identity", legalNameMatched: true });
    } else {
      await auditIdentity(vaultId, userId, "identity_legal_name_mismatch", { provider: "stripe_identity" });
    }
    return;
  }

  if (event.type === "identity.verification_session.requires_input") {
    await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vaultId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ identity_status: "requires_input", legal_name_verified: false, updated_at: new Date().toISOString() }),
    });
    await auditIdentity(vaultId, userId, "identity_requires_input", { provider: "stripe_identity" });
    return;
  }

  if (event.type === "identity.verification_session.canceled") {
    await adminRequest(`creator_vaults?id=eq.${encodeURIComponent(vaultId)}&user_id=eq.${encodeURIComponent(userId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ identity_status: "canceled", legal_name_verified: false, updated_at: new Date().toISOString() }),
    });
    await auditIdentity(vaultId, userId, "identity_canceled", { provider: "stripe_identity" });
  }
}

export async function POST(request: Request) {
  const { secretKey, webhookSecret } = getBillingConfig();

  if (!secretKey || !webhookSecret) {
    console.error("Stripe webhook configuration is incomplete.");
    return NextResponse.json({ error: "Webhook unavailable." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripeClient(secretKey).webhooks.constructEvent(
      payload,
      signature,
      webhookSecret,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const reserved = await reserveEvent(event);
  if (!reserved) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type.startsWith("identity.verification_session.")) {
      await handleIdentityEvent(event, secretKey);
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as unknown as StripeSubscription);
    } else if (event.type === "checkout.session.completed") {
      const object = event.data.object as unknown as Record<string, unknown>;
      const subscriptionId = object.subscription;
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
      const object = event.data.object as unknown as Record<string, unknown>;
      const subscriptionId = invoiceSubscriptionId(object);

      if (subscriptionId) {
        const subscription = await retrieveSubscription(
          subscriptionId,
          secretKey,
        );
        const userId = await syncSubscription(subscription);

        if (
          event.type === "invoice.paid" &&
          Number(object.amount_paid ?? 0) > 0
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
