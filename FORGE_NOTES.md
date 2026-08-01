# Crucible Forge — Reforged Routing Fix

## Corrected
- Fixed the invalid Supabase client import in `app/page.tsx`.
- Removed the obsolete root-level `page.tsx` file that Next.js App Router never used.
- Replaced the obsolete Studio page with a safe redirect to `/sound-furnace`.
- Changed the Contact page's “Back to studio” button to “Back to furnace”.
- Added permanent redirects from `/studio` and `/mastering` to `/sound-furnace`.
- Added safe fallback pages for unfinished winners links so they no longer return 404.

## Vercel
Deploy this folder as the repository root. Confirm Vercel is connected to the branch containing these files and that the project Root Directory is blank (repository root).
