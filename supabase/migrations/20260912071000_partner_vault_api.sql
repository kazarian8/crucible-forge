create table if not exists public.partner_api_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  key_prefix text not null,
  key_hash text not null unique,
  scopes text[] not null default array['vault_sessions:create','vault_status:read']::text[],
  active boolean not null default true,
  rate_limit_per_minute integer not null default 60 check (rate_limit_per_minute between 1 and 10000),
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partner_vault_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.partner_api_clients(id) on delete cascade,
  external_user_id text not null,
  email_hint text,
  session_token_hash text not null unique,
  return_url text,
  metadata jsonb not null default '{}'::jsonb,
  user_id uuid references auth.users(id) on delete set null,
  vault_id uuid references public.creator_vaults(id) on delete set null,
  status text not null default 'created' check (status in ('created','started','identity_pending','completed','expired','canceled')),
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(client_id, external_user_id, id)
);

create index if not exists partner_vault_sessions_client_external_idx
  on public.partner_vault_sessions(client_id, external_user_id, created_at desc);
create index if not exists partner_vault_sessions_token_idx
  on public.partner_vault_sessions(session_token_hash);

create table if not exists public.partner_api_rate_windows (
  client_id uuid not null references public.partner_api_clients(id) on delete cascade,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (client_id, window_start)
);

alter table public.partner_api_clients enable row level security;
alter table public.partner_vault_sessions enable row level security;
alter table public.partner_api_rate_windows enable row level security;

create or replace function public.consume_partner_api_request(p_client_id uuid)
returns table(allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer;
  v_window timestamptz := date_trunc('minute', now());
  v_count integer;
begin
  select rate_limit_per_minute into v_limit
  from public.partner_api_clients
  where id = p_client_id and active = true;
  if v_limit is null then
    return query select false, 0, v_window + interval '1 minute';
    return;
  end if;

  insert into public.partner_api_rate_windows(client_id, window_start, request_count)
  values (p_client_id, v_window, 1)
  on conflict (client_id, window_start)
  do update set request_count = public.partner_api_rate_windows.request_count + 1
  returning request_count into v_count;

  return query select v_count <= v_limit, greatest(v_limit - v_count, 0), v_window + interval '1 minute';
end;
$$;

revoke all on function public.consume_partner_api_request(uuid) from public, anon, authenticated;
grant execute on function public.consume_partner_api_request(uuid) to service_role;
