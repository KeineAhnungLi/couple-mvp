import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  getFootprintEntriesForYear,
  getFootprintMonthSummary,
  getRecentFootprintEntries,
} from "@/lib/data/footprints";
import { AmapFootprintMap } from "@/components/footprints/amap";
import {
  EmptyScrapbook,
  EntryCard,
  PageHeader,
  PaperCard,
  SectionHeading,
} from "@/components/footprints/ui";

type SearchParams = Promise<{ saved?: string; photoFailures?: string }>;

export default async function FootprintsHome({ searchParams }: { searchParams: SearchParams }) {
  const context = await requireAuth();
  const params = await searchParams;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [summary, recent, yearEntries] = await Promise.all([
    getFootprintMonthSummary(context.userId, year, month),
    getRecentFootprintEntries(context.userId, 4),
    getFootprintEntriesForYear(context.userId, year),
  ]);

  return (
    <>
      <PageHeader
        title="妈妈的足迹手账"
        subtitle="把走过的地方，慢慢记下来。"
        searchHref="/footprints/map"
      />

      {params.saved === "1" ? (
        <div className="fp-form-message is-success">
          这一页已经收进手账。{params.photoFailures ? ` 有 ${params.photoFailures} 张照片上传失败，文字和位置已保存。` : ""}
        </div>
      ) : null}

      <PaperCard className="fp-summary-card">
        <span className="fp-tape fp-tape-green" aria-hidden="true" />
        <div className="fp-summary-title">
          <strong>{year}年{month}月</strong>
          <span aria-hidden="true">☺</span>
        </div>
        <div className="fp-summary-metrics">
          <span>去了 <b>{summary.cityCount}</b> 个城市</span>
          <span>·</span>
          <span>留下 <b>{summary.entryCount}</b> 条记录</span>
          <span>·</span>
          <span>最常见心情：<span className="mood-word">{summary.topMood || "—"}</span></span>
        </div>
      </PaperCard>

      <Link href="/footprints/map" aria-label="打开足迹地图">
        <PaperCard className="fp-map-card fp-map-preview-card">
          <AmapFootprintMap entries={yearEntries} compact />
          <span className="fp-map-stats-badge">今年已经走过 <strong>{new Set(yearEntries.map((e) => e.city).filter(Boolean)).size}</strong> 个城市</span>
        </PaperCard>
      </Link>

      <SectionHeading action={<Link href="/footprints/calendar">看日历 →</Link>}>最近记录</SectionHeading>

      {recent.length ? (
        <div className="fp-stack">
          {recent.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
        </div>
      ) : (
        <EmptyScrapbook
          title="手账还是空白的"
          description="下一次出门时，拍张照片、记下地点和当时的心情，这里就会慢慢长出属于自己的地图。"
        />
      )}
    </>
  );
}
