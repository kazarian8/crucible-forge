-- Private source audio for durable DAW projects.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'daw-project-audio',
  'daw-project-audio',
  false,
  262144000,
  array['audio/wav', 'audio/x-wav']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "daw owners read project audio" on storage.objects;
create policy "daw owners read project audio"
on storage.objects for select
to authenticated
using (
  bucket_id = 'daw-project-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "daw owners upload project audio" on storage.objects;
create policy "daw owners upload project audio"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'daw-project-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "daw owners update project audio" on storage.objects;
create policy "daw owners update project audio"
on storage.objects for update
to authenticated
using (
  bucket_id = 'daw-project-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'daw-project-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "daw owners delete project audio" on storage.objects;
create policy "daw owners delete project audio"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'daw-project-audio'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- New Supabase projects require explicit Data API privileges. Keep the
-- versioned migration safe on older projects where these grants already exist.
grant select, insert, update, delete on table public.music_projects to authenticated;

