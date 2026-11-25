-- CYBER Friends & Chat: one-time database setup
-- Run this entire file in your Supabase project's SQL Editor.
-- Uses the existing CYBER Supabase Auth project. Never put a service-role key in the website.

create table if not exists public.cyber_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '' check (char_length(display_name) <= 28),
  created_at timestamptz not null default now()
);
create unique index if not exists cyber_profiles_username_lower_uq
  on public.cyber_profiles (lower(username));

create table if not exists public.cyber_friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  constraint cyber_friend_requests_no_self check (sender_id <> receiver_id)
);
create unique index if not exists cyber_friend_requests_one_active_pair
  on public.cyber_friend_requests (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id)
  )
  where status in ('pending','accepted');

create table if not exists public.cyber_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint cyber_blocks_no_self check (blocker_id <> blocked_id)
);

create table if not exists public.cyber_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 800),
  created_at timestamptz not null default now(),
  constraint cyber_messages_no_self check (sender_id <> receiver_id)
);
create index if not exists cyber_messages_conversation_idx
  on public.cyber_messages (sender_id, receiver_id, created_at desc);
create index if not exists cyber_messages_inbox_idx
  on public.cyber_messages (receiver_id, created_at desc);

create table if not exists public.cyber_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 80),
  details text not null default '' check (char_length(details) <= 500),
  created_at timestamptz not null default now(),
  constraint cyber_reports_no_self check (reporter_id <> reported_user_id)
);

-- Automatically create a private username profile for new CYBER accounts.
create or replace function public.cyber_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.cyber_profiles (id, username, display_name)
  values (
    new.id,
    'player_' || left(replace(new.id::text, '-', ''), 8),
    ''
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists cyber_auth_user_profile on auth.users;
create trigger cyber_auth_user_profile
  after insert on auth.users
  for each row execute procedure public.cyber_create_profile_for_new_user();

-- Add profiles for existing CYBER accounts too.
insert into public.cyber_profiles (id, username, display_name)
select
  u.id,
  'player_' || left(replace(u.id::text, '-', ''), 8),
  ''
from auth.users u
on conflict (id) do nothing;

-- Security-definer helper checks blocks in both directions without exposing
-- the block list to other users.
create or replace function public.cyber_is_blocked(p_other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cyber_blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = p_other)
       or (b.blocker_id = p_other and b.blocked_id = auth.uid())
  );
$$;
revoke all on function public.cyber_is_blocked(uuid) from public;
grant execute on function public.cyber_is_blocked(uuid) to authenticated;

-- Prevent participants from changing who a request is between or reopening
-- a request after it has already been accepted/declined.
create or replace function public.cyber_guard_friend_request_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.sender_id <> new.sender_id or old.receiver_id <> new.receiver_id or old.id <> new.id then
    raise exception 'Friend request participants cannot be changed.';
  end if;
  if old.status <> 'pending' or new.status not in ('accepted','declined') then
    raise exception 'Only a pending request can be accepted or declined.';
  end if;
  return new;
end;
$$;

drop trigger if exists cyber_friend_request_guard on public.cyber_friend_requests;
create trigger cyber_friend_request_guard
  before update on public.cyber_friend_requests
  for each row execute procedure public.cyber_guard_friend_request_update();

-- Basic anti-spam guard: at most 8 messages per account in a rolling 10 seconds.
create or replace function public.cyber_limit_message_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.sender_id::text, 0));
  select count(*) into recent_count
  from public.cyber_messages
  where sender_id = new.sender_id
    and created_at > now() - interval '10 seconds';
  if recent_count >= 8 then
    raise exception 'You are sending messages too quickly. Please wait a moment.';
  end if;
  return new;
end;
$$;

drop trigger if exists cyber_message_rate_guard on public.cyber_messages;
create trigger cyber_message_rate_guard
  before insert on public.cyber_messages
  for each row execute procedure public.cyber_limit_message_rate();

alter table public.cyber_profiles enable row level security;
alter table public.cyber_friend_requests enable row level security;
alter table public.cyber_blocks enable row level security;
alter table public.cyber_messages enable row level security;
alter table public.cyber_reports enable row level security;

-- Profiles: the signed-in CYBER player directory contains usernames only, never email.
drop policy if exists "cyber profiles readable by signed-in users" on public.cyber_profiles;
create policy "cyber profiles readable by signed-in users"
  on public.cyber_profiles for select to authenticated
  using (auth.uid() is not null);

