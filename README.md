# CoupleSpace (Tencent Cloud CVM Deploy)

Next.js 15 + PostgreSQL + Tencent COS + CDN。

## 固定生产约定

- 域名：`liebe.shanjideutsch.site`
- Next.js 端口：`3000`
- Nginx 反代：`http://127.0.0.1:3000`
- PostgreSQL：`127.0.0.1:5432`
- 数据库/用户：`loveapp` / `loveuser`
- COS Bucket：`test-1386792709`
- COS Region：`ap-nanjing`
- CDN 域名：`https://cdn.shanjideutsch.site`
- 照片 URL 规则：`https://cdn.shanjideutsch.site/{objectKey}`
- objectKey 规则：`photos/{coupleId}/{yyyy}/{mm}/{uuid}.{ext}`

## 环境变量

复制 `.env.example` 为 `.env.local` 后填写真实密钥。

```bash
cp .env.example .env.local
```

如果当前环境是 HTTP（未上 HTTPS），请在 `.env.local` 设置：`SESSION_COOKIE_SECURE=false`。
正式 HTTPS 域名部署请保持：`SESSION_COOKIE_SECURE=true`。

## 初始化数据库（只建表，不创建 DB/用户）

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/init.sql
```

## 已部署环境升级补丁

1) 取消“每天一条日记”限制：

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_remove_diary_daily_limit.sql
```

2) 增加垃圾箱/评论/提醒/宠物交互表：

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_social_reminder_pet_trash.sql
```

3) 增加页面内提醒通知字段 + 预留 Web Push 表：

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/patch_add_in_app_notification_push.sql
```

## 通知能力

- 页面内提醒（当前可用）：
  - API 拉取：`GET /api/notifications/in-app`
  - API 确认已读：`POST /api/notifications/in-app`
- Web Push（预留接口，未启用发送）：
  - 保存订阅：`POST /api/push/subscribe`
  - 预留派发：`POST /api/push/dispatch`（需要 `x-cron-secret`）

## 首次部署

```bash
git clone https://github.com/KeineAhnungLi/couple-mvp.git
cd couple-mvp
npm install
npm run build
pm2 start npm --name couple-mvp -- start -- -p 3000
pm2 save
```

## Nginx 配置示例

文件：`/etc/nginx/conf.d/liebe.shanjideutsch.site.conf`

```nginx
server {
  listen 80;
  server_name liebe.shanjideutsch.site;
  client_max_body_size 20m;

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

生效命令：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 更新发布

```bash
cd couple-mvp
git pull
npm install
npm run build
pm2 restart couple-mvp --update-env
```

## 账号初始化（关闭公开注册）

生成 bcrypt 密码哈希：

```bash
node -e "const {hash}=require('bcryptjs');hash('your_password',12).then(v=>console.log(v))"
```

插入用户：

```sql
insert into users (email, password_hash, display_name)
values ('a@example.com', '<bcrypt_hash>', 'A');

insert into users (email, password_hash, display_name)
values ('b@example.com', '<bcrypt_hash>', 'B');
```
