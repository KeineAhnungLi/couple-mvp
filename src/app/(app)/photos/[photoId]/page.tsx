import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { getPhotoDetail } from "@/lib/data/dashboard";

interface PhotoDetailPageProps {
  params: Promise<{ photoId: string }>;
}

export default async function PhotoDetailPage({ params }: PhotoDetailPageProps) {
  const context = await requireCoupleContext();
  const { photoId } = await params;

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
        <div className="relative h-80 overflow-hidden rounded-xl bg-brand-soft/30">
          {photo.signed_url ? (
            <Image
              src={photo.signed_url}
              alt={photo.caption ?? "photo detail"}
              fill
              unoptimized
              className="object-cover"
            />
          ) : null}
        </div>

        <p className="text-sm leading-6">{photo.caption ?? "无 caption"}</p>
        <div className="text-xs text-muted">
          <p>上传者：{photo.uploader_name}</p>
          <p>上传时间：{new Date(photo.created_at).toLocaleString()}</p>
        </div>
      </article>
    </div>
  );
}

