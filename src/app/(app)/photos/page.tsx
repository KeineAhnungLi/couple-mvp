import Image from "next/image";
import Link from "next/link";
import { uploadPhotoAction } from "@/app/(app)/photos/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getPhotoList } from "@/lib/data/dashboard";
import { optimizeImageUrl } from "@/lib/image";

interface PhotosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const PAGE_SIZE = 4;

interface PhotoCursor {
  createdAt: string;
  id: string;
}

const parseCursor = (value: string | string[] | undefined): PhotoCursor | null => {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const sep = value.indexOf("|");
  if (sep <= 0 || sep >= value.length - 1) {
    return null;
  }

  const createdAt = value.slice(0, sep);
  const id = value.slice(sep + 1);

  const parsedDate = new Date(createdAt);
  if (Number.isNaN(parsedDate.getTime()) || !id) {
    return null;
  }

  return { createdAt, id };
};

export default async function PhotosPage({ searchParams }: PhotosPageProps) {
  const context = await requireCoupleContext();
  const params = await searchParams;
  const cursor = parseCursor(params.cursor);

  const photos = await getPhotoList(context.membership.couple_id, {
    limit: PAGE_SIZE + 1,
    cursorCreatedAt: cursor?.createdAt,
    cursorId: cursor?.id,
  });

  const visiblePhotos = photos.slice(0, PAGE_SIZE);
  const hasMore = photos.length > PAGE_SIZE;
  const nextCursorSource = visiblePhotos[visiblePhotos.length - 1] ?? null;
  const nextCursor = nextCursorSource ? `${nextCursorSource.created_at}|${nextCursorSource.id}` : null;

  const uploaded = params.uploaded === "1";
  const deleted = params.deleted === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">上传照片</h1>
        {uploaded ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">上传成功</p> : null}
        {deleted ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">已移入垃圾箱</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        <form action={uploadPhotoAction} className="space-y-3">
          <input required name="photo" type="file" accept="image/*" className="block w-full text-sm" />
          <input
            name="caption"
            maxLength={120}
            placeholder="给这张照片写一句话"
            className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <button type="submit" className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white">
            上传到相册
          </button>
        </form>

        <Link href="/trash" className="inline-block text-sm font-semibold text-brand">
          打开垃圾箱
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">最近照片</h2>
        {visiblePhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            相册还没有内容。
          </div>
        ) : (
          <>
            <ul className="grid grid-cols-2 gap-3">
              {visiblePhotos.map((photo) => (
                <li key={photo.id}>
                  <Link href={`/photos/${photo.id}`} className="block rounded-xl border border-line bg-surface p-2">
                    <div className="relative h-32 overflow-hidden rounded-lg bg-brand-soft/30">
                      {photo.image_url ? (
                        <Image
                          src={optimizeImageUrl(photo.image_url, { width: 360, quality: 65 })}
                          alt={photo.caption ?? "photo"}
                          fill
                          sizes="(max-width: 768px) 50vw, 180px"
                          loading="lazy"
                          quality={65}
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-1 text-xs text-muted">{photo.caption ?? "无 caption"}</p>
                  </Link>
                </li>
              ))}
            </ul>

            {hasMore ? (
              <Link
                href={nextCursor ? `/photos?cursor=${encodeURIComponent(nextCursor)}` : "/photos"}
                className="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-semibold"
              >
                加载更多
              </Link>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
