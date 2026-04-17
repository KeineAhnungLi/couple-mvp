-- Extensions
create extension if not exists "pgcrypto";

-- Enums
create type public.couple_status as enum ('open', 'full', 'archived');
create type public.couple_member_role as enum ('owner', 'partner');
create type public.diary_visibility as enum ('couple');

-- Users profile table (linked to auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.couples (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique,
  status public.couple_status not null default 'open',
  created_by uuid not null references public.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint couples_invite_code_format check (char_length(invite_code) between 6 and 12)
);

create table public.couple_members (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role public.couple_member_role not null default 'partner',
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id),
  unique (user_id)
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploaded_by uuid not null references public.users(id) on delete restrict,
  image_url text not null,
  caption text,
  taken_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.diary_prompts (
  id bigserial primary key,
  prompt_text text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete restrict,
  prompt_id bigint references public.diary_prompts(id) on delete set null,
  entry_date date not null,
  content text not null,
  visibility public.diary_visibility not null default 'couple',
  created_at timestamptz not null default now(),
  unique (couple_id, author_id, entry_date)
);

create table public.pet_state (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null unique references public.couples(id) on delete cascade,
  level integer not null default 1,
  growth_points integer not null default 0,
  mood integer not null default 80,
  health integer not null default 100,
  last_interaction_date date,
  current_stage text not null default 'egg',
  updated_at timestamptz not null default now(),
  constraint pet_state_level_non_negative check (level >= 1),
  constraint pet_state_growth_non_negative check (growth_points >= 0),
  constraint pet_state_mood_range check (mood between 0 and 100),
  constraint pet_state_health_range check (health between 0 and 100)
);

create index idx_couple_members_couple_id on public.couple_members(couple_id);
create index idx_photos_couple_id_created_at on public.photos(couple_id, created_at desc);
create index idx_diary_entries_couple_id_entry_date on public.diary_entries(couple_id, entry_date desc);
create index idx_pet_state_couple_id on public.pet_state(couple_id);

-- Helper function for RLS
create or replace function public.is_couple_member(target_couple_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.couple_members cm
    where cm.couple_id = target_couple_id
      and cm.user_id = auth.uid()
  );
$$;

-- Keep profile row synced with auth.users
create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users(id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_auth_user_created();

-- Couple members max = 2
create or replace function public.enforce_couple_member_limit()
returns trigger
language plpgsql
as $$
declare
  member_total integer;
begin
  select count(*) into member_total
  from public.couple_members
  where couple_id = new.couple_id;

  if member_total >= 2 then
    raise exception 'Couple is already full (max 2 members).';
  end if;

  return new;
end;
$$;

create trigger trg_enforce_couple_member_limit
before insert on public.couple_members
for each row execute function public.enforce_couple_member_limit();

-- Keep couples.status aligned with member count
create or replace function public.refresh_couple_status()
returns trigger
language plpgsql
as $$
declare
  target_couple_id uuid;
  member_total integer;
begin
  target_couple_id := coalesce(new.couple_id, old.couple_id);

  select count(*) into member_total
  from public.couple_members
  where couple_id = target_couple_id;

  update public.couples
  set status = case when member_total >= 2 then 'full'::public.couple_status else 'open'::public.couple_status end
  where id = target_couple_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_refresh_couple_status_after_member_change
after insert or delete on public.couple_members
for each row execute function public.refresh_couple_status();

-- Initialize pet state per couple
create or replace function public.initialize_pet_state()
returns trigger
language plpgsql
as $$
begin
  insert into public.pet_state(couple_id)
  values (new.id)
  on conflict (couple_id) do nothing;

  return new;
end;
$$;

create trigger trg_initialize_pet_state
after insert on public.couples
for each row execute function public.initialize_pet_state();

-- Auto update pet_state.updated_at
create or replace function public.touch_pet_state_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_touch_pet_state_updated_at
before update on public.pet_state
for each row execute function public.touch_pet_state_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.photos enable row level security;
alter table public.diary_prompts enable row level security;
alter table public.diary_entries enable row level security;
alter table public.pet_state enable row level security;

-- users
create policy "Users can read own profile"
on public.users for select
using (id = auth.uid());

create policy "Users can update own profile"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

-- couples
create policy "Members can read own couple"
on public.couples for select
using (public.is_couple_member(id));

create policy "Authenticated user can create couple"
on public.couples for insert
with check (created_by = auth.uid());

create policy "Members can update own couple"
on public.couples for update
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

-- couple_members
create policy "Members can read member list of own couple"
on public.couple_members for select
using (public.is_couple_member(couple_id));

create policy "Users can insert self into open couple"
on public.couple_members for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.couples c
    where c.id = couple_id
      and c.status = 'open'
  )
);

-- photos
create policy "Members can read photos of own couple"
on public.photos for select
using (public.is_couple_member(couple_id));

create policy "Members can insert photos for own couple"
on public.photos for insert
with check (
  public.is_couple_member(couple_id)
  and uploaded_by = auth.uid()
);

create policy "Uploader can update own photo"
on public.photos for update
using (uploaded_by = auth.uid() and public.is_couple_member(couple_id))
with check (uploaded_by = auth.uid() and public.is_couple_member(couple_id));

create policy "Uploader can delete own photo"
on public.photos for delete
using (uploaded_by = auth.uid() and public.is_couple_member(couple_id));

-- diary prompts
create policy "Authenticated users can read prompts"
on public.diary_prompts for select
to authenticated
using (true);

-- diary entries
create policy "Members can read diary entries of own couple"
on public.diary_entries for select
using (public.is_couple_member(couple_id));

create policy "Members can insert diary entries for own couple"
on public.diary_entries for insert
with check (
  public.is_couple_member(couple_id)
  and author_id = auth.uid()
);

create policy "Author can update own diary entry"
on public.diary_entries for update
using (author_id = auth.uid() and public.is_couple_member(couple_id))
with check (author_id = auth.uid() and public.is_couple_member(couple_id));

create policy "Author can delete own diary entry"
on public.diary_entries for delete
using (author_id = auth.uid() and public.is_couple_member(couple_id));

-- pet state
create policy "Members can read pet state of own couple"
on public.pet_state for select
using (public.is_couple_member(couple_id));

create policy "Members can update pet state of own couple"
on public.pet_state for update
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));

-- Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('couple-photos', 'couple-photos', false)
on conflict (id) do nothing;

create policy "Members can read own couple storage objects"
on storage.objects for select
to authenticated
using (
  bucket_id = 'couple-photos'
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
);

create policy "Members can upload to own couple storage path"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'couple-photos'
  and owner = auth.uid()
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
);

create policy "Owners can update own storage objects"
on storage.objects for update
to authenticated
using (
  bucket_id = 'couple-photos'
  and owner = auth.uid()
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
)
with check (
  bucket_id = 'couple-photos'
  and owner = auth.uid()
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
);

create policy "Owners can delete own storage objects"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'couple-photos'
  and owner = auth.uid()
  and public.is_couple_member((storage.foldername(name))[1]::uuid)
);

-- Seed prompt mock data
insert into public.diary_prompts (prompt_text, is_active)
values
  ('今天最让你开心的一件小事是什么？', true),
  ('如果给今天取一个电影名，你会叫它什么？', true),
  ('今天你最想对我说的一句话是什么？', true),
  ('我们下次约会最想尝试什么？', true),
  ('今天你最感谢我的一件事是什么？', true);

