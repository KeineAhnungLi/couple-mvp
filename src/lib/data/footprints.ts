import { dbQuery, dbQueryOne } from "@/lib/server/db";
import type {
  FootprintEntry,
  FootprintMonthSummary,
  FootprintTrip,
  FootprintYearSummary,
} from "@/types/footprints";

type EntryRow = Omit<FootprintEntry, "photos"> & { photos: FootprintEntry["photos"] | string | null };

const normalizeEntry = (row: EntryRow): FootprintEntry => {
  let photos: FootprintEntry["photos"] = [];
  if (Array.isArray(row.photos)) {
    photos = row.photos;
  } else if (typeof row.photos === "string") {
    try {
      photos = JSON.parse(row.photos) as FootprintEntry["photos"];
    } catch {
      photos = [];
    }
  }
  return { ...row, photos };
};

const entrySelect = `
  select
    e.id,
    e.user_id,
    e.trip_id,
    e.captured_at,
    e.latitude,
    e.longitude,
    e.country,
    e.province,
    e.city,
    e.district,
    e.place_name,
    e.mood,
    e.note,
    e.tags,
    e.is_special,
    e.created_at,
    coalesce(
      json_agg(
        json_build_object(
          'id', p.id,
          'image_url', p.image_url,
          'object_key', p.object_key,
          'sort_order', p.sort_order,
          'taken_at', p.taken_at
        ) order by p.sort_order, p.created_at
      ) filter (where p.id is not null),
      '[]'::json
    ) as photos
  from footprint_entries e
  left join footprint_entry_photos p on p.entry_id = e.id
`;

const entryGroupBy = `
  group by e.id
`;

export const getRecentFootprintEntries = async (
  userId: string,
  limit = 8,
): Promise<FootprintEntry[]> => {
  const rows = await dbQuery<EntryRow>(
    `${entrySelect}
     where e.user_id = $1
     ${entryGroupBy}
     order by e.captured_at desc
     limit $2`,
    [userId, limit],
  );
  return rows.map(normalizeEntry);
};

export const getFootprintEntriesForYear = async (
  userId: string,
  year: number,
): Promise<FootprintEntry[]> => {
  const rows = await dbQuery<EntryRow>(
    `${entrySelect}
     where e.user_id = $1
       and e.captured_at >= make_date($2, 1, 1)
       and e.captured_at < make_date($2 + 1, 1, 1)
     ${entryGroupBy}
     order by e.captured_at asc`,
    [userId, year],
  );
  return rows.map(normalizeEntry);
};

export const getFootprintEntriesForMonth = async (
  userId: string,
  year: number,
  month: number,
): Promise<FootprintEntry[]> => {
  const rows = await dbQuery<EntryRow>(
    `${entrySelect}
     where e.user_id = $1
       and e.captured_at >= make_date($2, $3, 1)
       and e.captured_at < (make_date($2, $3, 1) + interval '1 month')
     ${entryGroupBy}
     order by e.captured_at asc`,
    [userId, year, month],
  );
  return rows.map(normalizeEntry);
};

export const getFootprintEntryByDay = async (
  userId: string,
  dayKey: string,
): Promise<FootprintEntry | null> => {
  const row = await dbQueryOne<EntryRow>(
    `${entrySelect}
     where e.user_id = $1
       and (e.captured_at at time zone 'Asia/Shanghai')::date = $2::date
     ${entryGroupBy}
     order by e.captured_at desc
     limit 1`,
    [userId, dayKey],
  );
  return row ? normalizeEntry(row) : null;
};

export const getFootprintMonthSummary = async (
  userId: string,
  year: number,
  month: number,
): Promise<FootprintMonthSummary> => {
  const countRow = await dbQueryOne<{ city_count: string; entry_count: string }>(
    `select
       count(distinct nullif(trim(city), ''))::text as city_count,
       count(*)::text as entry_count
     from footprint_entries
     where user_id = $1
       and captured_at >= make_date($2, $3, 1)
       and captured_at < (make_date($2, $3, 1) + interval '1 month')`,
    [userId, year, month],
  );

  const moodRow = await dbQueryOne<{ mood: string | null }>(
    `select mood
     from footprint_entries
     where user_id = $1
       and captured_at >= make_date($2, $3, 1)
       and captured_at < (make_date($2, $3, 1) + interval '1 month')
       and mood is not null and trim(mood) <> ''
     group by mood
     order by count(*) desc, mood
     limit 1`,
    [userId, year, month],
  );

  return {
    cityCount: Number(countRow?.city_count ?? 0),
    entryCount: Number(countRow?.entry_count ?? 0),
    topMood: moodRow?.mood ?? null,
  };
};

export const getFootprintYearSummary = async (
  userId: string,
  year: number,
): Promise<FootprintYearSummary> => {
  const countRow = await dbQueryOne<{
    city_count: string;
    entry_count: string;
    photo_count: string;
  }>(
    `select
       count(distinct nullif(trim(e.city), ''))::text as city_count,
       count(distinct e.id)::text as entry_count,
       count(p.id)::text as photo_count
     from footprint_entries e
     left join footprint_entry_photos p on p.entry_id = e.id
     where e.user_id = $1
       and e.captured_at >= make_date($2, 1, 1)
       and e.captured_at < make_date($2 + 1, 1, 1)`,
    [userId, year],
  );

  const moodRow = await dbQueryOne<{ mood: string | null }>(
    `select mood
     from footprint_entries
     where user_id = $1
       and captured_at >= make_date($2, 1, 1)
       and captured_at < make_date($2 + 1, 1, 1)
       and mood is not null and trim(mood) <> ''
     group by mood
     order by count(*) desc, mood
     limit 1`,
    [userId, year],
  );

  return {
    cityCount: Number(countRow?.city_count ?? 0),
    entryCount: Number(countRow?.entry_count ?? 0),
    photoCount: Number(countRow?.photo_count ?? 0),
    topMood: moodRow?.mood ?? null,
  };
};

export const getTripsForMonth = async (
  userId: string,
  year: number,
  month: number,
): Promise<FootprintTrip[]> =>
  dbQuery<FootprintTrip>(
    `select id, user_id, title, start_date, end_date, province, city, overall_mood, note
     from footprint_trips
     where user_id = $1
       and start_date < (make_date($2, $3, 1) + interval '1 month')::date
       and end_date >= make_date($2, $3, 1)
     order by start_date asc`,
    [userId, year, month],
  );

export const getOnThisDayFootprint = async (
  userId: string,
  monthDay: string,
  currentYear: number,
): Promise<FootprintEntry | null> => {
  const row = await dbQueryOne<EntryRow>(
    `${entrySelect}
     where e.user_id = $1
       and to_char(e.captured_at at time zone 'Asia/Shanghai', 'MM-DD') = $2
       and extract(year from e.captured_at at time zone 'Asia/Shanghai') < $3
     ${entryGroupBy}
     order by e.captured_at desc
     limit 1`,
    [userId, monthDay, currentYear],
  );
  return row ? normalizeEntry(row) : null;
};
