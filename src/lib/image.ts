interface OptimizeOptions {
  width?: number;
  quality?: number;
}

const isTencentImageHost = (hostname: string): boolean => {
  return (
    hostname.includes("cdn.shanjideutsch.site") ||
    hostname.includes("myqcloud.com") ||
    hostname.includes("cos.")
  );
};

export const optimizeImageUrl = (rawUrl: string, options: OptimizeOptions = {}): string => {
  if (!rawUrl) {
    return rawUrl;
  }

  const width = options.width ?? 1200;
  const quality = options.quality ?? 75;

  try {
    const url = new URL(rawUrl);
    if (!isTencentImageHost(url.hostname)) {
      return rawUrl;
    }

    // Tencent COS image processing: resize + format + quality
    const mogr = `imageMogr2/thumbnail/${width}x>/format/webp/quality/${quality}`;

    if (url.search) {
      return `${url.origin}${url.pathname}${url.search}&${mogr}`;
    }

    return `${url.origin}${url.pathname}?${mogr}`;
  } catch {
    return rawUrl;
  }
};