drop policy if exists "cyber users create own profile" on public.cyber_profiles;
create policy "cyber users create own profile"
  on public.cyber_profiles for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "cyber users update own profile" on public.cyber_profiles;
create policy "cyber users update own profile"
  on public.cyber_profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Friend requests: only the two participants can read/delete; only the recipient
-- can accept or decline; a request cannot be sent across an existing block.
drop policy if exists "cyber participants read friend requests" on public.cyber_friend_requests;
create policy "cyber participants read friend requests"
  on public.cyber_friend_requests for select to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

drop policy if exists "cyber users send friend requests" on public.cyber_friend_requests;
create policy "cyber users send friend requests"
  on public.cyber_friend_requests for insert to authenticated
  with check (
    sender_id = auth.uid()
    and receiver_id <> auth.uid()
    and not public.cyber_is_blocked(receiver_id)
  );

drop policy if exists "cyber recipient responds to request" on public.cyber_friend_requests;
create policy "cyber recipient responds to request"
  on public.cyber_friend_requests for update to authenticated
  using (receiver_id = auth.uid() and status = 'pending')
  with check (receiver_id = auth.uid() and status in ('accepted','declined'));

drop policy if exists "cyber participants remove friend request" on public.cyber_friend_requests;
create policy "cyber participants remove friend request"
  on public.cyber_friend_requests for delete to authenticated
  using (sender_id = auth.uid() or receiver_id = auth.uid());

-- Blocks are private to the person who created them.
drop policy if exists "cyber users read own blocks" on public.cyber_blocks;
create policy "cyber users read own blocks"
  on public.cyber_blocks for select to authenticated
  using (blocker_id = auth.uid());

drop policy if exists "cyber users block others" on public.cyber_blocks;
create policy "cyber users block others"
  on public.cyber_blocks for insert to authenticated
  with check (blocker_id = auth.uid() and blocked_id <> auth.uid());

drop policy if exists "cyber users unblock others" on public.cyber_blocks;
create policy "cyber users unblock others"
  on public.cyber_blocks for delete to authenticated
  using (blocker_id = auth.uid());

-- Direct messages: only accepted friends can read/send; either-direction blocks
-- immediately prevent access. No public/group chat is created.
drop policy if exists "cyber friends read direct messages" on public.cyber_messages;
create policy "cyber friends read direct messages"
  on public.cyber_messages for select to authenticated
  using (
    (sender_id = auth.uid() or receiver_id = auth.uid())
    and exists (
      select 1 from public.cyber_friend_requests f
      where f.status = 'accepted'
        and (
          (f.sender_id = auth.uid() and f.receiver_id = case when cyber_messages.sender_id = auth.uid() then cyber_messages.receiver_id else cyber_messages.sender_id end)
          or
          (f.receiver_id = auth.uid() and f.sender_id = case when cyber_messages.sender_id = auth.uid() then cyber_messages.receiver_id else cyber_messages.sender_id end)
        )
    )
    and not public.cyber_is_blocked(
      case when cyber_messages.sender_id = auth.uid() then cyber_messages.receiver_id else cyber_messages.sender_id end
    )
  );

drop policy if exists "cyber friends send direct messages" on public.cyber_messages;
create policy "cyber friends send direct messages"
  on public.cyber_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and receiver_id <> auth.uid()
    and exists (
      select 1 from public.cyber_friend_requests f
      where f.status = 'accepted'
        and (
          (f.sender_id = auth.uid() and f.receiver_id = cyber_messages.receiver_id)
          or (f.receiver_id = auth.uid() and f.sender_id = cyber_messages.receiver_id)
        )
    )
    and not public.cyber_is_blocked(receiver_id)
  );

-- Reports are private to their reporter. They are stored for the site owner to review.
drop policy if exists "cyber users submit reports" on public.cyber_reports;
create policy "cyber users submit reports"
  on public.cyber_reports for insert to authenticated
  with check (reporter_id = auth.uid() and reported_user_id <> auth.uid());

drop policy if exists "cyber users read own reports" on public.cyber_reports;
create policy "cyber users read own reports"
  on public.cyber_reports for select to authenticated
  using (reporter_id = auth.uid());

