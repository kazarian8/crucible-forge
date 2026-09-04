create table if not exists public.star_track_versions (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  status text not null default 'saved' check (status in ('saved', 'mastered')),
  version_label text not null default 'Saved',
  storage_path text not null,
  artwork_url text,
  original_filename text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_by uuid references auth.users(id) on delete set null,
  created_by_name text not null default 'Artist',
  edit_commands jsonb not null default '[]'::jsonb check (jsonb_typeof(edit_commands) = 'array'),
  created_at timestamptz not null default now(),
  unique (track_id, version_number)
);

create index if not exists star_track_versions_track_created_idx
  on public.star_track_versions (track_id, created_at desc);

alter table public.star_track_versions enable row level security;

drop policy if exists "owners can view track versions" on public.star_track_versions;
create policy "owners can view track versions"
  on public.star_track_versions for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "owners can create track versions" on public.star_track_versions;
create policy "owners can create track versions"
  on public.star_track_versions for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.star_music_files f
      where f.id = track_id and f.user_id = (select auth.uid())
    )
  );

drop policy if exists "owners can update track versions" on public.star_track_versions;
create policy "owners can update track versions"
  on public.star_track_versions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "owners can delete track versions" on public.star_track_versions;
create policy "owners can delete track versions"
  on public.star_track_versions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.capture_initial_star_track_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_name text;
begin
  select coalesce(nullif(p.display_name, ''), nullif(p.artist_name, ''), nullif(p.username, ''), split_part(p.email, '@', 1), 'Artist')
  into creator_name
  from public.profiles p
  where p.id = new.user_id;

  insert into public.star_track_versions (
    track_id,
    user_id,
    version_number,
    status,
    version_label,
    storage_path,
    artwork_url,
    original_filename,
    size_bytes,
    created_by,
    created_by_name,
    edit_commands,
    created_at
  ) values (
    new.id,
    new.user_id,
    1,
    case when new.verification_status = 'verified' then 'mastered' else 'saved' end,
    case when new.verification_status = 'verified' then 'Mastered' else 'Saved' end,
    new.storage_path,
    new.artwork_url,
    new.original_filename,
    new.size_bytes,
    new.user_id,
    coalesce(creator_name, 'Artist'),
    '[]'::jsonb,
    new.created_at
  )
  on conflict (track_id, version_number) do nothing;

  return new;
end;
$$;

drop trigger if exists capture_initial_star_track_version on public.star_music_files;
create trigger capture_initial_star_track_version
after insert on public.star_music_files
for each row execute function public.capture_initial_star_track_version();

insert into public.star_track_versions (
  track_id,
  user_id,
  version_number,
  status,
  version_label,
  storage_path,
  artwork_url,
  original_filename,
  size_bytes,
  created_by,
  created_by_name,
  edit_commands,
  created_at
)
select
  f.id,
  f.user_id,
  1,
  case when f.verification_status = 'verified' then 'mastered' else 'saved' end,
  case when f.verification_status = 'verified' then 'Mastered' else 'Saved' end,
  f.storage_path,
  f.artwork_url,
  f.original_filename,
  f.size_bytes,
  f.user_id,
  coalesce(nullif(p.display_name, ''), nullif(p.artist_name, ''), nullif(p.username, ''), split_part(p.email, '@', 1), 'Artist'),
  '[]'::jsonb,
  f.created_at
from public.star_music_files f
left join public.profiles p on p.id = f.user_id
on conflict (track_id, version_number) do nothing;

comment on table public.star_track_versions is
  'Immutable user-visible version history for Crucible Star tracks.';
