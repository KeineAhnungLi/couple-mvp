import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getFootprintEntriesForYear } from "@/lib/data/footprints";
import { AmapFootprintMap } from "@/components/footprints/amap";
import { EntryCard, PageHeader, PaperCard, SectionHeading } from "@/components/footprints/ui";

type SearchParams = Promise<{ year?: string; type?: string }>;

export default async function FootprintMapPage({ searchParams }: { searchParams: SearchParams }) {
  const context = await requireAuth();
  const params = await searchParams;
  const currentYear = new Date().getFullYear();
  const parsedYear = Number(params.year);
  const year = Number.isInteger(parsedYear) && parsedYear > 2000 && parsedYear < 2100 ? parsedYear : currentYear;
  const type = ["全部", "旅行", "日常"].includes(params.type || "") ? params.type! : "全部";
  const allEntries = await getFootprintEntriesForYear(context.userId, year);
  const entries = allEntries.filter((entry) => {
    if (type === "旅行") return Boolean(entry.trip_id) || entry.tags.includes("旅行");
    if (type === "日常") return !entry.trip_id && !entry.tags.includes("旅行");
    return true;
  });
  const cityCount = new Set(entries.map((entry) => entry.city).filter(Boolean)).size;

  return (
    <>
      <PageHeader title="足迹地图" subtitle="每一步，都是时光的印记。" searchHref="/footprints/calendar" compact />

      <div className="fp-filter-bar">
        <form method="get" className="fp-year-form">
          <select aria-label="选择年份" name="year" defaultValue={String(year)} className="fp-year-select">
            {[currentYear, currentYear - 1, currentYear - 2].map((option) => (
              <option key={option} value={option}>{option}年</option>
            ))}
          </select>
          <input type="hidden" name="type" value={type} />
          <button type="submit">切换</button>
        </form>
        {["全部", "旅行", "日常"].map((tab) => (
          <Link
            key={tab}
            href={`/footprints/map?year=${year}&type=${encodeURIComponent(tab)}`}
            className={`fp-filter-chip ${type === tab ? "is-active" : ""}`}
          >
            {tab}
          </Link>
        ))}
      </div>

      <PaperCard className="fp-map-card">
        <AmapFootprintMap entries={entries} />
        <span className="fp-map-stats-badge">今年走过 <strong>{cityCount}</strong> 个城市</span>
      </PaperCard>

      <SectionHeading>最近足迹</SectionHeading>
      {entries.length ? (
        <div className="fp-stack">
          {entries.slice(-2).reverse().map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <PaperCard className="fp-empty-card">
          <h3>这一年还没有 GPS 足迹</h3>
          <p>保存记录时允许浏览器获取定位，地图上就会出现自己的点位。</p>
          <Link className="fp-text-link" href="/footprints/new">去记一页 →</Link>
        </PaperCard>
      )}
    </>
  );
}
