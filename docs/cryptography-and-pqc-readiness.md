# Cryptography and post-quantum readiness

Status: required release-gate control  
Owner: Crucible security/release owner  
Review cadence: quarterly and after any authentication, payment, storage, CDN, or signing-provider change

## Policy

Crucible does not design, implement, or deploy custom cryptographic algorithms. It does not use experimental quantum processing for production security.

Cryptography must come from standards-based platform or provider capabilities that are supported, patched, observable, and reversible. A post-quantum migration may be enabled only through an officially supported Vercel, Supabase, Stripe, operating-system, browser, Node.js, or other approved provider capability.

## Current boundary inventory

| Boundary | Current owner | Crucible responsibility |
| --- | --- | --- |
| Browser-to-edge TLS | Vercel | Require HTTPS, HSTS, secure redirects, and supported TLS configuration. Do not terminate TLS in application code. |
| Authentication and sessions | Supabase Auth | Use provider-issued sessions and secure cookies. Never implement password hashing, token signing, or key derivation in application code. |
| Database and object storage encryption | Supabase | Keep storage private, enforce RLS/storage policies, restrict service-role use to trusted server code, and follow provider key-rotation guidance. |
| Card data and payment signatures | Stripe | Use hosted payment collection and Stripe's supported webhook verification. Never store raw card data or invent signature verification. |
| AI-provider authentication | Vercel encrypted environment variables plus provider-scoped keys | Use server-only scoped keys, hard usage ceilings, rotation, and revocation. Never expose keys to browser bundles. |
| Application identifiers | Browser/Node standard CSPRNG | Standard `crypto.randomUUID()` is permitted for non-secret identifiers. It must not be treated as encryption or an authorization control. |

## Current post-quantum posture

Vercel documents hybrid post-quantum TLS support using `X25519MLKEM768` for compatible clients. This protection is negotiated by the platform and browser; Crucible must not recreate or override it.

NIST's current standards to track are:

- FIPS 203: ML-KEM
- FIPS 204: ML-DSA
- FIPS 205: SLH-DSA
- SP 800-227: key-encapsulation mechanism guidance
- CSWP 39 update 1: crypto-agility strategies and practices

Tracking a standard does not authorize direct application implementation. Adoption waits for supported provider/library capabilities and their production guidance.

## Crypto-agility requirements

1. No cryptographic algorithm names, parameters, keys, or provider secrets may be embedded in client code.
2. Provider integrations must be isolated behind server-side modules/routes so a provider or supported algorithm can be changed without changing user data formats or UI code.
3. Secrets must be server-only, scoped to the minimum capability, separately configurable by environment, rotatable without a code change, and revocable.
4. Long-lived sensitive data must have a documented retention period. Delete uploaded audio, generated stems, logs, and temporary provider artifacts when no longer required.
5. No raw payment credentials, authentication secrets, service-role keys, webhook secrets, or AI-provider keys may be stored in the database or logs.
6. Webhook verification must use the provider's maintained SDK and raw request body as required by that provider.
7. Dependencies and lockfiles must stay pinned and reviewed for cryptographic/security advisories.
8. Every provider change requires preview testing, rollback instructions, and confirmation that older clients fail safely.
9. PQ readiness applies to the browser/PWA and backend service boundaries. It does not imply native App Store or Google Play readiness.

## Migration triggers

Open a PQ migration change when any of these occurs:

- Vercel, Supabase, Stripe, or another approved provider announces a generally available supported migration affecting Crucible.
- NIST publishes a final transition requirement relevant to an algorithm used by a Crucible provider.
- A current provider algorithm or protocol is deprecated or receives a material security advisory.
- A compliance or customer requirement establishes a concrete deadline.

Do not migrate merely because an experimental library or quantum service becomes available.

## Migration runbook

1. Inventory affected traffic, stored data, signatures, tokens, certificates, SDKs, and clients.
2. Read the provider's official migration and compatibility guidance.
3. Confirm the target is a final NIST standard or an officially supported hybrid/provider capability.
4. Implement behind a server-side configuration boundary or provider setting.
5. Test in preview with current iOS Safari, Android Chrome, desktop browsers, webhooks, auth callbacks, uploads/downloads, and rollback.
6. Verify observability identifies handshake, auth, signature, or provider failures without logging secrets.
7. Roll out gradually where the provider supports it.
8. Confirm successful negotiation/verification and compatibility.
9. Retain a tested rollback until the new capability is stable.
10. Record evidence, provider version, effective date, and owner in the release checklist.

## Quarterly evidence checklist

- [ ] Review NIST PQC publications and transition guidance.
- [ ] Review Vercel TLS/encryption documentation and changelog.
- [ ] Review Supabase Auth, database, storage, and key-management advisories.
- [ ] Review Stripe webhook/signing and hosted-payment advisories.
- [ ] Review Node.js, Next.js, browser, and dependency security advisories.
- [ ] Search the repository for custom crypto, hard-coded algorithms, secrets, and unsafe token handling.
- [ ] Verify secrets are scoped, server-only, rotatable, and not present in logs or client bundles.
- [ ] Verify data-retention deletion jobs and backup/restore behavior.
- [ ] Exercise rollback in preview.
- [ ] Attach evidence to the release gate.

## Prohibited changes

- Custom encryption, hashing, signatures, key exchange, password hashing, or random-number generation
- Direct use of experimental PQ libraries in production application code
- Experimental quantum-computing services for authentication, payments, secrets, or user data
- Disabling certificate verification or weakening TLS for compatibility
- Long-lived dual encryption or signature formats without a documented provider-supported transition and removal date
