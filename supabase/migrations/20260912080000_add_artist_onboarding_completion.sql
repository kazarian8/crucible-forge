alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists onboarding_outcome text;

alter table public.profiles
  drop constraint if exists profiles_onboarding_outcome_check;

alter table public.profiles
  add constraint profiles_onboarding_outcome_check
  check (onboarding_outcome is null or onboarding_outcome in ('saved_first_track','engineer_mode'));

update public.profiles p
set onboarding_completed_at = coalesce(p.onboarding_completed_at, now()),
    onboarding_outcome = coalesce(p.onboarding_outcome, 'saved_first_track')
where p.onboarding_completed_at is null
  and exists (
    select 1
    from public.star_music_files s
    where s.user_id = p.id
      and s.archived_at is null
  );
