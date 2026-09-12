# CrucibleStar daily quality review

`/star/review` provides an administrator-only queue of non-archived Star uploads, newest first, with pagination, public/private filters, saved grades, measured original/master changes, and full saved-track playback. Only one player is mounted at a time. Preview URLs are signed on demand and expire after five minutes. Existing publishing and storage visibility are not changed.

## Access and rollout

Grant an administrator using server-controlled Supabase `app_metadata.role = "admin"`, or set the server-only `CRUCIBLE_STAR_ADMIN_IDS` to a comma-separated allowlist of authenticated user IDs. User-editable metadata never grants access. The page and its API independently check authorization before any privileged table or storage access. The Star navigation shows Review only to administrators.

Deploy the application, then verify unauthenticated and ordinary accounts cannot use `/api/star/review`, and the intended administrator can list and preview both public and private tracks. No database migration is required. Production credentials and the intended administrator's identity were not configured or verified during implementation.

## Comparison behavior

New Furnace masters are compared with their source before version selection. Both hashes and numerical snapshots are saved in the selected track's existing `analysis.master_quality` JSON. The selected version is recorded separately. The queue previews that saved version; it does not retain both audio files or reconstruct missing historical originals.

A lower technical score, increased near-clipping rate, changed channel count or duration, failed output, or a crest-factor drop above 3 dB raises a listening-review flag. A tied score reports no measured improvement. A higher score without these flags is described only as technical improvement. These are conservative screening heuristics, not perceptual quality certification. Full-file sample scanning replaces the former strided scan, and automated technical scores are capped at 99. Historical grades are not rewritten.

Browser-generated measurements remain advisory and user-controlled. The admin endpoint recomputes flags from stored snapshots; they are not trusted authorization, billing, or publishing inputs. The queue does not change grades, automatically update the mastering engine, send email, create reminders, or record listening sign-offs.

For a daily review, compare tracks by ear at matched playback levels and investigate flagged cases. To establish whether engine quality improves over time, rerun the same representative source tracks for each engine revision; daily upload averages mix different source quality and are not sufficient evidence of progress.

## Validation

Run `node --test tests/star-quality.test.mjs` (Node 24), `npm run typecheck`, and lint the changed files. Tests cover volume-only changes, clipping, lost dynamics, truncation, channel changes, invalid measurements, admin authorization, whole-file peak detection, and the score ceiling. Live account/storage playback still requires a configured deployment.
