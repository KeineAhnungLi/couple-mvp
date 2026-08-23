-- Add private user-scoped footprint journal tables.
-- Execute with:
-- psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_footprint_journal.sql

create extension if not exists pgcrypto;

create table if not exists footprint_trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  title text not null,
  start_date date not null,
  end_date date not null,
  province text,
  city text,
  overall_mood text,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint footprint_trips_date_range check (end_date >= start_date)
);

create table if not exists footprint_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  trip_id uuid references footprint_trips(id) on delete set null,
  captured_at timestamptz not null default now(),
  latitude double precision,
  longitude double precision,
  country text not null default '中国',
  province text,
  city text,
  district text,
  place_name text,
  mood text,
  note text,
  tags text[] not null default '{}',
  is_special boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint footprint_entries_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint footprint_entries_longitude_range check (longitude is null or longitude between -180 and 180)
);

create table if not exists footprint_entry_photos (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references footprint_entries(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  object_key text not null,
  image_url text not null,
  sort_order integer not null default 0,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_footprint_entries_user_captured_at
  on footprint_entries(user_id, captured_at desc);

create index if not exists idx_footprint_entries_user_city
  on footprint_entries(user_id, city);

create index if not exists idx_footprint_entries_user_trip
  on footprint_entries(user_id, trip_id);

create index if not exists idx_footprint_trips_user_dates
  on footprint_trips(user_id, start_date, end_date);

create index if not exists idx_footprint_photos_entry_sort
  on footprint_entry_photos(entry_id, sort_order, created_at);
