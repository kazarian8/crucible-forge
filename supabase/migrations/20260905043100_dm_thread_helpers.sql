create or replace function public.list_crucible_dm_threads()
returns table (
  other_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  last_body text,
  last_at timestamptz,
  unread_count bigint,
  request_state text
)
language sql
security definer
set search_path = public
as $$
  with mine as (
    select d.*,
      case when d.sender_id = auth.uid() then d.recipient_id else d.sender_id end as other_id
    from public.direct_messages d
    where d.sender_id = auth.uid() or d.recipient_id = auth.uid()
  ), ranked as (
    select m.*, row_number() over (partition by other_id order by created_at desc) as rn
    from mine m
  )
  select r.other_id, p.username, p.display_name, p.avatar_url,
         r.body, r.created_at,
         (select count(*) from mine u where u.other_id = r.other_id and u.recipient_id = auth.uid() and u.read_at is null and u.request_state <> 'declined'),
         r.request_state
  from ranked r
  left join public.profiles p on p.id = r.other_id
  where r.rn = 1
  order by r.created_at desc;
$$;

grant execute on function public.list_crucible_dm_threads() to authenticated;

create or replace function public.get_crucible_dm_thread(p_other uuid)
returns table (
  id uuid,
  sender_id uuid,
  recipient_id uuid,
  body text,
  message_type text,
  attachment_url text,
  request_state text,
  created_at timestamptz,
  read_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select d.id, d.sender_id, d.recipient_id, d.body, d.message_type,
         d.attachment_url, d.request_state, d.created_at, d.read_at
  from public.direct_messages d
  where (d.sender_id = auth.uid() and d.recipient_id = p_other)
     or (d.sender_id = p_other and d.recipient_id = auth.uid())
  order by d.created_at asc
  limit 500;
$$;

grant execute on function public.get_crucible_dm_thread(uuid) to authenticated;

create or replace function public.mark_crucible_dm_read(p_other uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.direct_messages
  set read_at = now()
  where sender_id = p_other and recipient_id = auth.uid() and read_at is null;
$$;

grant execute on function public.mark_crucible_dm_read(uuid) to authenticated;
