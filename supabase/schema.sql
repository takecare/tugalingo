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
