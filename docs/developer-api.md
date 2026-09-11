# Crucible Developer API

Crucible is being prepared to expose selected production services to third-party apps through a paid developer API.

## Billing model

External API access is payment-gated and separate from the consumer Crucible Pro plan. Stripe remains the source of truth for developer subscription/payment status. API access must fail closed when the developer account is inactive, past due, paused, canceled, or outside its plan limits.

Do not reuse end-user Crucible credit balances as API authentication. Third-party apps authenticate with dedicated developer API keys.

## Key security

- Generate high-entropy API keys server-side.
- Return the full API key only once at creation.
- Store only a cryptographic hash plus a short non-secret prefix for identification.
- Never store or log plaintext keys.
- Keys can be revoked independently.
- Every request must be rate-limited and recorded in usage metering.
- Provider secrets, Supabase service-role credentials, Stripe secrets, and internal Crucible keys are never exposed to API customers.

## Data model

The database foundation is in `supabase/migrations/202609110002_developer_api_billing.sql`:

- `developer_api_accounts`: billing/access state and limits.
- `developer_api_keys`: hashed credential records.
- `developer_api_usage`: request-level metering and audit history.

RLS is enabled. Authenticated users may only read metadata belonging to their own developer account. All mutations are server/service-role only.

## Public API shape

Use a versioned namespace such as `/api/v1/...` for externally supported endpoints. Internal browser-only routes remain separate and are not automatically public APIs.

Each externally supported endpoint must enforce, in this order:

1. Parse API key from `Authorization: Bearer <key>`.
2. Hash it and resolve an unrevoked key.
3. Confirm the linked developer account is active and paid.
4. Enforce plan limit / rate limit.
5. Validate request body and file type/size.
6. Execute the approved Crucible service.
7. Record usage and response status.
8. Return a stable JSON response with a request ID.

## First services to expose

Start with services that Crucible already controls reliably, rather than exposing every internal route at once. Candidate v1 endpoints:

- Mastering / Auto Master
- DNA / Star analysis
- Stem separation
- Promotion campaign order/status where appropriate

Distribution and external-platform playlist actions remain subject to each platform's permissions and must not imply third-party editorial control.

## Payment flow still to wire

Before public developer API launch, add a dedicated Stripe developer-plan price and checkout flow, sync developer subscription state from Stripe webhooks into `developer_api_accounts`, add API-key create/revoke UI, and publish rate/price documentation.

Do not enable paid external API traffic until those controls are implemented and tested.
