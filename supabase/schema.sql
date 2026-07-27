-- Run this once in the Supabase project's SQL Editor (Project -> SQL Editor -> New query).
-- See docs/architecture.md#accounts--cloud-progress-sync for what this backs.

create table if not exists progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  history jsonb not null default '[]',
  activity_by_date jsonb not null default '{}',
  timezone text not null default 'Europe/Lisbon',
  updated_at timestamptz not null default now()
);

alter table progress enable row level security;

create policy "own row only" on progress
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Roles + question-bank content — see docs/architecture.md#content-studio.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'regular' check (role in ('regular', 'admin')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "select own profile" on profiles
  for select
  using (auth.uid() = id);

-- Auto-provision a 'regular' profile row the moment someone signs up, so
-- there's never a gap where a signed-in user has no role row yet.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill: anyone who signed up before this trigger existed has no profiles
-- row yet. Safe to re-run.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

-- security definer so this can read profiles regardless of the caller's own
-- row-level access, without content_items' write policy recursing into
-- profiles' own RLS.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- One row per word/verb/compound/phrase entry. `data` holds the exact same
-- shape as the old src/data/*.json entries (see docs/data-model.md); `kind`
-- and `level` are pulled out as real columns purely so the game and the
-- studio can filter without unpacking jsonb every time.
create table if not exists content_items (
  kind text not null check (kind in ('words', 'verbs', 'compounds', 'phrases')),
  id text not null,
  level int not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (kind, id)
);

alter table content_items enable row level security;

create policy "authenticated can read" on content_items
  for select
  to authenticated
  using (true);

create policy "admins can write" on content_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- To grant admin (there's no in-app way to do this — see
-- docs/architecture.md#content-studio): the target account must have signed
-- in for real at least once first (auth.users row must exist), then:
--   insert into profiles (id, role) values ('<uid>', 'admin')
--   on conflict (id) do update set role = 'admin';
