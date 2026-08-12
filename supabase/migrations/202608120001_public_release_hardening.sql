-- Restrict privileged forge lifecycle functions to trusted server code only.
revoke all on function public.complete_forge_job(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.refund_failed_forge(uuid) from public, anon, authenticated;
revoke all on function public.reserve_forge_credits(uuid, text, text, text, integer) from public, anon, authenticated;
grant execute on function public.complete_forge_job(uuid, jsonb, text) to service_role;
grant execute on function public.refund_failed_forge(uuid) to service_role;
grant execute on function public.reserve_forge_credits(uuid, text, text, text, integer) to service_role;

-- Signed-in users can edit personal profile fields, never identity or role.
revoke all on table public.profiles from anon;
revoke insert, delete, truncate, references, trigger on table public.profiles from authenticated;
revoke update on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant update (first_name, last_name, artist_name, phone, street_address, apartment, city, state, zip_code, country, updated_at)
  on table public.profiles to authenticated;

drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users can update safe profile fields" on public.profiles;
create policy "Users can update safe profile fields"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users can view their profile" on public.profiles;
create policy "Users can view their profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

-- Stripe replay records are server-only.
revoke all on table public.stripe_webhook_events from public, anon, authenticated;
grant select, insert, update, delete on table public.stripe_webhook_events to service_role;
drop policy if exists "Service role manages Stripe webhook events" on public.stripe_webhook_events;
create policy "Service role manages Stripe webhook events"
on public.stripe_webhook_events for all to service_role
using (true) with check (true);

-- Private owner-scoped audio uploads, capped at 250 MiB.
update storage.buckets
set public = false,
    file_size_limit = 262144000,
    allowed_mime_types = array[
      'audio/wav','audio/x-wav','audio/mpeg','audio/mp3','audio/flac','audio/x-flac',
      'audio/aiff','audio/x-aiff','audio/mp4','audio/x-m4a','audio/aac','audio/ogg'
    ]::text[]
where id = 'mastering-uploads';

drop policy if exists "Users can upload their own mastering files" on storage.objects;
create policy "Users can upload their own mastering files"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'mastering-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can view their own mastering files" on storage.objects;
create policy "Users can view their own mastering files"
on storage.objects for select to authenticated
using (
  bucket_id = 'mastering-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete their own mastering uploads" on storage.objects;
create policy "Users can delete their own mastering uploads"
on storage.objects for delete to authenticated
using (
  bucket_id = 'mastering-uploads'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create index if not exists distribution_requests_track_submission_id_idx
  on public.distribution_requests(track_submission_id);
create index if not exists distribution_requests_user_id_idx
  on public.distribution_requests(user_id);
create index if not exists giveaway_entries_user_id_idx
  on public.giveaway_entries(user_id);
create index if not exists mastering_requests_user_id_idx
  on public.mastering_requests(user_id);
create index if not exists track_submissions_user_id_idx
  on public.track_submissions(user_id);
