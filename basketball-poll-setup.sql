-- CYBER basketball game poll
-- Run this once in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.cyber_basketball_poll_votes (
  voter_id uuid primary key,
  game_id text not null check (game_id in ('mba-2k-27', 'hardwood-27', 'courtside-27')),
  created_at timestamptz not null default now()
);

alter table public.cyber_basketball_poll_votes enable row level security;

grant select, insert on public.cyber_basketball_poll_votes to anon, authenticated;

drop policy if exists "Anyone can view basketball poll votes" on public.cyber_basketball_poll_votes;
create policy "Anyone can view basketball poll votes"
on public.cyber_basketball_poll_votes
for select
to anon, authenticated
using (true);

drop policy if exists "Visitors can submit basketball poll vote" on public.cyber_basketball_poll_votes;
create policy "Visitors can submit basketball poll vote"
on public.cyber_basketball_poll_votes
for insert
to anon, authenticated
with check (true);
