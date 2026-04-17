# Step 1 Architecture Notes

## Directory Layout

```text
src/
  app/
    (auth)/login
    (app)/
      page.tsx
      photos/
      diary/
      pet/
    auth/callback/route.ts
    onboarding/
    invite/[code]/
  components/
    bottom-nav.tsx
  lib/
    auth.ts
    navigation.ts
    data/
      dashboard.ts
      prompts.ts
    supabase/
      client.ts
      server.ts
      middleware.ts
  types/
    database.ts
    domain.ts
supabase/
  migrations/
    20260417090000_init_mvp.sql
```

## RLS Core Rules

1. Every business table includes `couple_id`.
2. Access checks use `public.is_couple_member(couple_id)`.
3. Writes additionally check ownership:
   - `photos.uploaded_by = auth.uid()`
   - `diary_entries.author_id = auth.uid()`
4. Couple membership hard limit is enforced in DB trigger (`max 2`).
5. Storage path convention is `{couple_id}/{user_id}/...` and policy validates couple membership at DB layer.

## Route Map

- `/login`: OTP login
- `/auth/callback`: Supabase auth callback
- `/onboarding`: create or join couple space
- `/invite/[code]`: quick join by invite code
- `/`: dashboard home
- `/photos`: upload and list
- `/photos/[photoId]`: photo detail
- `/diary`: today prompt + history
- `/pet`: pet state

