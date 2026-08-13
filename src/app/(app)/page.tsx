import Image from "next/image";
import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/data/dashboard";
import { requireCoupleContext } from "@/lib/auth";
import { optimizeImageUrl } from "@/lib/image";

export default async function HomePage() {
  const context = await requireCoupleContext();
  const dashboard = await getDashboardSnapshot(context.membership.couple_id);

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">今日 Prompt</p>
        <p className="mt-2 text-sm leading-6">{dashboard.prompt.promptText}</p>
        <Link href="/diary" className="mt-3 inline-block text-sm font-semibold text-brand">
          去写日记
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">提醒</p>
        {dashboard.nextReminder ? (
          <>
            <p className="mt-2 text-sm">{dashboard.nextReminder.title}</p>
            <p className="mt-1 text-xs text-muted">
              {new Date(dashboard.nextReminder.remind_at).toLocaleString()}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">暂无未完成提醒。</p>
        )}
        <Link href="/reminders" className="mt-3 inline-block text-sm font-semibold text-brand">
          管理提醒
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">Trio 卡牌游戏</p>
        <p className="mt-2 text-sm leading-6">
          两位真人玩家与一位规则 Bot 的三人牌局。系统会使用情侣身份自动进入同一个房间。
        </p>
        <Link href="/trio" className="mt-3 inline-block text-sm font-semibold text-brand">
          开始 Trio
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">最近一张照片</p>
        {dashboard.latestPhoto?.image_url ? (
          <>
            <div className="relative mt-2 h-40 overflow-hidden rounded-xl">
              <Image
                src={optimizeImageUrl(dashboard.latestPhoto.image_url, { width: 720, quality: 75 })}
                alt={dashboard.latestPhoto.caption ?? "latest photo"}
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                quality={75}
                className="object-cover"
              />
            </div>
            <p className="mt-2 text-sm text-muted">{dashboard.latestPhoto.caption ?? "无 caption"}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">还没有照片，去上传第一张吧。</p>
        )}
        <Link href="/photos" className="mt-3 inline-block text-sm font-semibold text-brand">
          打开相册
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">最近一条日记</p>
        {dashboard.latestDiary ? (
          <>
            <p className="mt-2 text-sm leading-6">{dashboard.latestDiary.content}</p>
            <p className="mt-2 text-xs text-muted">{dashboard.latestDiary.author_name}</p>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">还没有日记，今晚写一条吧。</p>
        )}
        <Link href="/trash" className="mt-3 inline-block text-sm font-semibold text-brand">
          打开垃圾箱
        </Link>
      </section>
    </div>
  );
}
