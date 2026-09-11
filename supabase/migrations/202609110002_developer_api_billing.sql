create table if not exists public.developer_api_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','paused','canceled')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan_code text,
  monthly_request_limit integer,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.developer_api_keys (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.developer_api_accounts(id) on delete cascade,
  name text not null default 'Default key',
  key_prefix text not null,
  key_hash text not null unique,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.developer_api_usage (
  id bigint generated always as identity primary key,
  account_id uuid not null references public.developer_api_accounts(id) on delete cascade,
  api_key_id uuid references public.developer_api_keys(id) on delete set null,
  request_id uuid not null unique,
  endpoint text not null,
  units integer not null default 1 check (units > 0),
  response_status integer,
  created_at timestamptz not null default now()
);

create index if not exists developer_api_accounts_status_idx on public.developer_api_accounts(status, current_period_end);
create index if not exists developer_api_keys_account_idx on public.developer_api_keys(account_id, revoked_at);
create index if not exists developer_api_usage_account_created_idx on public.developer_api_usage(account_id, created_at desc);

alter table public.developer_api_accounts enable row level security;
alter table public.developer_api_keys enable row level security;
alter table public.developer_api_usage enable row level security;

revoke all on table public.developer_api_accounts from public, anon, authenticated;
revoke all on table public.developer_api_keys from public, anon, authenticated;
revoke all on table public.developer_api_usage from public, anon, authenticated;

grant select on table public.developer_api_accounts to authenticated;
grant select on table public.developer_api_keys to authenticated;
grant select on table public.developer_api_usage to authenticated;
grant select, insert, update, delete on table public.developer_api_accounts to service_role;
grant select, insert, update, delete on table public.developer_api_keys to service_role;
grant select, insert, update, delete on table public.developer_api_usage to service_role;

drop policy if exists "Users can view their developer API account" on public.developer_api_accounts;
create policy "Users can view their developer API account"
on public.developer_api_accounts for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view their developer API key metadata" on public.developer_api_keys;
create policy "Users can view their developer API key metadata"
on public.developer_api_keys for select to authenticated
using (
  exists (
    select 1 from public.developer_api_accounts a
    where a.id = developer_api_keys.account_id
      and a.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can view their developer API usage" on public.developer_api_usage;
create policy "Users can view their developer API usage"
on public.developer_api_usage for select to authenticated
using (
  exists (
    select 1 from public.developer_api_accounts a
    where a.id = developer_api_usage.account_id
      and a.user_id = (select auth.uid())
  )
);

drop policy if exists "Service role manages developer API accounts" on public.developer_api_accounts;
create policy "Service role manages developer API accounts"
on public.developer_api_accounts for all to service_role using (true) with check (true);

drop policy if exists "Service role manages developer API keys" on public.developer_api_keys;
create policy "Service role manages developer API keys"
on public.developer_api_keys for all to service_role using (true) with check (true);

drop policy if exists "Service role manages developer API usage" on public.developer_api_usage;
create policy "Service role manages developer API usage"
on public.developer_api_usage for all to service_role using (true) with check (true);
