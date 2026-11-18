-- CYBER administrator setup
-- Run this entire script in Supabase Dashboard > SQL Editor > New query.
-- It safely grants the admin role only to the existing account with this email.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

revoke all on function public.has_role(uuid, text) from public;
grant execute on function public.has_role(uuid, text) to authenticated;

drop policy if exists "Users can read their own role" on public.user_roles;
create policy "Users can read their own role"
on public.user_roles
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Admins can read all roles" on public.user_roles;
create policy "Admins can read all roles"
on public.user_roles
for select
to authenticated
using (public.has_role((select auth.uid()), 'admin'));

drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role((select auth.uid()), 'admin'))
with check (public.has_role((select auth.uid()), 'admin'));

-- Grant administrator to the specified account if it already exists in Supabase Auth.
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where lower(email) = lower('inasi01@s.tatachila.sa.edu.au')
on conflict (user_id) do update set role = 'admin';

-- Confirm the account exists and received the role.
select u.email, r.role
from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) = lower('inasi01@s.tatachila.sa.edu.au');
