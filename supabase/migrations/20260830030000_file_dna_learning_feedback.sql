create table if not exists public.file_dna_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  star_file_id uuid not null references public.star_music_files(id) on delete cascade,
  model_version text not null,
  predicted_type text not null,
  predicted_category text not null,
  predicted_tags text[] not null default '{}',
  predicted_bpm integer,
  predicted_key text,
  predicted_confidence integer not null check (predicted_confidence between 0 and 100),
  corrected_type text not null,
  corrected_category text not null,
  corrected_tags text[] not null default '{}',
  corrected_bpm integer,
  corrected_key text,
  confirmed boolean not null default false,
  feature_vector jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, star_file_id, model_version)
);

create index if not exists file_dna_feedback_user_id_idx on public.file_dna_feedback(user_id);
create index if not exists file_dna_feedback_model_version_idx on public.file_dna_feedback(model_version);

alter table public.file_dna_feedback enable row level security;

create policy "file dna owners read feedback"
on public.file_dna_feedback for select to authenticated
using ((select auth.uid()) = user_id);

create policy "file dna owners add feedback"
on public.file_dna_feedback for insert to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.star_music_files file
    where file.id = star_file_id and file.user_id = (select auth.uid())
  )
);

create policy "file dna owners update feedback"
on public.file_dna_feedback for update to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.star_music_files file
    where file.id = star_file_id and file.user_id = (select auth.uid())
  )
);

grant select, insert, update on table public.file_dna_feedback to authenticated;
grant all on table public.file_dna_feedback to service_role;
