-- Add trash/comments/reminders/pet-interactions features to existing DB.
-- Execute with:
-- psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_social_reminder_pet_trash.sql

alter table if exists photos
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references users(id) on delete set null,
  add column if not exists purge_at timestamptz;

alter table if exists diary_entries
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references users(id) on delete set null,
  add column if not exists purge_at timestamptz;

create table if not exists diary_comments (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references diary_entries(id) on delete cascade,
  couple_id uuid not null references couples(id) on delete cascade,
  author_id uuid not null references users(id) on delete restrict,
  content text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  created_by uuid not null references users(id) on delete restrict,
  title text not null,
  note text,
  remind_at timestamptz not null,
  is_done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

alter table if exists reminders
  add column if not exists in_app_notified_at timestamptz,
  add column if not exists web_push_notified_at timestamptz;

create table if not exists pet_interactions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references users(id) on delete restrict,
  action_type text not null,
  growth_delta integer not null default 0,
  mood_delta integer not null default 0,
  health_delta integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_photos_couple_id_deleted_at on photos(couple_id, deleted_at);
create index if not exists idx_diary_entries_couple_id_deleted_at on diary_entries(couple_id, deleted_at);
create index if not exists idx_diary_comments_entry_id_created_at on diary_comments(entry_id, created_at);
create index if not exists idx_reminders_couple_id_remind_at on reminders(couple_id, remind_at);
create index if not exists idx_reminders_couple_id_done on reminders(couple_id, is_done);
create index if not exists idx_reminders_couple_id_due_in_app on reminders(couple_id, is_done, remind_at, in_app_notified_at);
create index if not exists idx_reminders_couple_id_due_push on reminders(couple_id, is_done, remind_at, web_push_notified_at);
create index if not exists idx_pet_interactions_couple_id_created_at on pet_interactions(couple_id, created_at desc);

create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user_id_active on push_subscriptions(user_id, is_active);
