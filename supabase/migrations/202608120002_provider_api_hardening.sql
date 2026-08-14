create table if not exists public.api_rate_limits (
  user_id uuid not null references auth.users(id) on delete cascade,
  route text not null,
  window_start timestamptz not null,
  request_count integer not null default 1 check (request_count > 0),
  primary key (user_id, route, window_start)
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant all on public.api_rate_limits to service_role;

create or replace function public.consume_api_rate_limit(
  p_user_id uuid,
  p_route text,
  p_limit integer,
  p_window_seconds integer default 60
)
returns table (allowed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_start timestamptz;
  v_request_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 or length(p_route) > 100 then
    return query select false;
    return;
  end if;

  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.api_rate_limits (
    user_id,
    route,
    window_start,
    request_count
  ) values (
    p_user_id,
    p_route,
    v_window_start,
    1
  )
  on conflict (user_id, route, window_start)
  do update set request_count = public.api_rate_limits.request_count + 1
  returning request_count into v_request_count;

  delete from public.api_rate_limits
  where window_start < now() - interval '1 day';

  return query select v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_api_rate_limit(uuid, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(uuid, text, integer, integer)
  to service_role;
