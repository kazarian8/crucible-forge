-- A wall publication is independent of any license listing.
alter table public.artist_moments add column if not exists star_file_id uuid references public.star_music_files(id) on delete set null;
create unique index if not exists artist_moments_star_file_unique on public.artist_moments(star_file_id) where star_file_id is not null;

create or replace function public.publish_track_to_wall(track_id uuid, owner_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare track public.star_music_files%rowtype; moment_id uuid;
begin
  select * into track from public.star_music_files where id = track_id and user_id = owner_id for update;
  if not found then raise exception 'Track not found'; end if;
  if track.verification_status = 'failed' then raise exception 'Track failed analysis'; end if;
  if track.storage_path not like owner_id::text || '/%' then raise exception 'Invalid track path'; end if;
  insert into public.artist_moments(user_id,star_file_id,body,music_url,artwork_url,is_public)
  values(owner_id,track_id,'New track: ' || track.title || E'\nPublished on Crucible.', '/api/tracks/stream?id=' || track_id::text,track.artwork_url,true)
  on conflict (star_file_id) where star_file_id is not null do update
    set is_public=true, music_url=excluded.music_url, artwork_url=excluded.artwork_url
  returning id into moment_id;
  update public.star_music_files set publish_status='published',updated_at=now() where id=track_id and user_id=owner_id;
  return moment_id;
end $$;
revoke all on function public.publish_track_to_wall(uuid,uuid) from public,anon,authenticated;
grant execute on function public.publish_track_to_wall(uuid,uuid) to service_role;

create or replace function public.unpublish_track_from_wall(track_id uuid, owner_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  perform 1 from public.star_music_files where id=track_id and user_id=owner_id for update;
  if not found then raise exception 'Track not found'; end if;
  update public.artist_moments set is_public=false where star_file_id=track_id and user_id=owner_id;
  update public.star_music_files set publish_status='ready',updated_at=now() where id=track_id and user_id=owner_id;
end $$;
revoke all on function public.unpublish_track_from_wall(uuid,uuid) from public,anon,authenticated;
grant execute on function public.unpublish_track_from_wall(uuid,uuid) to service_role;

-- Owners may only attach their own saved audio to a wall post.
create policy "wall track belongs to moment owner" on public.artist_moments
as restrictive for all to authenticated
using (true)
with check (star_file_id is null or exists (
  select 1 from public.star_music_files s where s.id=star_file_id and s.user_id=auth.uid()
));
