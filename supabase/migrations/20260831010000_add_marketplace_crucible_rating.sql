-- Surface the verified Crucible Star result on public marketplace listings.
-- The source File DNA record remains private; only its final score and grade
-- are copied to the public listing when an artist chooses to publish.
alter table public.sound_library_items
  add column if not exists crucible_score integer
    check (crucible_score is null or (crucible_score >= 0 and crucible_score <= 100)),
  add column if not exists crucible_grade text
    check (crucible_grade is null or crucible_grade = any (array['A', 'B', 'C', 'D', 'F']));

update public.sound_library_items as listing
set
  crucible_score = source.analysis_score,
  crucible_grade = source.grade
from public.star_music_files as source
where source.marketplace_item_id = listing.id
  and (listing.crucible_score is distinct from source.analysis_score
    or listing.crucible_grade is distinct from source.grade);

