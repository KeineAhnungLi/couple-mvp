import { requireAuth } from "@/lib/auth";
import {
  getFootprintEntriesForYear,
  getFootprintYearSummary,
  getOnThisDayFootprint,
  getRecentFootprintEntries,
} from "@/lib/data/footprints";
import { AmapFootprintMap } from "@/components/footprints/amap";
import {
  EmptyScrapbook,
  MoodBadge,
  PageHeader,
  PaperCard,
  Polaroid,
  SectionHeading,
} from "@/components/footprints/ui";
import type { FootprintEntry } from "@/types/footprints";

const place = (entry: FootprintEntry) => entry.place_name || entry.city || entry.province || "一段旅程";

export default async function FootprintMemoriesPage() {
  const context = await requireAuth();
  const now = new Date();
  const year = now.getFullYear();
  const monthDay = `${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const [onThisDay, recent, summary, yearEntries] = await Promise.all([
    getOnThisDayFootprint(context.userId, monthDay, year),
    getRecentFootprintEntries(context.userId, 18),
    getFootprintYearSummary(context.userId, year),
    getFootprintEntriesForYear(context.userId, year),
  ]);

  const monthGroups = recent.reduce<Map<string, FootprintEntry[]>>((map, entry) => {
    const date = new Date(entry.captured_at);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const list = map.get(key) || [];
    list.push(entry);
    map.set(key, list);
    return map;
  }, new Map());

  return (
    <>
      <PageHeader title="回忆" subtitle="把去过的地方，再看一遍。" searchHref="/footprints/calendar" compact />

      {onThisDay ? (
        <PaperCard className="fp-memory-feature">
          <div>
            <div className="fp-paper-label"><span>那年今日</span><i>⌁</i></div>
            <span className="fp-memory-date">{new Date(onThisDay.captured_at).getFullYear()}年 · 今天</span>
            <h2>那年的今天 · {place(onThisDay)}</h2>
            <p>{onThisDay.note || "当时没有写下文字，但这张照片和地点还在。"}</p>
            <MoodBadge mood={onThisDay.mood} />
          </div>
          <Polaroid src={onThisDay.photos[0]?.image_url} alt={place(onThisDay)} />
        </PaperCard>
      ) : (
        <PaperCard className="fp-memory-feature">
          <div>
            <div className="fp-paper-label"><span>那年今日</span><i>⌁</i></div>
            <h2>今天还没有历史回忆</h2>
            <p>继续记录下去，明年这里会出现一张属于今天的旧照片。</p>
          </div>
          <Polaroid alt="未来的回忆" />
        </PaperCard>
      )}

      <SectionHeading>我的回忆时间线</SectionHeading>
      {monthGroups.size ? (
        <div className="fp-timeline">
          {Array.from(monthGroups.entries()).slice(0, 6).map(([key, entries]) => {
            const first = entries[0];
            const month = Number(key.slice(5, 7));
            return (
              <div className="fp-timeline-item" key={key}>
                <PaperCard className="fp-timeline-card">
                  <Polaroid src={first.photos[0]?.image_url} alt={place(first)} />
                  <div>
                    <h3>{month}月 · {first.city || place(first)}</h3>
                    <p>{first.note || "这一段时间留下了几页足迹。"}</p>
                    <span className="fp-timeline-meta">▧ {entries.length} 段记录</span>
                  </div>
                </PaperCard>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyScrapbook title="还没有可以翻看的旧页" description="第一段记录保存以后，回忆时间线会按月份慢慢延伸。" />
      )}

      <PaperCard className="fp-year-card">
        <h2>{year} 年度回顾 ❧</h2>
        <div className="fp-year-stats">
          <div className="fp-year-stat"><strong>{summary.cityCount}</strong><span>个城市</span></div>
          <div className="fp-year-stat"><strong>{summary.entryCount}</strong><span>段记录</span></div>
          <div className="fp-year-stat"><strong>{summary.photoCount}</strong><span>张照片</span></div>
          <div className="fp-year-stat"><strong>{summary.topMood || "—"}</strong><span>常见心情</span></div>
        </div>
        <div style={{ marginTop: 16 }}>
          <AmapFootprintMap entries={yearEntries} compact />
        </div>
      </PaperCard>
    </>
  );
}
