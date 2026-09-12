create table if not exists public.paid_brand_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand_name text not null check (char_length(brand_name) between 2 and 80),
  destination_url text not null,
  image_path text not null,
  image_url text not null,
  credits_charged integer not null default 300 check (credits_charged >= 0),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null default (now() + interval '2 hours'),
  status text not null default 'active' check (status in ('active','paused','expired','rejected')),
  impressions bigint not null default 0,
  clicks bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paid_brand_links_rotation_idx
  on public.paid_brand_links (status, starts_at, ends_at, created_at);

alter table public.paid_brand_links enable row level security;

drop policy if exists "paid brand links public active read" on public.paid_brand_links;
create policy "paid brand links public active read"
on public.paid_brand_links
for select
to anon, authenticated
using (status = 'active' and starts_at <= now() and ends_at > now());

drop policy if exists "paid brand links owner read" on public.paid_brand_links;
create policy "paid brand links owner read"
on public.paid_brand_links
for select
to authenticated
using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'brand-link-images',
  'brand-link-images',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "brand link image owner upload" on storage.objects;
create policy "brand link image owner upload"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'brand-link-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "brand link image owner update" on storage.objects;
create policy "brand link image owner update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'brand-link-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'brand-link-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "brand link image owner delete" on storage.objects;
create policy "brand link image owner delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'brand-link-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
