"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FootprintEntry } from "@/types/footprints";

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: { securityJsCode?: string };
  }
}

interface AmapFootprintMapProps {
  entries: FootprintEntry[];
  compact?: boolean;
  className?: string;
}

const validPoints = (entries: FootprintEntry[]) =>
  entries.filter((entry) => Number.isFinite(entry.latitude) && Number.isFinite(entry.longitude));

export function AmapFootprintMap({ entries, compact = false, className = "" }: AmapFootprintMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const points = useMemo(() => validPoints(entries), [entries]);
  const key = process.env.NEXT_PUBLIC_AMAP_KEY || "";
  const securityCode = process.env.NEXT_PUBLIC_AMAP_SECURITY_JS_CODE || "";

  useEffect(() => {
    if (!key || typeof window === "undefined") return;
    if (securityCode) window._AMapSecurityConfig = { securityJsCode: securityCode };

    const existing = document.querySelector<HTMLScriptElement>('script[data-footprint-amap="1"]');
    if (window.AMap) {
      setReady(true);
      return;
    }
    if (existing) {
      const onLoad = () => setReady(true);
      existing.addEventListener("load", onLoad);
      return () => existing.removeEventListener("load", onLoad);
    }

    const script = document.createElement("script");
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(key)}`;
    script.async = true;
    script.dataset.footprintAmap = "1";
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, [key, securityCode]);

  useEffect(() => {
    if (!ready || !window.AMap || !containerRef.current) return;
    const AMap = window.AMap;
    let cancelled = false;
    const map = new AMap.Map(containerRef.current, {
      zoom: compact ? 5 : 6,
      center: [120.1551, 30.2741],
      viewMode: "2D",
      mapStyle: "amap://styles/whitesmoke",
    });

    const convertGps = (entry: FootprintEntry): Promise<{ entry: FootprintEntry; position: [number, number] }> =>
      new Promise((resolve) => {
        const raw: [number, number] = [entry.longitude as number, entry.latitude as number];
        if (typeof AMap.convertFrom !== "function") {
          resolve({ entry, position: raw });
          return;
        }
        AMap.convertFrom(raw, "gps", (status: string, result: { locations?: Array<{ lng: number; lat: number }> }) => {
          const converted = status === "complete" ? result?.locations?.[0] : null;
          resolve({ entry, position: converted ? [converted.lng, converted.lat] : raw });
        });
      });

    void Promise.all(points.map(convertGps)).then((convertedPoints) => {
      if (cancelled) return;
      if (convertedPoints.length > 1) {
        const polyline = new AMap.Polyline({
          path: convertedPoints.map((item) => item.position),
          strokeColor: "#6f8a68",
          strokeOpacity: 0.88,
          strokeWeight: compact ? 3 : 4,
          strokeStyle: "dashed",
        });
        map.add(polyline);
      }

      const markers = convertedPoints.map(({ entry, position }) => {
        const content = document.createElement("button");
        content.type = "button";
        content.className = "fp-amap-marker";
        const image = entry.photos[0]?.image_url;
        content.innerHTML = image
          ? `<span class="fp-amap-marker-photo" style="background-image:url('${image.replace(/'/g, "%27")}')"></span><span class="fp-amap-marker-tail"></span>`
          : `<span class="fp-amap-marker-dot"></span><span class="fp-amap-marker-tail"></span>`;
        content.title = entry.place_name || entry.city || "足迹";
        return new AMap.Marker({
          position,
          content,
          offset: new AMap.Pixel(-24, -54),
        });
      });
      map.add(markers);
      if (markers.length) map.setFitView(markers, false, compact ? [38, 38, 38, 38] : [56, 56, 56, 56]);
    });

    return () => {
      cancelled = true;
      map.destroy();
    };
  }, [ready, points, compact]);

  if (!key) {
    return <FallbackPaperMap entries={points} compact={compact} className={className} />;
  }

  return <div ref={containerRef} className={`fp-amap ${compact ? "is-compact" : ""} ${className}`} />;
}

function FallbackPaperMap({ entries, compact, className }: { entries: FootprintEntry[]; compact: boolean; className: string }) {
  const coordinates = entries.length
    ? entries.map((entry) => ({ x: entry.longitude || 120, y: entry.latitude || 30 }))
    : [
        { x: 118.8, y: 32.1 },
        { x: 120.6, y: 31.3 },
        { x: 121.5, y: 31.2 },
        { x: 120.2, y: 30.3 },
      ];
  const xs = coordinates.map((p) => p.x);
  const ys = coordinates.map((p) => p.y);
  const minX = Math.min(...xs) - 0.5;
  const maxX = Math.max(...xs) + 0.5;
  const minY = Math.min(...ys) - 0.5;
  const maxY = Math.max(...ys) + 0.5;
  const project = (p: { x: number; y: number }) => ({
    left: `${12 + ((p.x - minX) / Math.max(maxX - minX, 1)) * 76}%`,
    top: `${82 - ((p.y - minY) / Math.max(maxY - minY, 1)) * 68}%`,
  });

  return (
    <div className={`fp-fallback-map ${compact ? "is-compact" : ""} ${className}`}>
      <span className="fp-map-coast" aria-hidden="true" />
      <span className="fp-map-mountain m1" aria-hidden="true">⌁</span>
      <span className="fp-map-mountain m2" aria-hidden="true">⌁</span>
      <span className="fp-map-tree t1" aria-hidden="true">♧</span>
      <span className="fp-map-tree t2" aria-hidden="true">♧</span>
      <svg className="fp-fallback-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline
          points={coordinates.map((p) => {
            const pos = project(p);
            return `${parseFloat(pos.left)},${parseFloat(pos.top)}`;
          }).join(" ")}
          fill="none"
          stroke="#6f8a68"
          strokeWidth="1.2"
          strokeDasharray="2 2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {coordinates.map((point, index) => {
        const pos = project(point);
        return <span key={`${point.x}-${point.y}-${index}`} className="fp-fallback-dot" style={pos} />;
      })}
      <span className="fp-map-caption">地图将在配置高德 Key 后显示真实 GPS 足迹</span>
    </div>
  );
}
