create table if not exists public.creator_live_presence (
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  session_hash text not null,
  presence_kind text not null check (presence_kind in ('viewer','listener')),
  surface text not null check (surface in ('moments','marketplace','track','share','other')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (track_id, session_hash, presence_kind, surface)
);

create index if not exists creator_live_presence_track_seen_idx
  on public.creator_live_presence(track_id, last_seen_at desc);

alter table public.creator_live_presence enable row level security;
revoke all on public.creator_live_presence from anon, authenticated;
