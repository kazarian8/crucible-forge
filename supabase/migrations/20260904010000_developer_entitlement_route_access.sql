-- Let an authenticated invitee read only their own developer entitlement.
-- Sensitive invite columns (email and invite_token_hash) remain inaccessible.
grant select (user_id, enabled, invite_expires_at)
on table public.expert_musician_dev_access
to authenticated;

drop policy if exists "Users can view own active developer access"
on public.expert_musician_dev_access;

create policy "Users can view own active developer access"
on public.expert_musician_dev_access
for select
to authenticated
using ((select auth.uid()) = user_id);
