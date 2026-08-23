# 妈妈的足迹手账 — MVP implementation

The footprint journal is implemented inside the existing `couple-mvp` Next.js deployment so it can reuse PostgreSQL, the account/session system and Tencent COS/CDN. Its **canonical public domain is separate from CoupleSpace**:

```text
https://travel.shanjideutsch.site
```

`liebe.shanjideutsch.site` remains the CoupleSpace domain. Requests to `/footprints...` on that legacy host are redirected to the travel domain by `src/middleware.ts`.

## Routes

The application code remains under the `/footprints` route group:

- `/footprints` — 手账总览：首页摘要、地图预览、最近记录
- `/footprints/map` — 足迹地图
- `/footprints/calendar` — 旅行日历
- `/footprints/new` — 记一页
- `/footprints/memories` — 那年今日、时间线、年度回顾
- `/footprints/profile` — 我的

Opening `https://travel.shanjideutsch.site/` automatically redirects to `/footprints` on the same host.

The footprint module has its own visual shell and bottom navigation, so it does not inherit the CoupleSpace header/navigation.

## Authentication

Footprints are **user-scoped**, not couple-scoped. A normal existing `users` account is enough; the account does not need to join a CoupleSpace couple.

`/login?next=/footprints` is supported. A direct visit to `https://travel.shanjideutsch.site/login` also receives that return path automatically.

Because the session cookie is host-scoped, users log in independently on `travel.shanjideutsch.site`; this does not require sharing a browser cookie with `liebe.shanjideutsch.site`.

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

All calendar/month/year grouping is interpreted in `Asia/Shanghai` so records around UTC day/month boundaries do not move into the wrong Chinese calendar day.

## AMap

Create a **Web端（JS API）** Key in the AMap developer console and set its domain whitelist to:

```text
travel.shanjideutsch.site
```

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

Install the PWA from `travel.shanjideutsch.site`, not the CoupleSpace domain.

Web Push is intentionally left for the next pass. The existing repository already contains push subscription infrastructure that can be reused later for reminders such as “那年今日”.

## DNS / HTTPS / Nginx

1. Add an `A` record for `travel.shanjideutsch.site` pointing to the same CVM public IP used by the existing site.
2. Ensure the TLS certificate covers `travel.shanjideutsch.site` (a wildcard `*.shanjideutsch.site` certificate is also fine).
3. Add a dedicated Nginx vhost that proxies to the same Next.js process on `127.0.0.1:3000`.

Example proxy block (reuse your existing TLS certificate paths/settings):

```nginx
server {
  listen 80;
  server_name travel.shanjideutsch.site;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name travel.shanjideutsch.site;
  client_max_body_size 20m;

  # ssl_certificate ...;
  # ssl_certificate_key ...;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Do **not** globally change the shared process's `APP_BASE_URL` to the travel domain just for this module; CoupleSpace still uses the same Next.js process. The footprint routes use relative URLs and the dedicated host is enforced by middleware.

## Deploy

After merging:

```bash
cd couple-mvp
git pull
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_footprint_journal.sql
npm install
npm run build
pm2 restart couple-mvp --update-env
sudo nginx -t
sudo systemctl reload nginx
```

Then open:

```text
https://travel.shanjideutsch.site
```
