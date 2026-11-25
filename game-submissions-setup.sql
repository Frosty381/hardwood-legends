-- CYBER community game submissions
-- Run this separately in Supabase SQL Editor.
-- Creates a private upload bucket and a private, owner-reviewed submission inbox.

create table if not exists public.cyber_game_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_title text not null check (char_length(game_title) between 3 and 60),
  description text not null default '' check (char_length(description) <= 1200),
  original_filename text not null check (char_length(original_filename) between 1 and 180),
  storage_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 26214400),
  file_extension text not null check (file_extension in ('html','htm','zip')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  review_note text not null default '' check (char_length(review_note) <= 1000),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists cyber_game_submissions_user_created_idx
  on public.cyber_game_submissions (user_id, created_at desc);
create index if not exists cyber_game_submissions_status_created_idx
  on public.cyber_game_submissions (status, created_at desc);

alter table public.cyber_game_submissions enable row level security;

drop policy if exists "CYBER players submit their own games" on public.cyber_game_submissions;
create policy "CYBER players submit their own games"
  on public.cyber_game_submissions for insert to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and reviewed_at is null
    and storage_path like auth.uid()::text || '/%'
  );

drop policy if exists "CYBER players view own game submissions" on public.cyber_game_submissions;
create policy "CYBER players view own game submissions"
  on public.cyber_game_submissions for select to authenticated
  using (
    user_id = auth.uid()
    or lower(coalesce(auth.jwt()->>'email','')) = 'inasi01@s.tatachilla.sa.edu.au'
  );

drop policy if exists "CYBER owner reviews game submissions" on public.cyber_game_submissions;
create policy "CYBER owner reviews game submissions"
  on public.cyber_game_submissions for update to authenticated
  using (lower(coalesce(auth.jwt()->>'email','')) = 'inasi01@s.tatachilla.sa.edu.au')
  with check (
    lower(coalesce(auth.jwt()->>'email','')) = 'inasi01@s.tatachilla.sa.edu.au'
    and status in ('pending','approved','rejected')
  );

grant select, insert, update on public.cyber_game_submissions to authenticated;

-- Private bucket; uploads are capped at 25 MiB and accept HTML or ZIP MIME types.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cyber-game-submissions',
  'cyber-game-submissions',
  false,
  26214400,
  array['text/html','application/zip']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = array['text/html','application/zip'];

drop policy if exists "CYBER players upload their own game files" on storage.objects;
create policy "CYBER players upload their own game files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'cyber-game-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (
      lower(storage.filename(name)) like '%.html'
      or lower(storage.filename(name)) like '%.htm'
      or lower(storage.filename(name)) like '%.zip'
    )
  );

drop policy if exists "CYBER players and owner read submitted game files" on storage.objects;
create policy "CYBER players and owner read submitted game files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'cyber-game-submissions'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or lower(coalesce(auth.jwt()->>'email','')) = 'inasi01@s.tatachilla.sa.edu.au'
    )
  );

drop policy if exists "CYBER players delete their own game files" on storage.objects;
create policy "CYBER players delete their own game files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cyber-game-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- The owner-only review inbox is restricted to inasi01@s.tatachilla.sa.edu.au.
-- Change that email in this file and game-submissions.html if the owner account differs.
-- Uploaded files remain private. Approval does not automatically publish or execute a game.
