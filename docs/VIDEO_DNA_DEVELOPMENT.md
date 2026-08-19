# Crucible Video DNA Furnace — Developer Readiness

## Purpose
Video DNA Furnace accepts a signed-in Pro/trial user's video, extracts chronological visual evidence in the browser, sends a bounded set of frames to the server, and returns a structured Video DNA analysis with reconstruction prompts and evidence-aware confidence.

The current paid service ID remains `prompt-reforge` for backward compatibility. Product-facing naming is **Video DNA Furnace**.

## Current request flow
1. User selects a local video in `/prompt-reforge`.
2. Browser reads duration/aspect ratio and extracts 10 evenly spaced JPEG frames.
3. Client POSTs JSON to `/api/prompt-reforge`.
4. Server checks the paid-provider feature flag.
5. Server requires authenticated Supabase user, confirmed email, active trial/subscription, and rate-limit allowance.
6. Server validates frame count, format, per-frame size, and total request size.
7. Credits are reserved before the provider call.
8. OpenAI returns strict JSON matching `lib/promptReforgeSchema.ts`.
9. Credits are completed only after a valid result is produced.
10. Provider/parse failures trigger a credit refund attempt.

## Production gate
`PAID_PROVIDER_ROUTES_ENABLED=true` is required to execute paid-provider routes. When disabled, `/api/prompt-reforge` intentionally returns HTTP 503 before credits or provider usage occur.

Do not remove this gate to fix a UI error. Enable it only after access-control verification in the production environment.

## Environment requirements
- `OPENAI_API_KEY`
- Supabase server/client configuration used elsewhere in Crucible
- Billing/admin credentials required by access control and credit RPCs
- `PAID_PROVIDER_ROUTES_ENABLED=true` when the service is approved for live use

Never expose provider keys to the browser.

## API contract
### POST `/api/prompt-reforge`
Content-Type: `application/json`

Request:
```json
{
  "frames": ["data:image/jpeg;base64,..."],
  "duration": 12.5,
  "aspectRatio": "9:16",
  "userNotes": "optional creator context"
}
```

Constraints:
- minimum 3 frames
- maximum 16 frames
- JPEG, PNG, or WebP data URLs
- maximum 1,500,000 characters per frame
- maximum 8,000,000 characters across all frames

Success response:
```json
{
  "success": true,
  "analysis": { "...": "strict Video DNA schema" },
  "credits": {
    "cost": 250,
    "balance": 4750
  }
}
```

Expected error classes:
- `401` not signed in
- `402` inactive subscription/trial or insufficient credits
- `403` email not verified
- `413` frame payload too large/unsupported
- `429` rate limited (`Retry-After: 60`)
- `500` provider/configuration/result failure
- `503` paid-provider feature gate disabled or credit service unavailable

## Confidence model
Confidence must not be treated as proof of authorship or origin.

Evidence sources are deliberately separated:
- `measured`: supplied by Crucible from actual media/browser measurements
- `detected`: machine evidence produced by a dedicated detector
- `ai_inference`: model interpretation of supplied evidence
- `source_match`: an external match explicitly supplied by a source-search/fingerprint system

OpenAI must not promote an inference into `measured` or `source_match` on its own.

The current request provides measured duration and aspect ratio plus direct visual frames. It does **not** currently provide audio fingerprints, perceptual-hash matches, full codec/bitrate metadata, provenance credentials, or external source matches.

## Credits
Current price: `CREDIT_PRICES.promptReforge` (250 coins).

Critical invariant: credits are reserved before provider usage, completed after successful validated output, and refunded on provider/result failure. Any future reconstruction/generation action should use its own service ID and reservation rather than reusing the analysis charge.

## Developer commands
```bash
npm run dev
npm run typecheck
npm run lint
npm run build
npm run validate
```

`npm run validate` performs typecheck, lint, then production build.

## Developer-ready acceptance checklist
- [ ] `npm run validate` passes on `main`
- [ ] latest Vercel production deployment is READY
- [ ] production paid-provider flag is explicitly enabled
- [ ] authenticated/verified/active test account receives a successful structured result
- [ ] exactly 250 coins are charged on success
- [ ] invalid payload does not charge credits
- [ ] forced provider failure refunds reserved credits
- [ ] insufficient-credit request returns 402 with no provider call
- [ ] unauthenticated request returns 401
- [ ] unverified email returns 403
- [ ] inactive billing state returns 402
- [ ] fifth request inside the configured one-minute window is rate limited as expected
- [ ] output confidence does not claim source/origin evidence that was not supplied
- [ ] mobile browser can extract frames from supported test videos

## Next evidence upgrades
Add these independently and feed their results into the same confidence schema:
1. server-side media metadata extraction (codec, bitrate, streams, color/HDR data)
2. perceptual frame fingerprints
3. audio fingerprints
4. re-encode/compression analysis
5. provenance/content-credential parsing
6. external source-match search
7. persistent Video DNA report and Crucible verification record

Each detector should return its evidence plus method/version so confidence can later be calibrated against known test sets.
