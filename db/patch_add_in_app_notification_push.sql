-- Add in-page reminder notification columns and reserve web push subscription table.
-- Execute with:
-- psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_in_app_notification_push.sql

alter table if exists reminders
  add column if not exists in_app_notified_at timestamptz,
  add column if not exists web_push_notified_at timestamptz;

create index if not exists idx_reminders_couple_id_due_in_app
  on reminders(couple_id, is_done, remind_at, in_app_notified_at);

create index if not exists idx_reminders_couple_id_due_push
  on reminders(couple_id, is_done, remind_at, web_push_notified_at);

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

create index if not exists idx_push_subscriptions_user_id_active
  on push_subscriptions(user_id, is_active);

