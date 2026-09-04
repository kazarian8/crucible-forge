create table if not exists public.project_collaborators (
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  invited_by uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('editor')),
  joined_at timestamptz not null default now(),
  primary key (track_id, user_id)
);

create table if not exists public.project_collaboration_invites (
  id uuid primary key default gen_random_uuid(),
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz
);

create index if not exists project_collaborators_user_track_idx
  on public.project_collaborators(user_id, track_id);
create index if not exists project_collaboration_invites_track_active_idx
  on public.project_collaboration_invites(track_id, revoked_at);

alter table public.project_collaborators enable row level security;
alter table public.project_collaboration_invites enable row level security;

revoke all on public.project_collaboration_invites from anon, authenticated;
grant select on public.project_collaborators to authenticated;

create policy "project members can view collaborators"
on public.project_collaborators for select
to authenticated
using (
  exists (
    select 1 from public.star_music_files f
    where f.id = project_collaborators.track_id
      and f.user_id = (select auth.uid())
  )
  or project_collaborators.user_id = (select auth.uid())
  or exists (
    select 1 from public.project_collaborators pc
    where pc.track_id = project_collaborators.track_id
      and pc.user_id = (select auth.uid())
  )
);

-- Private tracks remain owner-controlled, but accepted collaborators may read the
-- project they were invited to. Invite tokens alone never satisfy this policy.
drop policy if exists "star owners read own files" on public.star_music_files;
create policy "project members read private files"
on public.star_music_files for select
to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.project_collaborators pc
    where pc.track_id = star_music_files.id
      and pc.user_id = (select auth.uid())
  )
);

-- Version history is shared with accepted collaborators. New versions can be
-- authored by either the owner or an accepted editor, while each version keeps
-- the actual author's user_id.
drop policy if exists "owners can view track versions" on public.star_track_versions;
create policy "project members can view track versions"
on public.star_track_versions for select
to authenticated
using (
  exists (
    select 1 from public.star_music_files f
    where f.id = star_track_versions.track_id
      and (
        f.user_id = (select auth.uid())
        or exists (
          select 1 from public.project_collaborators pc
          where pc.track_id = f.id
            and pc.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "owners can create track versions" on public.star_track_versions;
create policy "project members can create track versions"
on public.star_track_versions for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.star_music_files f
    where f.id = star_track_versions.track_id
      and (
        f.user_id = (select auth.uid())
        or exists (
          select 1 from public.project_collaborators pc
          where pc.track_id = f.id
            and pc.user_id = (select auth.uid())
        )
      )
  )
);

comment on table public.project_collaborators is
  'Accepted private-track collaborators. Membership, not possession of an invite URL, grants project access.';
comment on table public.project_collaboration_invites is
  'Owner-generated reusable collaboration invite links stored as SHA-256 hashes. Raw tokens are never persisted.';
