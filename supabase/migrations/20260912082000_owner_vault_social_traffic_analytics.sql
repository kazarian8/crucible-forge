create table if not exists public.creator_social_connections (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('instagram','facebook','tiktok','x','lemon8','youtube','other')),
  external_account_id text,
  account_label text,
  status text not null default 'not_connected' check (status in ('not_connected','pending','connected','expired','error','unsupported')),
  scopes jsonb not null default '[]'::jsonb,
  token_reference text,
  metadata jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vault_id, provider, external_account_id)
);
create index if not exists creator_social_connections_owner_idx on public.creator_social_connections(user_id, provider);

create table if not exists public.creator_campaign_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creator_campaigns(id) on delete cascade,
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  short_code text not null unique,
  platform text not null,
  target_url text not null,
  label text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_campaign_links_campaign_idx on public.creator_campaign_links(campaign_id, active);

create table if not exists public.creator_campaign_traffic_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.creator_campaigns(id) on delete cascade,
  link_id uuid references public.creator_campaign_links(id) on delete set null,
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  source text,
  medium text,
  referrer_host text,
  platform text,
  session_hash text,
  country_code text,
  device_class text,
  event_type text not null default 'click' check (event_type in ('click','view','conversion')),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists creator_campaign_traffic_events_campaign_idx on public.creator_campaign_traffic_events(campaign_id, occurred_at desc);

create table if not exists public.creator_social_metric_samples (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  connection_id uuid references public.creator_social_connections(id) on delete cascade,
  provider text not null,
  external_content_id text,
  recorded_at timestamptz not null default now(),
  followers bigint,
  impressions bigint,
  reach bigint,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  clicks bigint,
  watch_time_seconds bigint,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists creator_social_metric_samples_owner_idx on public.creator_social_metric_samples(user_id, provider, recorded_at desc);

alter table public.creator_social_connections enable row level security;
alter table public.creator_campaign_links enable row level security;
alter table public.creator_campaign_traffic_events enable row level security;
alter table public.creator_social_metric_samples enable row level security;

revoke all on public.creator_social_connections from anon, authenticated;
revoke all on public.creator_campaign_links from anon, authenticated;
revoke all on public.creator_campaign_traffic_events from anon, authenticated;
revoke all on public.creator_social_metric_samples from anon, authenticated;
