alter table public.profiles
  add column if not exists dm_mode text not null default 'requests'
    check (dm_mode in ('everyone','requests','nobody')),
  add column if not exists discoverable boolean not null default true;

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  message_type text not null default 'text' check (message_type in ('text','track','collab','moment','dna')),
  attachment_url text,
  request_state text not null default 'accepted' check (request_state in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint no_self_dm check (sender_id <> recipient_id)
);

create index if not exists direct_messages_sender_created_idx on public.direct_messages(sender_id, created_at desc);
create index if not exists direct_messages_recipient_created_idx on public.direct_messages(recipient_id, created_at desc);

alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from anon, authenticated;
grant select, insert, update on public.direct_messages to authenticated;

create policy "dm participants can read"
on public.direct_messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "sender can create dm"
on public.direct_messages for insert to authenticated
with check (auth.uid() = sender_id and sender_id <> recipient_id);

create policy "recipient can update dm request and read state"
on public.direct_messages for update to authenticated
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

create or replace function public.search_crucible_users(p_query text, p_limit int default 20)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  is_public boolean
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url,
         case when p.is_public then p.bio else null end,
         p.is_public
  from public.profiles p
  where p.discoverable = true
    and p.username is not null
    and p.id <> auth.uid()
    and lower(p.username) like '%' || lower(trim(coalesce(p_query,''))) || '%'
  order by case when lower(p.username) = lower(trim(coalesce(p_query,''))) then 0 else 1 end,
           p.username
  limit greatest(1, least(coalesce(p_limit,20),50));
$$;

grant execute on function public.search_crucible_users(text,int) to authenticated;

create or replace function public.get_crucible_profile(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  website text,
  profile_links jsonb,
  is_public boolean,
  dm_mode text
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.username, p.display_name, p.avatar_url,
         case when p.is_public or p.id = auth.uid() then p.bio else null end,
         case when p.is_public or p.id = auth.uid() then p.website else null end,
         case when p.is_public or p.id = auth.uid() then p.profile_links else '[]'::jsonb end,
         p.is_public,
         p.dm_mode
  from public.profiles p
  where lower(p.username) = lower(trim(p_username))
    and (p.discoverable = true or p.id = auth.uid())
  limit 1;
$$;

grant execute on function public.get_crucible_profile(text) to authenticated;

create or replace function public.send_crucible_dm(
  p_recipient uuid,
  p_body text,
  p_message_type text default 'text',
  p_attachment_url text default null
)
returns public.direct_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient_mode text;
  has_accepted_thread boolean;
  state text;
  row_out public.direct_messages;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_recipient = auth.uid() then raise exception 'NO_SELF_DM'; end if;
  if char_length(trim(coalesce(p_body,''))) < 1 or char_length(p_body) > 4000 then raise exception 'INVALID_MESSAGE'; end if;

  select dm_mode into recipient_mode from public.profiles where id = p_recipient;
  if recipient_mode is null or recipient_mode = 'nobody' then raise exception 'DMS_CLOSED'; end if;

  select exists(
    select 1 from public.direct_messages d
    where ((d.sender_id = auth.uid() and d.recipient_id = p_recipient)
       or (d.sender_id = p_recipient and d.recipient_id = auth.uid()))
      and d.request_state = 'accepted'
  ) into has_accepted_thread;

  state := case when recipient_mode = 'everyone' or has_accepted_thread then 'accepted' else 'pending' end;

  insert into public.direct_messages(sender_id, recipient_id, body, message_type, attachment_url, request_state)
  values (auth.uid(), p_recipient, trim(p_body), p_message_type, nullif(trim(coalesce(p_attachment_url,'')),''), state)
  returning * into row_out;
  return row_out;
end;
$$;

grant execute on function public.send_crucible_dm(uuid,text,text,text) to authenticated;

create or replace function public.respond_crucible_dm_request(p_sender uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.direct_messages
  set request_state = case when p_accept then 'accepted' else 'declined' end
  where recipient_id = auth.uid()
    and sender_id = p_sender
    and request_state = 'pending';
end;
$$;

grant execute on function public.respond_crucible_dm_request(uuid,boolean) to authenticated;
