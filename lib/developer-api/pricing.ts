export const DEVELOPER_API_PLANS = {
  starter: {
    name: "Developer Starter",
    monthlyUsd: 49,
    monthlyRequests: 1000,
    requestsPerMinute: 30,
    stripeProductId: "prod_VEvPoV8K5ljdAS",
    stripePriceId: "price_1UERYeL2Q1z9VIQ1mPT2lTqd",
    description: "For prototypes and small music apps integrating Crucible.",
  },
  pro: {
    name: "Developer Pro",
    monthlyUsd: 149,
    monthlyRequests: 5000,
    requestsPerMinute: 120,
    stripeProductId: "prod_VEvPzd6M76arjm",
    stripePriceId: "price_1UERYiL2Q1z9VIQ161feos4E",
    description: "For production music apps with steady Crucible API traffic.",
  },
  scale: {
    name: "Developer Scale",
    monthlyUsd: 499,
    monthlyRequests: 25000,
    requestsPerMinute: 600,
    stripeProductId: "prod_VEvPP9EnP0c5IN",
    stripePriceId: "price_1UERYmL2Q1z9VIQ13gFyCTOz",
    description: "For high-volume partners building Crucible into their product.",
  },
} as const;

export type DeveloperApiPlan = keyof typeof DEVELOPER_API_PLANS;

export const DEVELOPER_API_SERVICE_UNITS = {
  autoMaster: 1,
  starDna: 1,
  stemSeparation: 5,
  promotionOrder: 1,
  promotionStatus: 0,
} as const;

/**
 * Launch policy: predictable prepaid monthly quotas, no surprise overages.
 * Requests are rejected with 429 after the monthly allowance is exhausted.
 * We can add Stripe metered overages after real production cost data exists.
 */
export const DEVELOPER_API_OVERAGE_ENABLED = false;
