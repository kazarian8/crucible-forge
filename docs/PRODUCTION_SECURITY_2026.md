# Crucible 2026 Production Security Checklist

This checklist is the release gate for Crucible production. Items marked **BLOCKER** must be resolved before unrestricted public launch.

## 1. Identity and authentication

- [x] Email verification required before protected access.
- [x] Manual sign-in after verification.
- [x] Server-side login and signup rate limiting.
- [x] Generic authentication errors to reduce account enumeration.
- [x] Minimum password length enforced by the app.
- [ ] **BLOCKER** Enable Supabase leaked-password protection when available on the active plan.
- [ ] Review Supabase Auth rate limits before launch and after traffic changes.
- [ ] Require MFA for owner/admin accounts across GitHub, Vercel, Supabase, Stripe, and domain registrar.

## 2. Authorization and Pro entitlement

- [x] Paid Furnace routes are checked server-side.
- [x] Only current `trialing` or `active` subscriptions grant Pro access.
- [x] Users can read only their own subscription row.
- [x] Clients cannot directly grant subscription credits.
- [x] Credit-grant RPC is service-role only and idempotent by reference.
- [ ] **BLOCKER** Complete end-to-end recovery test: completed Stripe checkout -> Supabase subscription sync -> 5,000 credits -> protected route access.
- [ ] Test canceled, expired-trial, past-due, unpaid, and failed-payment access removal.

## 3. Billing and secrets

- [x] Stripe checkout is server-created.
- [x] Checkout confirmation verifies the signed-in user and checkout ownership.
- [ ] **BLOCKER** Replace the invalid Vercel production Supabase billing/admin credential with a valid secret from the same Supabase project.
- [ ] Prefer a modern `sb_secret_*` backend key and rotate legacy service-role JWT usage out during 2026.
- [ ] Verify production, preview, and development use separate scoped secrets where practical.
- [ ] Rotate any credential that has ever been pasted into source, logs, tickets, screenshots, or chat.
- [ ] Verify Stripe webhook signatures and test replay/idempotency behavior.

## 4. Database and Supabase

- [x] RLS protects subscription/profile data from cross-user access.
- [x] Login/signup attempt tables have RLS enabled.
- [x] Sensitive security-definer rate-limit functions were moved behind server-only calls.
- [ ] Resolve all Supabase Security Advisor ERROR findings before public launch.
- [ ] Review every remaining Security Advisor WARN finding and document intentional exceptions.
- [ ] Confirm backups and point-in-time recovery appropriate to the production plan.
- [ ] Test restore procedure before accepting important user content.

## 5. Application and HTTP security

- [x] `X-Powered-By` disabled.
- [x] HSTS enabled for HTTPS-only access.
- [x] CSP present.
- [x] Clickjacking protection (`frame-ancestors` and `X-Frame-Options`).
- [x] MIME sniffing protection.
- [x] Referrer policy.
- [x] Permissions Policy restricts sensitive browser capabilities.
- [x] Cross-Origin-Opener-Policy and origin isolation headers enabled.
- [ ] Replace CSP `unsafe-inline` directives with nonce/hash-based policy when compatible with the production Next.js build.
- [ ] Validate every upload by MIME type, extension, size, and decoded content before expensive processing.
- [ ] Enforce request-body size limits on upload/API routes.

## 6. CI/CD and dependency security

- [x] Automated Security Scan workflow exists.
- [x] Dependency vulnerability auditing runs automatically.
- [x] Typecheck, lint, and production build run in CI.
- [x] CodeQL static analysis configured.
- [ ] Protect `main` with required CI checks before merge.
- [ ] Require review for changes to billing, auth, RLS, security workflows, and infrastructure files when additional maintainers are added.
- [ ] Pin or carefully review third-party GitHub Actions and keep them current.

## 7. Abuse, bots, and resource protection

- [x] Signup honeypot and human-time guard exist.
- [x] Login/signup rate limiting exists.
- [ ] Add rate limits to expensive AI/audio/image endpoints based on account + IP + credit availability.
- [ ] Reject requests before vendor/API calls when credits or entitlement are insufficient.
- [ ] Add upload concurrency limits and maximum processing duration.
- [ ] Monitor unusual account-creation, credit, upload, and API-use spikes.

## 8. Monitoring and incident response

- [ ] **BLOCKER** Production error monitoring and alerting configured for auth, billing, and Furnace APIs.
- [ ] Uptime monitoring for landing page, login, billing status, and at least one protected health path.
- [ ] Alerts for repeated 5xx, Stripe webhook failures, Supabase auth spikes, and credit anomalies.
- [ ] Document credential rotation procedure.
- [ ] Document rollback procedure and test a rollback.
- [ ] Define data/security incident contact and response steps.

## 9. Privacy and user data

- [ ] Publish Privacy Policy and Terms appropriate to stored audio/images/account/billing metadata.
- [ ] Define retention/deletion rules for uploaded and generated media.
- [ ] Provide account/data deletion path.
- [ ] Minimize logs containing email addresses, tokens, checkout IDs, IP addresses, or user content.
- [ ] Never log passwords, auth tokens, API secrets, or full payment data.

## Public launch gate

Do not remove the restricted-public/testing label until all **BLOCKER** items are complete and a clean new-user test passes:

1. Create account.
2. Verify email.
3. Sign in.
4. Start the 30-day trial through Stripe.
5. Confirm subscription server-side.
6. Receive exactly 5,000 credits once.
7. Enter a protected Furnace.
8. Spend credits and verify deduction.
9. Sign out and sign back in.
10. Confirm direct URL/API attempts cannot bypass subscription or credit enforcement.
