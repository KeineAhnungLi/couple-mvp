-- Basic RLS example for core business tables
-- Tables: couples, couple_members, photos, diary_entries, pet_state

-- Helper function used by policies
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

-- Enable RLS
alter table public.couples enable row level security;
alter table public.couple_members enable row level security;
alter table public.photos enable row level security;
alter table public.diary_entries enable row level security;
alter table public.pet_state enable row level security;

-- couples
-- Read/update only your own couple; create only for yourself.
drop policy if exists "Members can read own couple" on public.couples;
create policy "Members can read own couple"
on public.couples for select
using (public.is_couple_member(id));

drop policy if exists "Authenticated user can create couple" on public.couples;
create policy "Authenticated user can create couple"
on public.couples for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Members can update own couple" on public.couples;
create policy "Members can update own couple"
on public.couples for update
using (public.is_couple_member(id))
with check (public.is_couple_member(id));

-- couple_members
-- Read member list for your own couple.
drop policy if exists "Members can read member list of own couple" on public.couple_members;
create policy "Members can read member list of own couple"
on public.couple_members for select
using (public.is_couple_member(couple_id));

-- Join only as yourself and only if couple is still open.
drop policy if exists "Users can insert self into open couple" on public.couple_members;
create policy "Users can insert self into open couple"
on public.couple_members for insert
to authenticated
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
-- Read/write photos only within your couple; uploader owns update/delete.
drop policy if exists "Members can read photos of own couple" on public.photos;
create policy "Members can read photos of own couple"
on public.photos for select
using (public.is_couple_member(couple_id));

drop policy if exists "Members can insert photos for own couple" on public.photos;
create policy "Members can insert photos for own couple"
on public.photos for insert
to authenticated
with check (
  public.is_couple_member(couple_id)
  and uploaded_by = auth.uid()
);

drop policy if exists "Uploader can update own photo" on public.photos;
create policy "Uploader can update own photo"
on public.photos for update
using (uploaded_by = auth.uid() and public.is_couple_member(couple_id))
with check (uploaded_by = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists "Uploader can delete own photo" on public.photos;
create policy "Uploader can delete own photo"
on public.photos for delete
using (uploaded_by = auth.uid() and public.is_couple_member(couple_id));

-- diary_entries
-- Read/write diary only within your couple; author owns update/delete.
drop policy if exists "Members can read diary entries of own couple" on public.diary_entries;
create policy "Members can read diary entries of own couple"
on public.diary_entries for select
using (public.is_couple_member(couple_id));

drop policy if exists "Members can insert diary entries for own couple" on public.diary_entries;
create policy "Members can insert diary entries for own couple"
on public.diary_entries for insert
to authenticated
with check (
  public.is_couple_member(couple_id)
  and author_id = auth.uid()
);

drop policy if exists "Author can update own diary entry" on public.diary_entries;
create policy "Author can update own diary entry"
on public.diary_entries for update
using (author_id = auth.uid() and public.is_couple_member(couple_id))
with check (author_id = auth.uid() and public.is_couple_member(couple_id));

drop policy if exists "Author can delete own diary entry" on public.diary_entries;
create policy "Author can delete own diary entry"
on public.diary_entries for delete
using (author_id = auth.uid() and public.is_couple_member(couple_id));

-- pet_state
-- Shared resource for the two members in one couple.
drop policy if exists "Members can read pet state of own couple" on public.pet_state;
create policy "Members can read pet state of own couple"
on public.pet_state for select
using (public.is_couple_member(couple_id));

drop policy if exists "Members can update pet state of own couple" on public.pet_state;
create policy "Members can update pet state of own couple"
on public.pet_state for update
using (public.is_couple_member(couple_id))
with check (public.is_couple_member(couple_id));
