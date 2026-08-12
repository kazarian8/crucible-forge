import Stripe from "stripe";

let stripeClient: Stripe | null = null;
let stripeClientKey: string | null = null;

export function getBillingConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  return { secretKey, priceId, webhookSecret };
}

export function getStripeClient(secretKey: string) {
  if (!stripeClient || stripeClientKey !== secretKey) {
    stripeClient = new Stripe(secretKey, {
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
    stripeClientKey = secretKey;
  }

  return stripeClient;
}

export function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}
