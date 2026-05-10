import Link from "next/link";
import { notFound } from "next/navigation";
import { movePhotoToTrashAction } from "@/app/(app)/photos/actions";
import { PhotoRevealImage } from "@/components/photo-reveal-image";
import { requireCoupleContext } from "@/lib/auth";
import { getPhotoDetail } from "@/lib/data/dashboard";

interface PhotoDetailPageProps {
  params: Promise<{ photoId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PhotoDetailPage({ params, searchParams }: PhotoDetailPageProps) {
  const context = await requireCoupleContext();
  const { photoId } = await params;
  const query = await searchParams;
  const error = typeof query.error === "string" ? query.error : null;

  const photo = await getPhotoDetail(context.membership.couple_id, photoId);

  if (!photo) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <Link href="/photos" className="text-sm font-semibold text-brand">
        返回相册
      </Link>

      <article className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        {photo.image_url ? (
          <PhotoRevealImage originalUrl={photo.image_url} alt={photo.caption ?? "photo detail"} />
        ) : null}

        <p className="text-sm leading-6">{photo.caption ?? "无 caption"}</p>
        <div className="text-xs text-muted">
          <p>上传者：{photo.uploader_name}</p>
          <p>上传时间：{new Date(photo.created_at).toLocaleString()}</p>
        </div>

        <form action={movePhotoToTrashAction}>
          <input type="hidden" name="photoId" value={photo.id} />
          <button
            type="submit"
            className="h-10 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600"
          >
            删除到垃圾箱
          </button>
        </form>
      </article>
    </div>
  );
}
