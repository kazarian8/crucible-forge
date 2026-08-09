import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API_ORIGIN = "https://api.stripe.com";

export function getBillingConfig() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  return { secretKey, priceId, webhookSecret };
}

export async function stripeRequest<T>(
  path: string,
  secretKey: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${STRIPE_API_ORIGIN}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    const message =
      payload?.error?.message ?? `Stripe request failed with ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export function verifyStripeSignature(
  payload: string,
  signatureHeader: string,
  webhookSecret: string,
) {
  const parts = signatureHeader.split(",");
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (
    !Number.isFinite(timestampSeconds) ||
    Math.abs(Date.now() / 1000 - timestampSeconds) > 300
  ) {
    return false;
  }

  const expected = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${payload}`, "utf8")
    .digest();

  return signatures.some((signature) => {
    try {
      const candidate = Buffer.from(signature, "hex");
      return (
        candidate.length === expected.length &&
        timingSafeEqual(candidate, expected)
      );
    } catch {
      return false;
    }
  });
}

export function unixToIso(value: number | null | undefined) {
  return value ? new Date(value * 1000).toISOString() : null;
}
