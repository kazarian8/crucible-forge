alter table public.creator_vaults
  add column if not exists terms_version text not null default 'owner-vault-v1',
  add column if not exists terms_accepted_at timestamptz;

create table if not exists public.creator_vault_assets (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  title text not null,
  original_filename text,
  storage_path text not null,
  sha256 text,
  analysis jsonb not null default '{}'::jsonb,
  analysis_score integer,
  grade text,
  verification_status text,
  versions jsonb not null default '[]'::jsonb,
  source_created_at timestamptz,
  last_synced_at timestamptz not null default now(),
  unique(vault_id, track_id)
);

create index if not exists creator_vault_assets_owner_idx
  on public.creator_vault_assets(user_id, last_synced_at desc);

alter table public.creator_vault_assets enable row level security;

drop policy if exists "vault owners read own vault" on public.creator_vaults;
drop policy if exists "vault owners update own vault" on public.creator_vaults;
drop policy if exists "vault owners read ownership records" on public.creator_ownership_records;
drop policy if exists "vault owners insert ownership records" on public.creator_ownership_records;
drop policy if exists "vault owners update ownership records" on public.creator_ownership_records;
drop policy if exists "vault owners read documents" on public.creator_vault_documents;
drop policy if exists "vault owners insert documents" on public.creator_vault_documents;
drop policy if exists "vault owners delete documents" on public.creator_vault_documents;
drop policy if exists "vault owners read copyright cases" on public.copyright_assistance_cases;
drop policy if exists "vault owners insert copyright cases" on public.copyright_assistance_cases;
drop policy if exists "vault owners update copyright cases" on public.copyright_assistance_cases;
drop policy if exists "vault owners read own audit" on public.creator_vault_audit_log;

drop policy if exists "vault owners upload legal documents" on storage.objects;
drop policy if exists "vault owners read legal documents" on storage.objects;
drop policy if exists "vault owners update legal documents" on storage.objects;
drop policy if exists "vault owners delete legal documents" on storage.objects;

create or replace function public.sync_creator_vault_track(p_track_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track public.star_music_files%rowtype;
  v_vault public.creator_vaults%rowtype;
  v_versions jsonb;
begin
  select * into v_track from public.star_music_files where id = p_track_id;
  if not found then return; end if;

  select * into v_vault
  from public.creator_vaults
  where user_id = v_track.user_id
    and identity_status = 'verified'
    and legal_name_verified = true
    and address_on_file = true
  limit 1;
  if not found then return; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', v.id,
    'version_number', v.version_number,
    'status', v.status,
    'version_label', v.version_label,
    'storage_path', v.storage_path,
    'original_filename', v.original_filename,
    'size_bytes', v.size_bytes,
    'created_by_name', v.created_by_name,
    'edit_commands', coalesce(v.edit_commands, '[]'::jsonb),
    'created_at', v.created_at
  ) order by v.version_number desc), '[]'::jsonb)
  into v_versions
  from public.star_track_versions v
  where v.track_id = v_track.id and v.user_id = v_track.user_id;

  insert into public.creator_vault_assets (
    vault_id,user_id,track_id,title,original_filename,storage_path,sha256,
    analysis,analysis_score,grade,verification_status,versions,source_created_at,last_synced_at
  ) values (
    v_vault.id,v_track.user_id,v_track.id,v_track.title,v_track.original_filename,v_track.storage_path,v_track.sha256,
    coalesce(v_track.analysis,'{}'::jsonb),v_track.analysis_score,v_track.grade,v_track.verification_status,
    v_versions,v_track.created_at,now()
  )
  on conflict (vault_id,track_id) do update set
    title = excluded.title,
    original_filename = excluded.original_filename,
    storage_path = excluded.storage_path,
    sha256 = excluded.sha256,
    analysis = excluded.analysis,
    analysis_score = excluded.analysis_score,
    grade = excluded.grade,
    verification_status = excluded.verification_status,
    versions = excluded.versions,
    source_created_at = excluded.source_created_at,
    last_synced_at = now();
end;
$$;

create or replace function public.sync_creator_vault_assets(p_user_id uuid, p_vault_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_track record;
  v_count integer := 0;
  v_valid boolean := false;
begin
  select exists(
    select 1 from public.creator_vaults
    where id = p_vault_id
      and user_id = p_user_id
      and identity_status = 'verified'
      and legal_name_verified = true
      and address_on_file = true
  ) into v_valid;
  if not v_valid then return 0; end if;

  for v_track in select id from public.star_music_files where user_id = p_user_id and archived_at is null loop
    perform public.sync_creator_vault_track(v_track.id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

create or replace function public.creator_vault_track_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_creator_vault_track(coalesce(new.id, old.id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists creator_vault_sync_star_track on public.star_music_files;
create trigger creator_vault_sync_star_track
after insert or update of title,original_filename,storage_path,sha256,analysis,analysis_score,grade,verification_status,archived_at
on public.star_music_files
for each row execute function public.creator_vault_track_sync_trigger();

create or replace function public.creator_vault_version_sync_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.sync_creator_vault_track(coalesce(new.track_id, old.track_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists creator_vault_sync_track_version on public.star_track_versions;
create trigger creator_vault_sync_track_version
after insert or update or delete on public.star_track_versions
for each row execute function public.creator_vault_version_sync_trigger();

revoke all on function public.sync_creator_vault_track(uuid) from public, anon, authenticated;
revoke all on function public.sync_creator_vault_assets(uuid,uuid) from public, anon, authenticated;
grant execute on function public.sync_creator_vault_track(uuid) to service_role;
grant execute on function public.sync_creator_vault_assets(uuid,uuid) to service_role;
