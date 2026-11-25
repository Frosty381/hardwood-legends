-- CYBER submission bucket repair
-- Run this in the CYBER Supabase SQL Editor if the upload page says "Bucket not found".
-- Safe to run more than once.

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
  name = excluded.name,
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
      or lower(coalesce(auth.jwt()->>'email','')) = 'inasi01@s.tatachila.sa.edu.au'
    )
  );

drop policy if exists "CYBER players delete their own game files" on storage.objects;
create policy "CYBER players delete their own game files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'cyber-game-submissions'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Verify the bucket now exists:
select id, name, public, file_size_limit
from storage.buckets
where id = 'cyber-game-submissions';
