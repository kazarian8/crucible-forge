# CrucibleStar before-and-after reports

After Forge creates its WAV, the browser scans every decoded sample in the original and the encoded master. It produces fixed-scale waveform and RMS-over-time plots, a comparison table, and deterministic explanations of measured changes. The two full-page PNG reports can be downloaded in Forge and are attached to one transactional email.

Measurements: sample peak, RMS dBFS, crest factor, near-full-scale sample count, proportion of samples below -60 dBFS, decoded sample rate, channels, duration, and SHA-256 fingerprints. These are browser signal measurements, not server-attested certificates. This implementation does not measure LUFS, true peak or loudness range and does not claim copyright verification or guaranteed musical improvement.

## Email setup required before release

Configure server-only `RESEND_API_KEY` and `CRUCIBLE_REPORT_EMAIL_FROM` in the deployed environment. The From address must belong to a verified Resend sending domain. No fallback sender or artist email is hardcoded.

`POST /api/star/mastering-report` checks the existing paid/trial/dev entitlement and verified account. It derives the recipient from Supabase `getUser()` and rejects account changes against the captured mastering account ID. Incoming recipient, sender, HTML and subject fields are ignored. Requests are rate limited, bounded and validated. Exact retries use a deterministic Resend idempotency key (provider deduplication lasts 24 hours).

An accepted provider message is labelled "accepted for delivery", not delivered. Missing configuration and provider rejection remain visible with a retry button; mastering and report download still work. Reports are preserved in the saved track’s analysis and can be viewed/downloaded in My Tracks. Before saving, report data lives in the open Forge session: there is no durable email queue, automatic delivery retry after closing the tab, or delivery-webhook tracking in this change.

Release gate: configure a verified sender, master an owned test track in the deployed environment, verify the returned provider message ID is delivered and addressed to the uploader, then inspect both attachments in the inbox. Do not mark live delivery verified from unit tests or API acceptance alone.

## Validation

`node --test tests/mastering-report.cjs` checks signal values, amplitude changes, malformed input, HTML escaping, recipient isolation, account switching, provider errors and missing configuration. `npm run typecheck` and targeted ESLint validate the touched app modules. Full-page image layout was rendered and visually inspected with a synthetic signal.

Star admin-only access and automatic recommendation processing remain outside this change (future ideas). The existing pending save flow moves title/artwork editing before the library insert; publication saves privately and posts a Moment. Distribution remains in My Tracks after saving.
