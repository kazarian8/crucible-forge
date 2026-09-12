alter table public.creator_vaults
  add column if not exists legal_name_verified boolean not null default false,
  add column if not exists address_on_file boolean not null default false,
  add column if not exists unlock_failed_count integer not null default 0,
  add column if not exists unlock_locked_until timestamptz,
  add column if not exists last_unlocked_at timestamptz;

create table if not exists public.creator_vault_unlock_sessions (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  user_agent_hash text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists creator_vault_unlock_sessions_lookup
  on public.creator_vault_unlock_sessions(user_id, vault_id, expires_at desc)
  where revoked_at is null;

create table if not exists public.creator_vault_audit_log (
  id bigint generated always as identity primary key,
  vault_id uuid references public.creator_vaults(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  user_agent_hash text,
  created_at timestamptz not null default now()
);

create index if not exists creator_vault_audit_log_owner_idx
  on public.creator_vault_audit_log(user_id, created_at desc);

alter table public.creator_vault_unlock_sessions enable row level security;
alter table public.creator_vault_audit_log enable row level security;

drop policy if exists "vault owners read own audit" on public.creator_vault_audit_log;
create policy "vault owners read own audit" on public.creator_vault_audit_log
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.purge_expired_vault_unlock_sessions()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.creator_vault_unlock_sessions
  where expires_at < now() - interval '1 day' or revoked_at is not null;
$$;

revoke all on function public.purge_expired_vault_unlock_sessions() from public, anon, authenticated;
grant execute on function public.purge_expired_vault_unlock_sessions() to service_role;
