-- CoupleSpace MVP PostgreSQL init (Tencent Cloud CVM local PostgreSQL)
-- Target DB/User: loveapp / loveuser
-- Execute with: psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/init.sql

create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  password_hash text not null,
  display_name text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  status text not null default 'open' check (status in ('open', 'full', 'archived')),
  created_by uuid not null references users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint couples_invite_code_format check (char_length(invite_code) between 6 and 12)
);

create table if not exists couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'partner' check (role in ('owner', 'partner')),
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id),
  unique (user_id)
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  uploaded_by uuid not null references users(id) on delete restrict,
  object_key text not null,
  image_url text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists diary_prompts (
  id bigserial primary key,
  prompt_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists diary_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references couples(id) on delete cascade,
  author_id uuid not null references users(id) on delete restrict,
  prompt_id bigint references diary_prompts(id) on delete set null,
  entry_date date not null,
  content text not null,
  visibility text not null default 'couple' check (visibility in ('couple')),
  created_at timestamptz not null default now()
);

create table if not exists pet_state (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references couples(id) on delete cascade,
  level integer not null default 1 check (level >= 1),
  growth_points integer not null default 0 check (growth_points >= 0),
  mood integer not null default 80 check (mood between 0 and 100),
  health integer not null default 100 check (health between 0 and 100),
  last_interaction_date date,
  current_stage text not null default 'egg',
  updated_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  user_id uuid not null references users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_couple_members_couple_id on couple_members(couple_id);
create index if not exists idx_photos_couple_id_created_at on photos(couple_id, created_at desc);
create index if not exists idx_diary_entries_couple_id_entry_date on diary_entries(couple_id, entry_date desc);
create index if not exists idx_pet_state_couple_id on pet_state(couple_id);
create index if not exists idx_sessions_token_hash on sessions(token_hash);
create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);

create or replace function enforce_couple_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_total integer;
begin
  select count(*) into member_total
  from couple_members
  where couple_id = new.couple_id;

  if member_total >= 2 then
    raise exception 'Couple is already full (max 2 members).';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_couple_member_limit on couple_members;
create trigger trg_enforce_couple_member_limit
before insert on couple_members
for each row execute function enforce_couple_member_limit();

create or replace function refresh_couple_status()
returns trigger
language plpgsql
as $$
declare
  target_couple_id uuid;
  member_total integer;
begin
  target_couple_id := coalesce(new.couple_id, old.couple_id);

  select count(*) into member_total
  from couple_members
  where couple_id = target_couple_id;

  update couples
  set status = case when member_total >= 2 then 'full' else 'open' end
  where id = target_couple_id
    and status <> 'archived';

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_couple_status_after_member_change on couple_members;
create trigger trg_refresh_couple_status_after_member_change
after insert or delete on couple_members
for each row execute function refresh_couple_status();

create or replace function initialize_pet_state()
returns trigger
language plpgsql
as $$
begin
  insert into pet_state(couple_id)
  values (new.id)
  on conflict (couple_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_initialize_pet_state on couples;
create trigger trg_initialize_pet_state
after insert on couples
for each row execute function initialize_pet_state();

create or replace function touch_pet_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_pet_state_updated_at on pet_state;
create trigger trg_touch_pet_state_updated_at
before update on pet_state
for each row execute function touch_pet_state_updated_at();

insert into diary_prompts (prompt_text, is_active)
select prompt_text, true
from (values
  ('今天最让你开心的一件小事是什么？'),
  ('如果给今天取一个电影名，你会叫它什么？'),
  ('今天你最想对我说的一句话是什么？'),
  ('我们下次约会最想尝试什么？'),
  ('今天你最感谢我的一件事是什么？')
) as seed(prompt_text)
where not exists (select 1 from diary_prompts);

-- Optional: create initial users by script using bcrypt hash from Node
-- node -e "const {hash}=require('bcryptjs');hash('your_password',12).then(v=>console.log(v))"
-- Then insert users manually:
-- insert into users (email, password_hash, display_name) values ('a@example.com','<bcrypt_hash>','A');
-- insert into users (email, password_hash, display_name) values ('b@example.com','<bcrypt_hash>','B');
