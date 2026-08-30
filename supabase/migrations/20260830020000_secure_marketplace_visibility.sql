-- Draft marketplace items must only be visible to their owners. Published
-- listings remain publicly readable through "sound library public read".
drop policy if exists "sound library readable" on public.sound_library_items;

grant select, insert, update, delete on table public.sound_library_items to authenticated;
grant select on table public.sound_library_items to anon;
