# Crucible California Compliance Checklist (2026)

> Operational checklist only; not a substitute for review by a California attorney. Laws and thresholds can change.

## Launch blockers

- [ ] Publish a conspicuous Privacy Policy link on the site and app entry points.
- [ ] Privacy Policy discloses categories of personal information collected, purposes of use, categories of third parties/service providers, retention practices where required, consumer rights, and request methods.
- [ ] Update Privacy Policy at least annually and keep a version/effective-date history.
- [ ] If Crucible meets CCPA/CPRA applicability thresholds, implement required California consumer-rights workflows (know/access, delete, correct, opt out of sale/sharing, limit sensitive PI where applicable, non-discrimination) and verification procedures.
- [ ] If Crucible sells or shares personal information for cross-context behavioral advertising, provide the required opt-out mechanism and honor applicable preference signals.
- [ ] Review whether 2026 CPPA risk-assessment, cybersecurity-audit, or ADMT rules apply to Crucible before launch or feature expansion.

## Subscription / 30-day trial / automatic renewal

- [ ] Before checkout, clearly and conspicuously disclose that the subscription automatically renews unless canceled.
- [ ] Before checkout, disclose trial length, post-trial price, billing frequency, renewal terms, and any minimum commitment.
- [ ] Obtain express affirmative consent to the automatic-renewal / continuous-service terms; do not rely on silence or a prechecked box.
- [ ] Provide a retainable acknowledgment after signup containing renewal terms, cancellation policy, and how to cancel.
- [ ] Allow a customer who accepted online to cancel online at will, without unnecessary steps or obstruction.
- [ ] Place a prominent cancellation link/button in Account or Settings, and keep an alternate cancellation method available.
- [ ] Send legally required pre-renewal / trial-ending notices when thresholds are met. A 30-day trial is below the California >31-day trial reminder threshold, but the checkout and acknowledgment disclosures still apply.
- [ ] Provide notice of material price/fee changes before they take effect, including cancellation instructions.
- [ ] If annual renewal plans are ever added, implement the required annual reminder and 15–45 day renewal notice rules.

## Payments and billing records

- [ ] Stripe remains the payment processor; Crucible never stores raw card numbers or CVV.
- [ ] Billing confirmation is idempotent so refreshing cannot create duplicate subscriptions or duplicate credits.
- [ ] Customer can see plan, price, renewal date, trial end, and cancellation status from Account.
- [ ] Keep records of consent, checkout disclosure version, acknowledgments, cancellation requests, and billing notices.

## California Online Privacy Protection Act (CalOPPA)

- [ ] Commercial site Privacy Policy is conspicuously posted.
- [ ] Policy identifies categories of personally identifiable information collected and categories of third parties with whom it may be shared.
- [ ] Policy explains the process for users to review/request changes where applicable and how material policy changes are communicated.
- [ ] Policy states its effective date.

## Security and breach readiness

- [ ] Maintain reasonable security controls appropriate to the personal information Crucible handles.
- [ ] Keep production secrets server-side only; never expose service-role/secret keys in browser bundles.
- [ ] Enforce RLS / least privilege on Supabase tables and functions.
- [ ] Run automated dependency, CodeQL, build, lint, and type checks in CI.
- [ ] Enable logs, alerting, backup/recovery, and an incident-response procedure.
- [ ] Maintain a documented California data-breach response process, including legal review of notice obligations if an incident occurs.

## User content / creator features

- [ ] Terms of Service state who owns uploaded works and what limited license Crucible needs to process them.
- [ ] Terms prohibit uploading content the user lacks rights to use.
- [ ] Publish a copyright / DMCA contact and takedown process before public creator sharing or marketplace features launch.
- [ ] Define rules for public challenge submissions, voting, prizes, sponsor promotions, and removal/moderation.
- [ ] If a contest/sweepstakes offers money, equity, revenue share, or a prize pool, obtain California legal review before launch; do not condition a chance-based prize on payment or purchase.

## Children / age gating

- [ ] Decide and document the minimum user age before public launch.
- [ ] If the service is not intended for children under 13, state that clearly and avoid knowingly collecting their data.
- [ ] If teen users are permitted, review California Age-Appropriate Design Code / youth privacy requirements and applicable federal COPPA rules before enabling targeted or social features.

## Marketing and communications

- [ ] Commercial email includes truthful sender/subject information and a working unsubscribe process where required.
- [ ] Do not send marketing SMS without appropriate consent; keep transactional/security messages distinct from marketing.
- [ ] Do not use deceptive scarcity, fake countdowns, hidden fees, or misleading trial language.

## Accessibility and consumer protection

- [ ] Use clear pricing and plain-language disclosures; avoid dark patterns around signup, billing, or cancellation.
- [ ] Maintain reasonable web accessibility practices (keyboard navigation, labels, contrast, alt text) and obtain accessibility review before major public launch.
- [ ] Display business contact information and a reliable support channel.

## Evidence / release gate

Before public launch, save screenshots or test records proving:

1. Privacy Policy is visible before and after signup.
2. Trial/renewal terms appear next to the checkout consent action.
3. Express consent is captured.
4. Confirmation/acknowledgment is delivered and retainable.
5. Online cancellation works end-to-end.
6. Canceling prevents future renewal charges.
7. Stripe state and Crucible entitlement state remain synchronized.
8. Consumer privacy request channels work.
9. Security scans pass with no unresolved high/critical findings.
10. A California attorney reviews the final Terms, Privacy Policy, subscription flow, and any contest/prize mechanics before unrestricted public launch.
