alter table public.profiles
  add column if not exists profile_link_slots_unlocked integer not null default 1;

update public.profiles
set profile_link_slots_unlocked = greatest(
  profile_link_slots_unlocked,
  least(
    3,
    greatest(
      1,
      case
        when jsonb_typeof(profile_links) = 'array' then jsonb_array_length(profile_links)
        else 0
      end
    )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_profile_link_slots_unlocked_check'
  ) then
    alter table public.profiles
      add constraint profiles_profile_link_slots_unlocked_check
      check (profile_link_slots_unlocked between 1 and 3);
  end if;
end $$;
