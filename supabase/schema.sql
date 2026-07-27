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

-- Lesson reminders (push notifications) — see
-- docs/architecture.md#lesson-reminders for what these back and how the
-- send-lesson-reminders edge function uses them.

create table if not exists notification_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  enabled boolean not null default false,
  daily_lesson_goal int not null default 1 check (daily_lesson_goal >= 1),
  max_reminders_per_day int not null default 3 check (max_reminders_per_day between 1 and 10),
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;

create policy "own row only" on notification_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per subscribed browser/device (a user can have several). `endpoint`
-- plus the two keys are exactly what the browser's PushManager.subscribe()
-- returns — see src/hooks/usePushSubscription.js.
create table if not exists push_subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

create policy "own rows only" on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- One row per reminder actually sent, written only by the edge function
-- (via the service role key, which bypasses RLS) so a user can't spoof or
-- suppress their own send history. Used to cap and space out reminders —
-- see send-lesson-reminders/index.ts.
create table if not exists notification_sends (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now()
);

create index if not exists notification_sends_user_id_sent_at_idx on notification_sends (user_id, sent_at desc);

alter table notification_sends enable row level security;

create policy "select own sends" on notification_sends
  for select
  using (auth.uid() = user_id);

-- Not run by the block above — fill in the two placeholders and run this
-- separately, once, after `supabase functions deploy send-lesson-reminders`
-- (see docs/architecture.md#lesson-reminders). Schedules the edge function
-- every 15 minutes; it's a no-op run for any user who isn't due a reminder
-- yet, so this cadence is just how fine-grained the spacing between
-- reminders can be, not how often anyone actually gets pushed.
--
-- create extension if not exists pg_cron with schema extensions;
-- create extension if not exists pg_net with schema extensions;
--
-- select cron.schedule(
--   'send-lesson-reminders',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/send-lesson-reminders',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer <service-role-key>',
--       'Content-Type', 'application/json'
--     )
--   );
--   $$
-- );
