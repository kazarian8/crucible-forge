-- Make the credit ledger read-only to customers and invisible to anonymous users.
revoke all on table public.credit_wallets from public, anon;
revoke all on table public.credit_transactions from public, anon;
revoke all on table public.forge_jobs from public, anon;

revoke insert, update, delete, truncate, references, trigger
  on table public.credit_wallets from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.credit_transactions from authenticated;
revoke insert, update, delete, truncate, references, trigger
  on table public.forge_jobs from authenticated;

grant select on table public.credit_wallets to authenticated;
grant select on table public.credit_transactions to authenticated;
grant select on table public.forge_jobs to authenticated;
grant all on table public.credit_wallets to service_role;
grant all on table public.credit_transactions to service_role;
grant all on table public.forge_jobs to service_role;

-- Existing accounts should immediately have a visible zero balance. Stripe's
-- replay-safe webhook replaces the monthly bucket with 5,000 after checkout.
insert into public.credit_wallets (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.reserve_service_credits(
  p_user_id uuid,
  p_job_id uuid,
  p_service_id text,
  p_file_name text,
  p_cost integer
)
returns table(job_id uuid, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_user uuid;
  v_monthly integer;
  v_bonus integer;
  v_purchased integer;
  v_monthly_spend integer;
  v_bonus_spend integer;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;
  if p_user_id is null then raise exception 'USER_REQUIRED'; end if;
  if p_job_id is null then raise exception 'JOB_REQUIRED'; end if;
  if nullif(trim(p_service_id), '') is null then
    raise exception 'SERVICE_REQUIRED';
  end if;
  if p_cost <= 0 then raise exception 'INVALID_CREDIT_COST'; end if;

  if not exists (
    select 1
    from public.pro_subscriptions
    where user_id = p_user_id
      and (
        (status = 'trialing' and trial_end > now())
        or (status = 'active' and current_period_end > now())
      )
  ) then
    raise exception 'PRO_REQUIRED';
  end if;

  select user_id into v_existing_user
  from public.forge_jobs
  where id = p_job_id;

  if v_existing_user is not null then
    if v_existing_user <> p_user_id then raise exception 'JOB_NOT_OWNED'; end if;
    return query
      select p_job_id, w.balance
      from public.credit_wallets w
      where w.user_id = p_user_id;
    return;
  end if;

  insert into public.credit_wallets (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select monthly_balance, bonus_balance, purchased_balance
  into v_monthly, v_bonus, v_purchased
  from public.credit_wallets
  where user_id = p_user_id
  for update;

  if v_monthly + v_bonus + v_purchased < p_cost then
    raise exception 'INSUFFICIENT_CREDITS';
  end if;

  v_monthly_spend := least(v_monthly, p_cost);
  v_bonus_spend := least(v_bonus, p_cost - v_monthly_spend);

  update public.credit_wallets
  set monthly_balance = monthly_balance - v_monthly_spend,
      bonus_balance = bonus_balance - v_bonus_spend,
      purchased_balance = purchased_balance -
        (p_cost - v_monthly_spend - v_bonus_spend),
      lifetime_spent = lifetime_spent + p_cost,
      updated_at = now()
  where user_id = p_user_id;

  insert into public.forge_jobs (
    id,
    user_id,
    preset_id,
    file_name,
    credit_cost,
    monthly_credits_spent,
    bonus_credits_spent,
    purchased_credits_spent
  ) values (
    p_job_id,
    p_user_id,
    p_service_id,
    left(coalesce(nullif(p_file_name, ''), 'untitled'), 500),
    p_cost,
    v_monthly_spend,
    v_bonus_spend,
    p_cost - v_monthly_spend - v_bonus_spend
  );

  insert into public.credit_transactions (
    user_id,
    amount,
    kind,
    reference,
    description,
    balance_after
  )
  select
    p_user_id,
    -p_cost,
    'forge_reservation',
    p_job_id::text,
    'Crucible service: ' || p_service_id,
    w.balance
  from public.credit_wallets w
  where w.user_id = p_user_id;

  return query
    select p_job_id, w.balance
    from public.credit_wallets w
    where w.user_id = p_user_id;
end;
$$;

create or replace function public.complete_service_job(
  p_user_id uuid,
  p_job_id uuid,
  p_metrics jsonb default '{}'::jsonb
)
returns table(balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  select status into v_status
  from public.forge_jobs
  where id = p_job_id and user_id = p_user_id
  for update;

  if v_status is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_status = 'refunded' then raise exception 'JOB_ALREADY_REFUNDED'; end if;

  if v_status <> 'complete' then
    update public.forge_jobs
    set status = 'complete',
        metrics = coalesce(p_metrics, '{}'::jsonb),
        completed_at = now()
    where id = p_job_id and user_id = p_user_id;
  end if;

  return query
    select w.balance from public.credit_wallets w where w.user_id = p_user_id;
end;
$$;

create or replace function public.refund_service_job(
  p_user_id uuid,
  p_job_id uuid
)
returns table(balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_cost integer;
  v_monthly_spent integer;
  v_bonus_spent integer;
  v_purchased_spent integer;
  v_status text;
begin
  if current_setting('request.jwt.claim.role', true) <> 'service_role' then
    raise exception 'SERVICE_ROLE_REQUIRED';
  end if;

  select
    credit_cost,
    monthly_credits_spent,
    bonus_credits_spent,
    purchased_credits_spent,
    status
  into
    v_cost,
    v_monthly_spent,
    v_bonus_spent,
    v_purchased_spent,
    v_status
  from public.forge_jobs
  where id = p_job_id and user_id = p_user_id
  for update;

  if v_status is null then raise exception 'JOB_NOT_FOUND'; end if;
  if v_status = 'complete' then
    raise exception 'COMPLETED_JOB_CANNOT_BE_REFUNDED';
  end if;
  if v_status = 'refunded' then
    return query
      select w.balance from public.credit_wallets w where w.user_id = p_user_id;
    return;
  end if;

  update public.credit_wallets
  set monthly_balance = monthly_balance + v_monthly_spent,
      bonus_balance = bonus_balance + v_bonus_spent,
      purchased_balance = purchased_balance + v_purchased_spent,
      lifetime_spent = greatest(0, lifetime_spent - v_cost),
      updated_at = now()
  where user_id = p_user_id;

  update public.forge_jobs
  set status = 'refunded'
  where id = p_job_id and user_id = p_user_id;

  insert into public.credit_transactions (
    user_id,
    amount,
    kind,
    reference,
    description,
    balance_after
  )
  select
    p_user_id,
    v_cost,
    'forge_refund',
    p_job_id::text,
    'Automatic refund for failed Crucible service',
    w.balance
  from public.credit_wallets w
  where w.user_id = p_user_id
  on conflict (user_id, kind, reference) do nothing;

  return query
    select w.balance from public.credit_wallets w where w.user_id = p_user_id;
end;
$$;

revoke all on function public.reserve_service_credits(uuid, uuid, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.complete_service_job(uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke all on function public.refund_service_job(uuid, uuid)
  from public, anon, authenticated;

grant execute on function public.reserve_service_credits(uuid, uuid, text, text, integer)
  to service_role;
grant execute on function public.complete_service_job(uuid, uuid, jsonb)
  to service_role;
grant execute on function public.refund_service_job(uuid, uuid)
  to service_role;
