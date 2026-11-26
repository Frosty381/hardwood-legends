-- CYBER account-wide game saves
-- Run this once in Supabase SQL Editor for project izixnrbnmqurmmywxefu.
create table if not exists public.cyber_player_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cyber_player_saves enable row level security;

drop policy if exists "Players can read their own CYBER save" on public.cyber_player_saves;
create policy "Players can read their own CYBER save"
  on public.cyber_player_saves for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Players can insert their own CYBER save" on public.cyber_player_saves;
create policy "Players can insert their own CYBER save"
  on public.cyber_player_saves for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Players can update their own CYBER save" on public.cyber_player_saves;
create policy "Players can update their own CYBER save"
  on public.cyber_player_saves for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.cyber_player_saves to authenticated;
