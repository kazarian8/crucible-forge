create extension if not exists pgcrypto;

create table if not exists public.creator_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  vault_number text not null unique,
  legal_name text not null,
  artist_name text,
  street_address text,
  apartment text,
  city text,
  state text,
  postal_code text,
  country text not null default 'US',
  business_name text,
  business_type text not null default 'individual' check (business_type in ('individual','sole_proprietor','llc','corporation','partnership','other')),
  tax_identifier_last4 text,
  identity_provider text not null default 'stripe_identity',
  identity_status text not null default 'not_started' check (identity_status in ('not_started','pending','verified','requires_input','canceled')),
  identity_session_id text,
  identity_verified_at timestamptz,
  declaration_version text not null default 'owner-v1',
  declaration_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creator_vault_access_keys (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  secret_hash text not null,
  secret_last4 text not null,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique(vault_id, secret_hash)
);

create unique index if not exists creator_vault_one_active_key
  on public.creator_vault_access_keys(vault_id)
  where revoked_at is null;

create table if not exists public.creator_ownership_records (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid not null references public.star_music_files(id) on delete cascade,
  declared_owner_name text not null,
  ownership_percent numeric(5,2) not null default 100 check (ownership_percent > 0 and ownership_percent <= 100),
  authorship jsonb not null default '{}'::jsonb,
  ai_assistance jsonb not null default '{}'::jsonb,
  original_sha256 text,
  current_sha256 text,
  declaration_version text not null default 'track-owner-v1',
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(vault_id, track_id)
);

create table if not exists public.creator_vault_documents (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  document_type text not null check (document_type in ('copyright','contract','split_sheet','business','identity_supporting','registration_certificate','other')),
  title text not null,
  storage_path text not null,
  sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.copyright_assistance_cases (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid not null references public.creator_vaults(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.star_music_files(id) on delete set null,
  work_title text not null,
  work_type text not null default 'sound_recording',
  status text not null default 'preparing' check (status in ('preparing','ready_for_artist_review','authorized_to_file','submitted','pending_office','registered','needs_attention','closed')),
  authorization_to_file boolean not null default false,
  copyright_office_case_number text,
  registration_number text,
  submitted_at timestamptz,
  registered_at timestamptz,
  notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.creator_vaults enable row level security;
alter table public.creator_vault_access_keys enable row level security;
alter table public.creator_ownership_records enable row level security;
alter table public.creator_vault_documents enable row level security;
alter table public.copyright_assistance_cases enable row level security;

drop policy if exists "vault owners read own vault" on public.creator_vaults;
create policy "vault owners read own vault" on public.creator_vaults for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vault owners update own vault" on public.creator_vaults;
create policy "vault owners update own vault" on public.creator_vaults for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vault owners read ownership records" on public.creator_ownership_records;
create policy "vault owners read ownership records" on public.creator_ownership_records for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vault owners insert ownership records" on public.creator_ownership_records;
create policy "vault owners insert ownership records" on public.creator_ownership_records for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vault owners update ownership records" on public.creator_ownership_records;
create policy "vault owners update ownership records" on public.creator_ownership_records for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "vault owners read documents" on public.creator_vault_documents;
create policy "vault owners read documents" on public.creator_vault_documents for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vault owners insert documents" on public.creator_vault_documents;
create policy "vault owners insert documents" on public.creator_vault_documents for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vault owners delete documents" on public.creator_vault_documents;
create policy "vault owners delete documents" on public.creator_vault_documents for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "vault owners read copyright cases" on public.copyright_assistance_cases;
create policy "vault owners read copyright cases" on public.copyright_assistance_cases for select to authenticated using (auth.uid() = user_id);
drop policy if exists "vault owners insert copyright cases" on public.copyright_assistance_cases;
create policy "vault owners insert copyright cases" on public.copyright_assistance_cases for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "vault owners update copyright cases" on public.copyright_assistance_cases;
create policy "vault owners update copyright cases" on public.copyright_assistance_cases for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'owner-vault',
  'owner-vault',
  false,
  52428800,
  array['application/pdf','image/jpeg','image/png','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "vault owners upload legal documents" on storage.objects;
create policy "vault owners upload legal documents" on storage.objects for insert to authenticated with check (
  bucket_id = 'owner-vault' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "vault owners read legal documents" on storage.objects;
create policy "vault owners read legal documents" on storage.objects for select to authenticated using (
  bucket_id = 'owner-vault' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "vault owners update legal documents" on storage.objects;
create policy "vault owners update legal documents" on storage.objects for update to authenticated using (
  bucket_id = 'owner-vault' and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'owner-vault' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "vault owners delete legal documents" on storage.objects;
create policy "vault owners delete legal documents" on storage.objects for delete to authenticated using (
  bucket_id = 'owner-vault' and (storage.foldername(name))[1] = auth.uid()::text
);
