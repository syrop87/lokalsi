-- F-01: first table, carries the author-only RLS pattern reused by later slices.
--
-- Rules: a row belongs to auth.uid(); any logged-in user may read; only the owner
-- may update; nobody inserts or deletes through the API (a trigger creates the row,
-- deleting the auth user cascades to it); anonymous users get no access at all.
--
-- Manual rollback (schema changes are NOT undone by `wrangler rollback`):
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user();
--   drop table if exists public.profiles;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- No insert/delete policy for authenticated and no policy of any kind for anon:
-- with RLS enabled, missing policies mean those operations are denied.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
