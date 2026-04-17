import Image from "next/image";
import Link from "next/link";
import { getDashboardSnapshot } from "@/lib/data/dashboard";
import { requireCoupleContext } from "@/lib/auth";

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
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">像素宠物</p>
        {dashboard.petState ? (
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <p>等级：{dashboard.petState.level}</p>
            <p>成长值：{dashboard.petState.growth_points}</p>
            <p>心情：{dashboard.petState.mood}</p>
            <p>健康：{dashboard.petState.health}</p>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">宠物状态暂未初始化</p>
        )}
        <Link href="/pet" className="mt-3 inline-block text-sm font-semibold text-brand">
          查看宠物
        </Link>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">最近一张照片</p>
        {dashboard.latestPhoto?.image_url ? (
          <>
            <div className="relative mt-2 h-40 overflow-hidden rounded-xl">
              <Image
                src={dashboard.latestPhoto.image_url}
                alt={dashboard.latestPhoto.caption ?? "latest photo"}
                fill
                unoptimized
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
      </section>
    </div>
  );
}
