import Image from "next/image";
import Link from "next/link";
import { uploadPhotoAction } from "@/app/(app)/photos/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getPhotoList } from "@/lib/data/dashboard";

interface PhotosPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PhotosPage({ searchParams }: PhotosPageProps) {
  const context = await requireCoupleContext();
  const photos = await getPhotoList(context.membership.couple_id);
  const params = await searchParams;

  const uploaded = params.uploaded === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">上传照片</h1>
        {uploaded ? (
          <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">上传成功</p>
        ) : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        <form action={uploadPhotoAction} className="space-y-3">
          <input
            required
            name="photo"
            type="file"
            accept="image/*"
            className="block w-full text-sm"
          />
          <input
            name="caption"
            maxLength={120}
            placeholder="给这张照片写一句话"
            className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white"
          >
            上传到相册
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">最近照片</h2>
        {photos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            相册还没有内容。
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <li key={photo.id}>
                <Link href={`/photos/${photo.id}`} className="block rounded-xl border border-line bg-surface p-2">
                  <div className="relative h-32 overflow-hidden rounded-lg bg-brand-soft/30">
                    {photo.signed_url ? (
                      <Image
                        src={photo.signed_url}
                        alt={photo.caption ?? "photo"}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-1 text-xs text-muted">{photo.caption ?? "无 caption"}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

