create table if not exists public.mastering_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  file_name text not null,
  file_path text not null,
  file_size bigint,
  service_type text not null default 'free_quick_sample',
  status text not null default 'submitted',
  giveaway_entry boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.mastering_requests enable row level security;

create policy "Users can create their own mastering requests"
on public.mastering_requests
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can view their own mastering requests"
on public.mastering_requests
for select
to authenticated
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('mastering-uploads', 'mastering-uploads', false)
on conflict (id) do nothing;

create policy "Users can upload their own mastering files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mastering-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can view their own mastering files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mastering-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);
