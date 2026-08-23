import Image from "next/image";
import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import {
  getFootprintEntriesForMonth,
  getFootprintEntryByDay,
  getTripsForMonth,
} from "@/lib/data/footprints";
import { formatShanghaiDateKey, getShanghaiDateParts } from "@/lib/footprint-time";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/footprints/icons";
import { MoodBadge, PageHeader, PaperCard, Polaroid } from "@/components/footprints/ui";
import type { FootprintTrip } from "@/types/footprints";

type SearchParams = Promise<{ year?: string; month?: string; day?: string }>;

const pad = (value: number) => String(value).padStart(2, "0");
const utcKey = (date: Date) => `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const buildWeeks = (year: number, month: number) => {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const gridStart = new Date(first);
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  return Array.from({ length: 6 }, (_, weekIndex) =>
    Array.from({ length: 7 }, (_, dayIndex) => {
      const date = new Date(gridStart);
      date.setUTCDate(gridStart.getUTCDate() + weekIndex * 7 + dayIndex);
      return date;
    }),
  );
};

const getTripSegment = (trip: FootprintTrip, week: Date[]) => {
  const start = new Date(`${trip.start_date}T00:00:00Z`);
  const end = new Date(`${trip.end_date}T00:00:00Z`);
  const weekStart = week[0];
  const weekEnd = week[6];
  if (end < weekStart || start > weekEnd) return null;
  const effectiveStart = start > weekStart ? start : weekStart;
  const effectiveEnd = end < weekEnd ? end : weekEnd;
  return {
    startColumn: effectiveStart.getUTCDay() + 1,
    endColumn: effectiveEnd.getUTCDay() + 2,
  };
};

export default async function FootprintCalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const context = await requireAuth();
  const params = await searchParams;
  const today = getShanghaiDateParts();
  const parsedYear = Number(params.year);
  const parsedMonth = Number(params.month);
  const year = Number.isInteger(parsedYear) && parsedYear >= 2000 ? parsedYear : today.year;
  const month = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : today.month;
  const defaultDay = `${year}-${pad(month)}-${pad(Math.min(today.day, new Date(year, month, 0).getDate()))}`;
  const selectedDay = /^\d{4}-\d{2}-\d{2}$/.test(params.day || "") ? params.day! : defaultDay;

  const [entries, trips, selectedEntry] = await Promise.all([
    getFootprintEntriesForMonth(context.userId, year, month),
    getTripsForMonth(context.userId, year, month),
    getFootprintEntryByDay(context.userId, selectedDay),
  ]);

  const entriesByDay = new Map(entries.map((entry) => [formatShanghaiDateKey(entry.captured_at), entry]));
  const weeks = buildWeeks(year, month);

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const todayKey = `${today.year}-${pad(today.month)}-${pad(today.day)}`;
  const todayHref = `/footprints/calendar?year=${today.year}&month=${today.month}&day=${todayKey}`;

  return (
    <>
      <PageHeader title="旅行日历" subtitle="把去过的地方，放进时间里。" compact />

      <div className="fp-section-heading">
        <div className="fp-paper-label"><span>旅行日历</span><i>⌁</i></div>
        <Link href={todayHref} className="fp-back-today">▣ 回到今天</Link>
      </div>

      <PaperCard className="fp-calendar-card">
        <div className="fp-calendar-toolbar">
          <Link className="fp-calendar-arrow" href={`/footprints/calendar?year=${prev.year}&month=${prev.month}`} aria-label="上个月"><ChevronLeftIcon /></Link>
          <h2>{year}年{month}月</h2>
          <Link className="fp-calendar-arrow" href={`/footprints/calendar?year=${next.year}&month=${next.month}`} aria-label="下个月"><ChevronRightIcon /></Link>
        </div>
        <div className="fp-weekdays">{["日", "一", "二", "三", "四", "五", "六"].map((day) => <span key={day}>{day}</span>)}</div>
        <div>
          {weeks.map((week, weekIndex) => (
            <div className="fp-calendar-week" key={weekIndex}>
              {week.map((date) => {
                const key = utcKey(date);
                const entry = entriesByDay.get(key);
                const outside = date.getUTCMonth() + 1 !== month;
                const selected = key === selectedDay;
                return (
                  <Link
                    href={`/footprints/calendar?year=${year}&month=${month}&day=${key}`}
                    key={key}
                    className={`fp-date-cell ${outside ? "is-outside" : ""} ${selected ? "is-selected" : ""}`}
                  >
                    <span className="fp-day-number">{date.getUTCDate()}</span>
                    {entry?.photos[0]?.image_url ? (
                      <span className="fp-date-photo">
                        <Image src={entry.photos[0].image_url} alt="当天照片" fill sizes="46px" />
                      </span>
                    ) : entry?.mood ? (
                      <span className="fp-date-mood" title={entry.mood}>☺</span>
                    ) : null}
                  </Link>
                );
              })}
              {trips.map((trip) => {
                const segment = getTripSegment(trip, week);
                if (!segment) return null;
                return (
                  <div
                    key={`${trip.id}-${weekIndex}`}
                    className="fp-trip-ribbon"
                    style={{ gridColumn: `${segment.startColumn} / ${segment.endColumn}` }}
                    title={`${trip.title} · ${trip.start_date} 至 ${trip.end_date}`}
                  >
                    ▣ {trip.title}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </PaperCard>

      {selectedEntry ? (
        <PaperCard className="fp-selected-day-card">
          <Polaroid src={selectedEntry.photos[0]?.image_url} alt={selectedEntry.place_name || selectedEntry.city || "当天照片"} />
          <div>
            <h3>{Number(selectedDay.slice(5, 7))}月{Number(selectedDay.slice(8, 10))}日 · {selectedEntry.place_name || selectedEntry.city || "这一页"}</h3>
            <p>{selectedEntry.note || "今天留下了一段足迹。"}</p>
            <MoodBadge mood={selectedEntry.mood} />
          </div>
        </PaperCard>
      ) : (
        <PaperCard className="fp-empty-card">
          <h3>这一天还没有记录</h3>
          <p>日历会把旅行、照片和心情留在对应的日期上。</p>
          <Link href="/footprints/new" className="fp-text-link">在这一天记一页 →</Link>
        </PaperCard>
      )}
    </>
  );
}
