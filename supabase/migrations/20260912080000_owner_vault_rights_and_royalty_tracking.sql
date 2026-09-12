create table if not exists public.creator_rights_findings (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  provider text not null,
  platform text not null,
  source_url text,
  match_type text not null default 'audio_match' check (match_type in ('audio_match','metadata_match','manual_report','other')),
  confidence numeric(5,2),
  status text not null default 'review' check (status in ('review','authorized','unauthorized','claim_started','resolved','dismissed')),
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists creator_rights_findings_owner_idx
  on public.creator_rights_findings(user_id, last_seen_at desc);
create index if not exists creator_rights_findings_track_idx
  on public.creator_rights_findings(track_id, last_seen_at desc);

create table if not exists public.creator_rights_scan_runs (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  provider text not null,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','unavailable')),
  result_count integer not null default 0,
  error_code text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists creator_rights_scan_runs_owner_idx
  on public.creator_rights_scan_runs(user_id, created_at desc);

create table if not exists public.creator_royalty_checks (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  source text not null,
  status text not null default 'not_started' check (status in ('not_started','needs_registration','searching','potential_match','claim_started','claimed','paid','no_match','needs_attention')),
  estimated_amount_cents bigint,
  currency text not null default 'USD',
  external_reference text,
  notes jsonb not null default '{}'::jsonb,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vault_id, track_id, source)
);

create index if not exists creator_royalty_checks_owner_idx
  on public.creator_royalty_checks(user_id, updated_at desc);

alter table public.creator_rights_findings enable row level security;
alter table public.creator_rights_scan_runs enable row level security;
alter table public.creator_royalty_checks enable row level security;

revoke all on public.creator_rights_findings from anon, authenticated;
revoke all on public.creator_rights_scan_runs from anon, authenticated;
revoke all on public.creator_royalty_checks from anon, authenticated;
