import {
  cleanupExpiredTrashAction,
  emptyTrashAction,
  restoreDiaryFromTrashAction,
  restorePhotoFromTrashAction,
} from "@/app/(app)/trash/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getTrashDiaryEntries, getTrashPhotos } from "@/lib/data/dashboard";

interface TrashPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TrashPage({ searchParams }: TrashPageProps) {
  const context = await requireCoupleContext();
  const [photos, entries, params] = await Promise.all([
    getTrashPhotos(context.membership.couple_id),
    getTrashDiaryEntries(context.membership.couple_id),
    searchParams,
  ]);

  const restored = params.restored === "1";
  const emptied = params.emptied === "1";
  const cleaned = params.cleaned === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">垃圾箱（保留 30 天）</h1>
        <p className="text-sm text-muted">已删除的照片和日记会在这里保留一个月，可手动恢复或清空。</p>
        {restored ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">已恢复</p> : null}
        {emptied ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">垃圾箱已清空</p> : null}
        {cleaned ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">已清理过期内容</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <form action={cleanupExpiredTrashAction}>
            <button type="submit" className="h-11 w-full rounded-xl border border-line text-sm font-semibold">
              清理过期
            </button>
          </form>
          <form action={emptyTrashAction}>
            <button
              type="submit"
              className="h-11 w-full rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600"
            >
              清空垃圾箱
            </button>
          </form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">已删照片</h2>
        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            暂无已删照片。
          </div>
        ) : (
          <ul className="space-y-2">
            {photos.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-sm">{item.caption ?? "无 caption"}</p>
                <p className="mt-1 text-xs text-muted">
                  删除时间：{new Date(item.deleted_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted">
                  自动清理：{item.purge_at ? new Date(item.purge_at).toLocaleString() : "未设置"}
                </p>
                <form action={restorePhotoFromTrashAction} className="mt-2">
                  <input type="hidden" name="photoId" value={item.id} />
                  <button type="submit" className="h-10 rounded-xl border border-line px-3 text-xs font-semibold">
                    恢复照片
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">已删日记</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            暂无已删日记。
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((item) => (
              <li key={item.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-sm leading-6">{item.content}</p>
                <p className="mt-1 text-xs text-muted">
                  删除时间：{new Date(item.deleted_at).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted">
                  自动清理：{item.purge_at ? new Date(item.purge_at).toLocaleString() : "未设置"}
                </p>
                <form action={restoreDiaryFromTrashAction} className="mt-2">
                  <input type="hidden" name="entryId" value={item.id} />
                  <button type="submit" className="h-10 rounded-xl border border-line px-3 text-xs font-semibold">
                    恢复日记
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

