create table if not exists public.creator_career_dna_reports (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  report_version text not null default 'career-dna-v1',
  input_snapshot jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists creator_career_dna_reports_owner_idx on public.creator_career_dna_reports(user_id, created_at desc);

create table if not exists public.creator_campaigns (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  name text not null,
  objective text not null default 'release',
  status text not null default 'draft' check (status in ('draft','planned','active','paused','completed','archived')),
  release_date date,
  start_date date,
  end_date date,
  budget_cents bigint,
  currency text not null default 'USD',
  channels jsonb not null default '[]'::jsonb,
  audience jsonb not null default '{}'::jsonb,
  strategy jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_campaigns_owner_idx on public.creator_campaigns(user_id, updated_at desc);

create table if not exists public.creator_campaign_tasks (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creator_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status text not null default 'todo' check (status in ('todo','doing','done','skipped')),
  priority text not null default 'normal' check (priority in ('low','normal','high')),
  channel text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_campaign_tasks_campaign_idx on public.creator_campaign_tasks(campaign_id, status, due_at);

create table if not exists public.creator_campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creator_campaigns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  metric_date date not null,
  impressions bigint,
  views bigint,
  clicks bigint,
  saves bigint,
  streams bigint,
  followers_gained bigint,
  spend_cents bigint,
  revenue_cents bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(campaign_id, source, metric_date)
);
create index if not exists creator_campaign_metrics_campaign_idx on public.creator_campaign_metrics(campaign_id, metric_date desc);

alter table public.creator_career_dna_reports enable row level security;
alter table public.creator_campaigns enable row level security;
alter table public.creator_campaign_tasks enable row level security;
alter table public.creator_campaign_metrics enable row level security;

revoke all on public.creator_career_dna_reports from anon, authenticated;
revoke all on public.creator_campaigns from anon, authenticated;
revoke all on public.creator_campaign_tasks from anon, authenticated;
revoke all on public.creator_campaign_metrics from anon, authenticated;