-- Include old/new fields so realtime filters also work for deletions and status updates.
alter table public.cyber_messages replica identity full;
alter table public.cyber_friend_requests replica identity full;

-- Private WebRTC call signalling. The topic contains only the two friend IDs;
-- both participants must be accepted friends and neither may have blocked the other.
alter table realtime.messages enable row level security;

drop policy if exists "CYBER friends receive private call signals" on realtime.messages;
create policy "CYBER friends receive private call signals"
  on realtime.messages for select to authenticated
  using (
    extension = 'broadcast'
    and realtime.topic() ~ '^cyber-call:(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_messages'
    ) then
      alter publication supabase_realtime add table public.cyber_messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_friend_requests'
    ) then
      alter publication supabase_realtime add table public.cyber_friend_requests;
    end if;
  end if;
end;
$$;

grant select, insert, update on public.cyber_profiles to authenticated;
grant select, insert, update, delete on public.cyber_friend_requests to authenticated;
grant select, insert, delete on public.cyber_blocks to authenticated;
grant select, insert on public.cyber_messages to authenticated;
grant select, insert on public.cyber_reports to authenticated;

-- Setup complete. Run social.html after this script succeeds.

    and auth.uid()::text in (split_part(realtime.topic(), ':', 2), split_part(realtime.topic(), ':', 3))
    and exists (
      select 1 from public.cyber_friend_requests f
      where f.status = 'accepted'
        and (
          (f.sender_id = split_part(realtime.topic(), ':', 2)::uuid and f.receiver_id = split_part(realtime.topic(), ':', 3)::uuid)
          or
          (f.receiver_id = split_part(realtime.topic(), ':', 2)::uuid and f.sender_id = split_part(realtime.topic(), ':', 3)::uuid)
        )
    )
    and not public.cyber_is_blocked(
      case
        when split_part(realtime.topic(), ':', 2) = auth.uid()::text
          then split_part(realtime.topic(), ':', 3)::uuid
        else split_part(realtime.topic(), ':', 2)::uuid
      end
    )
  );

drop policy if exists "CYBER friends send private call signals" on realtime.messages;
create policy "CYBER friends send private call signals"
  on realtime.messages for insert to authenticated
  with check (
    extension = 'broadcast'
    and realtime.topic() ~ '^cyber-call:(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_messages'
    ) then
      alter publication supabase_realtime add table public.cyber_messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_friend_requests'
    ) then
      alter publication supabase_realtime add table public.cyber_friend_requests;
    end if;
  end if;
end;
$$;

grant select, insert, update on public.cyber_profiles to authenticated;
grant select, insert, update, delete on public.cyber_friend_requests to authenticated;
grant select, insert, delete on public.cyber_blocks to authenticated;
grant select, insert on public.cyber_messages to authenticated;
grant select, insert on public.cyber_reports to authenticated;

-- Setup complete. Run social.html after this script succeeds.

    and auth.uid()::text in (split_part(realtime.topic(), ':', 2), split_part(realtime.topic(), ':', 3))
    and exists (
      select 1 from public.cyber_friend_requests f
      where f.status = 'accepted'
        and (
          (f.sender_id = split_part(realtime.topic(), ':', 2)::uuid and f.receiver_id = split_part(realtime.topic(), ':', 3)::uuid)
          or
          (f.receiver_id = split_part(realtime.topic(), ':', 2)::uuid and f.sender_id = split_part(realtime.topic(), ':', 3)::uuid)
        )
    )
    and not public.cyber_is_blocked(
      case
        when split_part(realtime.topic(), ':', 2) = auth.uid()::text
          then split_part(realtime.topic(), ':', 3)::uuid
        else split_part(realtime.topic(), ':', 2)::uuid
      end
    )
  );

-- Enable realtime updates for incoming messages and friend-request changes.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_messages'
    ) then
      alter publication supabase_realtime add table public.cyber_messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'cyber_friend_requests'
    ) then
      alter publication supabase_realtime add table public.cyber_friend_requests;
    end if;
  end if;
end;
$$;

grant select, insert, update on public.cyber_profiles to authenticated;
grant select, insert, update, delete on public.cyber_friend_requests to authenticated;
grant select, insert, delete on public.cyber_blocks to authenticated;
grant select, insert on public.cyber_messages to authenticated;
grant select, insert on public.cyber_reports to authenticated;

-- Setup complete. Run social.html after this script succeeds.
