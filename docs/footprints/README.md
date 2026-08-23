# 妈妈的足迹手账 — MVP implementation

This module is added to the existing `couple-mvp` Next.js application so it can reuse the current domain, PostgreSQL, account/session system and Tencent COS/CDN configuration.

## Routes

- `/footprints` — 手账总览：首页摘要、地图预览、最近记录
- `/footprints/map` — 足迹地图
- `/footprints/calendar` — 旅行日历
- `/footprints/new` — 记一页
- `/footprints/memories` — 那年今日、时间线、年度回顾
- `/footprints/profile` — 我的

The footprint module has its own visual shell and bottom navigation, so it does not inherit the CoupleSpace header/navigation.

## Authentication

Footprints are **user-scoped**, not couple-scoped. A normal existing `users` account is enough; the account does not need to join a CoupleSpace couple.

`/login?next=/footprints` is now supported. This is important for a dedicated account used only by the footprint journal.

## Database migration

Run before deploying the code:

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" \
  -f db/patch_add_footprint_journal.sql
```

Tables:

- `footprint_entries`
- `footprint_entry_photos`
- `footprint_trips`

The database stores the original browser GPS coordinates. It does **not** persist AMap geocoder/POI results.

## AMap

Set these build-time environment variables:

```bash
NEXT_PUBLIC_AMAP_KEY=your_web_js_key
NEXT_PUBLIC_AMAP_SECURITY_JS_CODE=your_security_js_code
```

If the key is not configured, the UI renders a paper-style fallback map so development remains usable.

When AMap is configured, the client converts the stored WGS84 browser GPS coordinates to AMap coordinates at render time using `AMap.convertFrom(..., "gps")`. Converted coordinates are not stored.

## COS photos

The module reuses the current COS credentials and CDN variables:

```bash
COS_SECRET_ID=
COS_SECRET_KEY=
COS_REGION=
COS_BUCKET=
COS_PUBLIC_BASE_URL=
```

Footprint object keys use:

```text
footprints/{userId}/{yyyy}/{mm}/{uuid}.{ext}
```

Current server-action upload limits for this MVP:

- up to 6 photos per entry
- max 8 MB per photo
- max 18 MB total per submission

A future optimization can switch to direct browser → COS signed upload without changing the journal data model.

## UI architecture

The UI follows the approved scrapbook direction:

- warm paper background
- sage / moss green palette
- restrained botanical decoration
- paper labels, washi tape, polaroid frames and stamps
- 70% clear modern mobile UI + 30% scrapbook texture

Main components live in `src/components/footprints/`.

## PWA

`src/app/footprints/manifest.ts` defines a standalone PWA manifest with start URL `/footprints`.

Web Push is intentionally left for the next pass. The existing repository already contains push subscription infrastructure that can be reused later for reminders such as “那年今日”.

## Deploy

After merging:

```bash
cd couple-mvp
git pull
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_footprint_journal.sql
npm install
npm run build
pm2 restart couple-mvp --update-env
```

Then open:

```text
https://liebe.shanjideutsch.site/footprints
```
