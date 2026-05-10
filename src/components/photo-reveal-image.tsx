"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { optimizeImageUrl } from "@/lib/image";

interface PhotoRevealImageProps {
  originalUrl: string;
  alt: string;
}

export const PhotoRevealImage = ({ originalUrl, alt }: PhotoRevealImageProps) => {
  const [showOriginal, setShowOriginal] = useState(false);

  const previewUrl = useMemo(
    () => optimizeImageUrl(originalUrl, { width: 1080, quality: 80 }),
    [originalUrl],
  );

  return (
    <div className="relative h-80 overflow-hidden rounded-xl bg-brand-soft/30">
      <Image
        src={showOriginal ? originalUrl : previewUrl}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, 640px"
        quality={showOriginal ? 90 : 80}
        className="object-cover"
      />

      {!showOriginal ? (
        <button
          type="button"
          onClick={() => setShowOriginal(true)}
          className="absolute bottom-2 right-2 rounded-lg bg-black/60 px-3 py-1 text-xs font-semibold text-white"
        >
          查看原图
        </button>
      ) : null}
    </div>
  );
};

