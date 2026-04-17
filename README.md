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

## 初始化数据库（只建表，不创建 DB/用户）

```bash
psql "postgresql://loveuser:replace_me@127.0.0.1:5432/loveapp" -f db/init.sql
```

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
pm2 restart couple-mvp
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
