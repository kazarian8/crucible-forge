create table if not exists public.promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  request_id uuid not null unique,
  credit_job_id uuid not null unique,
  service_id text not null default 'promote-best-track',
  track_ref text not null,
  track_title text not null,
  campaign_type text not null default 'best_track_playlist',
  status text not null default 'queued' check (status in ('queued','active','completed','cancelled','payment_review','refunded')),
  credits_charged integer not null default 1000 check (credits_charged >= 0),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_placements (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promotion_campaigns(id) on delete cascade,
  platform text not null,
  playlist_name text,
  playlist_url text,
  track_url text,
  status text not null default 'pending' check (status in ('pending','placed','removed','failed')),
  notes text,
  placed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists promotion_campaigns_user_status_idx
  on public.promotion_campaigns(user_id, status, requested_at desc);
create index if not exists promotion_campaigns_queue_idx
  on public.promotion_campaigns(status, requested_at asc);
create index if not exists promotion_placements_campaign_idx
  on public.promotion_placements(campaign_id, status);

alter table public.promotion_campaigns enable row level security;
alter table public.promotion_placements enable row level security;

revoke all on table public.promotion_campaigns from public, anon, authenticated;
revoke all on table public.promotion_placements from public, anon, authenticated;
grant select on table public.promotion_campaigns to authenticated;
grant select on table public.promotion_placements to authenticated;
grant select, insert, update, delete on table public.promotion_campaigns to service_role;
grant select, insert, update, delete on table public.promotion_placements to service_role;

drop policy if exists "Users can view their own promotion campaigns" on public.promotion_campaigns;
create policy "Users can view their own promotion campaigns"
on public.promotion_campaigns for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their own promotion placements" on public.promotion_placements;
create policy "Users can view their own promotion placements"
on public.promotion_placements for select to authenticated
using (
  exists (
    select 1
    from public.promotion_campaigns pc
    where pc.id = promotion_placements.campaign_id
      and pc.user_id = (select auth.uid())
  )
);

drop policy if exists "Service role manages promotion campaigns" on public.promotion_campaigns;
create policy "Service role manages promotion campaigns"
on public.promotion_campaigns for all to service_role
using (true) with check (true);

drop policy if exists "Service role manages promotion placements" on public.promotion_placements;
create policy "Service role manages promotion placements"
on public.promotion_placements for all to service_role
using (true) with check (true);
