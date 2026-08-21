# Crucible Trust Standard

## Purpose
Crucible should earn revenue by delivering clear value to creators, never through confusion, lock-in, hidden charges, dark patterns, or preventable loss. This standard is a product and engineering requirement, not marketing copy.

## 1. Price before action
- Show the exact credit or dollar cost before a paid action executes.
- Never silently increase a quoted price during execution.
- Make recurring price, trial length, next billing date, and renewal terms clear before subscription confirmation.

## 2. No charge for failure
- A failed Furnace operation must not permanently consume credits.
- If credits are reserved before processing, automatically release/refund them when processing fails.
- Payment confirmation failures must never require the customer to pay a second time.
- Billing and credit grants must be idempotent so retries cannot double-charge or double-grant.

## 3. Transparent ledger
- Give users a readable history of credit grants, purchases, deductions, refunds, and adjustments.
- Each entry should identify the action, amount, date/time, and resulting balance.
- Give users access to subscription/payment history and receipts where available.

## 4. Easy cancellation
- Cancellation must be straightforward and available online for subscriptions started online.
- Do not hide cancellation behind unnecessary steps or pressure users to remain subscribed.
- Clearly state what happens to access and credits after cancellation.

## 5. Creator ownership and control
- Clearly explain ownership and licenses for uploaded and generated material.
- Do not claim ownership of a creator's original work merely because Crucible processed it.
- Explain retention and deletion behavior for uploaded files and outputs.
- Provide practical deletion/export controls as the product matures.

## 6. Honest AI
- Clearly distinguish user-created material, AI-assisted transformations, and Crucible verification results where relevant.
- Never represent probabilistic AI analysis as certainty.
- Verification badges/certificates must state what was actually verified and what was not.
- Do not train or reuse creator content beyond disclosed terms and consent requirements.

## 7. Privacy by design
- Collect only data reasonably needed to provide, secure, bill, improve, and support the service under disclosed terms.
- Keep privileged credentials server-only.
- Apply least privilege, RLS, access controls, logging, encryption in transit, and secure secret management.
- Do not sell personal information or quietly expand data use beyond published disclosures.

## 8. Security is continuous
- Automated dependency and code security scanning remains part of CI.
- High/critical findings are launch/release blockers until assessed and resolved or formally accepted with documented reasoning.
- Production security settings, dependencies, authentication protections, backups, and vendor advisories are reviewed regularly.
- Maintain an incident response path for suspected compromise or data exposure.

## 9. Make customers whole
When Crucible causes a billing, credit, or processing error:
1. Record the failure.
2. Stop repeated harm or duplicate processing.
3. Restore/refund affected credits or charges when appropriate.
4. Preserve enough audit history to explain what happened.
5. Fix the underlying defect rather than relying only on manual corrections.

## 10. No dark patterns
Crucible must not intentionally use:
- hidden recurring charges;
- preselected paid upgrades designed to trick users;
- confusing cancellation flows;
- false urgency or fake scarcity;
- disguised advertisements;
- misleading credit balances or pricing;
- intentionally difficult account deletion;
- deceptive consent controls.

## 11. Support accountability
- Users need a clear route to report billing, account, security, copyright, privacy, and processing problems.
- Important support actions should be auditable.
- Do not expose sensitive account information merely to make support easier.

## 12. Reliability before growth
- Core signup, verification, login, subscription, entitlement, credits, Furnace execution, refund/recovery, logout/login, and cancellation flows must pass production testing before unrestricted launch.
- A marketing deadline does not override a failed security, billing, privacy, or legal release gate.

## 13. Accessibility and respect
- Build toward WCAG-aligned accessible interfaces, keyboard/navigation support where applicable, readable contrast, meaningful labels, and understandable error states.
- Avoid interfaces designed to exploit vulnerable users or obscure consequences.

## 14. Legal and compliance gate
- Maintain the California compliance checklist and production security checklist alongside this standard.
- Obtain qualified legal review before unrestricted public launch for Terms, Privacy Policy, subscription/renewal disclosures, creator/content rights, and contests/prize structures.
- Update requirements as applicable laws, platform rules, and the product change.

## Feature release question
Before shipping a monetized or account-sensitive feature, ask:

> Would a reasonable creator understand what will happen, what it costs, what data/content is involved, and how to undo or recover from it?

If the answer is no, the feature is not ready.

---

**Status:** Internal product/engineering standard. This document does not replace legal advice, security testing, or applicable regulatory requirements.
