import { dbQuery, dbQueryOne } from "@/lib/server/db";
import { getTodayPrompt } from "@/lib/data/prompts";
import type {
  DiaryCommentWithMeta,
  DiaryEntryWithMeta,
  PetInteraction,
  PetState,
  PhotoWithMeta,
  ReminderWithMeta,
  TrashDiaryItem,
  TrashPhotoItem,
} from "@/types/domain";

interface PhotoWithUserRow {
  id: string;
  couple_id: string;
  uploaded_by: string;
  object_key: string;
  image_url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  purge_at: string | null;
  uploader_name: string | null;
}

interface DiaryWithUserRow {
  id: string;
  couple_id: string;
  author_id: string;
  prompt_id: number | null;
  entry_date: string;
  content: string;
  visibility: "couple";
  created_at: string;
  deleted_at: string | null;
  deleted_by: string | null;
  purge_at: string | null;
  author_name: string | null;
  prompt_text: string | null;
}

interface DiaryCommentRow {
  id: string;
  entry_id: string;
  couple_id: string;
  author_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
  author_name: string | null;
}

interface ReminderRow {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  note: string | null;
  remind_at: string;
  is_done: boolean;
  done_at: string | null;
  in_app_notified_at: string | null;
  web_push_notified_at: string | null;
  created_at: string;
  creator_name: string | null;
}

interface PetRow {
  id: string;
  couple_id: string;
  level: number;
  growth_points: number;
  mood: number;
  health: number;
  last_interaction_date: string | null;
  current_stage: string;
  updated_at: string;
}

const mapPhoto = (row: PhotoWithUserRow): PhotoWithMeta => {
  return {
    id: row.id,
    couple_id: row.couple_id,
    uploaded_by: row.uploaded_by,
    object_key: row.object_key,
    image_url: row.image_url,
    caption: row.caption,
    taken_at: row.taken_at,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
    deleted_by: row.deleted_by,
    purge_at: row.purge_at,
    uploader_name: row.uploader_name ?? "Unknown",
  };
};

const mapDiary = (row: DiaryWithUserRow): DiaryEntryWithMeta => {
  return {
    id: row.id,
    couple_id: row.couple_id,
    author_id: row.author_id,
    prompt_id: row.prompt_id,
    entry_date: row.entry_date,
    content: row.content,
    visibility: row.visibility,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
    deleted_by: row.deleted_by,
    purge_at: row.purge_at,
    author_name: row.author_name ?? "Unknown",
    prompt_text: row.prompt_text,
    comments: [],
  };
};

const mapComment = (row: DiaryCommentRow): DiaryCommentWithMeta => {
  return {
    id: row.id,
    entry_id: row.entry_id,
    couple_id: row.couple_id,
    author_id: row.author_id,
    content: row.content,
    created_at: row.created_at,
    deleted_at: row.deleted_at,
    author_name: row.author_name ?? "Unknown",
  };
};

const mapReminder = (row: ReminderRow): ReminderWithMeta => {
  return {
    id: row.id,
    couple_id: row.couple_id,
    created_by: row.created_by,
    title: row.title,
    note: row.note,
    remind_at: row.remind_at,
    is_done: row.is_done,
    done_at: row.done_at,
    in_app_notified_at: row.in_app_notified_at,
    web_push_notified_at: row.web_push_notified_at,
    created_at: row.created_at,
    creator_name: row.creator_name ?? "Unknown",
  };
};

const attachComments = (
  entries: DiaryEntryWithMeta[],
  comments: DiaryCommentWithMeta[],
): DiaryEntryWithMeta[] => {
  const grouped = new Map<string, DiaryCommentWithMeta[]>();

  for (const comment of comments) {
    const list = grouped.get(comment.entry_id) ?? [];
    list.push(comment);
    grouped.set(comment.entry_id, list);
  }

  return entries.map((entry) => ({
    ...entry,
    comments: grouped.get(entry.id) ?? [],
  }));
};

export const getDiaryCommentsByEntryIds = async (
  coupleId: string,
  entryIds: string[],
): Promise<DiaryCommentWithMeta[]> => {
  if (entryIds.length === 0) {
    return [];
  }

  const rows = await dbQuery<DiaryCommentRow>(
    `
    select
      c.id,
      c.entry_id,
      c.couple_id,
      c.author_id,
      c.content,
      c.created_at,
      c.deleted_at,
      u.display_name as author_name
    from diary_comments c
    join users u on u.id = c.author_id
    where c.couple_id = $1
      and c.deleted_at is null
      and c.entry_id = any($2::uuid[])
    order by c.created_at asc
    `,
    [coupleId, entryIds],
  );

  return rows.map(mapComment);
};

export const getLatestPhoto = async (coupleId: string): Promise<PhotoWithMeta | null> => {
  const row = await dbQueryOne<PhotoWithUserRow>(
    `
    select
      p.id,
      p.couple_id,
      p.uploaded_by,
      p.object_key,
      p.image_url,
      p.caption,
      p.taken_at,
      p.created_at,
      p.deleted_at,
      p.deleted_by,
      p.purge_at,
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
      and p.deleted_at is null
    order by p.created_at desc
    limit 1
    `,
    [coupleId],
  );

  if (!row) {
    return null;
  }

  return mapPhoto(row);
};

export const getLatestDiaryEntry = async (coupleId: string): Promise<DiaryEntryWithMeta | null> => {
  const row = await dbQueryOne<DiaryWithUserRow>(
    `
    select
      d.id,
      d.couple_id,
      d.author_id,
      d.prompt_id,
      d.entry_date,
      d.content,
      d.visibility,
      d.created_at,
      d.deleted_at,
      d.deleted_by,
      d.purge_at,
      u.display_name as author_name,
      p.prompt_text
    from diary_entries d
    join users u on u.id = d.author_id
    left join diary_prompts p on p.id = d.prompt_id
    where d.couple_id = $1
      and d.deleted_at is null
    order by d.created_at desc
    limit 1
    `,
    [coupleId],
  );

  if (!row) {
    return null;
  }

  const entry = mapDiary(row);
  const comments = await getDiaryCommentsByEntryIds(coupleId, [entry.id]);

  return {
    ...entry,
    comments,
  };
};

export const getPetState = async (coupleId: string): Promise<PetState | null> => {
  const row = await dbQueryOne<PetRow>(
    `
    select id, couple_id, level, growth_points, mood, health, last_interaction_date, current_stage, updated_at
    from pet_state
    where couple_id = $1
    `,
    [coupleId],
  );

  return row;
};

export const getPhotoList = async (
  coupleId: string,
  options: { limit?: number; cursorCreatedAt?: string; cursorId?: string } = {},
): Promise<PhotoWithMeta[]> => {
  const limit = options.limit ?? 24;
  const cursorCreatedAt = options.cursorCreatedAt ?? null;
  const cursorId = options.cursorId ?? null;

  const rows = await dbQuery<PhotoWithUserRow>(
    `
    select
      p.id,
      p.couple_id,
      p.uploaded_by,
      p.object_key,
      p.image_url,
      p.caption,
      p.taken_at,
      p.created_at,
      p.deleted_at,
      p.deleted_by,
      p.purge_at,
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
      and p.deleted_at is null
      and (
        $3::timestamptz is null
        or (p.created_at, p.id) < ($3::timestamptz, $4::uuid)
      )
    order by p.created_at desc, p.id desc
    limit $2
    `,
    [coupleId, limit, cursorCreatedAt, cursorId],
  );

  return rows.map(mapPhoto);
};

export const getPhotoDetail = async (coupleId: string, photoId: string): Promise<PhotoWithMeta | null> => {
  const row = await dbQueryOne<PhotoWithUserRow>(
    `
    select
      p.id,
      p.couple_id,
      p.uploaded_by,
      p.object_key,
      p.image_url,
      p.caption,
      p.taken_at,
      p.created_at,
      p.deleted_at,
      p.deleted_by,
      p.purge_at,
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
      and p.id = $2
      and p.deleted_at is null
    limit 1
    `,
    [coupleId, photoId],
  );

  if (!row) {
    return null;
  }

  return mapPhoto(row);
};

export const getDiaryEntries = async (coupleId: string): Promise<DiaryEntryWithMeta[]> => {
  const rows = await dbQuery<DiaryWithUserRow>(
    `
    select
      d.id,
      d.couple_id,
      d.author_id,
      d.prompt_id,
      d.entry_date,
      d.content,
      d.visibility,
      d.created_at,
      d.deleted_at,
      d.deleted_by,
      d.purge_at,
      u.display_name as author_name,
      p.prompt_text
    from diary_entries d
    join users u on u.id = d.author_id
    left join diary_prompts p on p.id = d.prompt_id
    where d.couple_id = $1
      and d.deleted_at is null
    order by d.entry_date desc, d.created_at desc
    limit 60
    `,
    [coupleId],
  );

  const entries = rows.map(mapDiary);
  const entryIds = entries.map((entry) => entry.id);
  const comments = await getDiaryCommentsByEntryIds(coupleId, entryIds);

  return attachComments(entries, comments);
};

export const getTrashPhotos = async (coupleId: string): Promise<TrashPhotoItem[]> => {
  const rows = await dbQuery<PhotoWithUserRow>(
    `
    select
      p.id,
      p.couple_id,
      p.uploaded_by,
      p.object_key,
      p.image_url,
      p.caption,
      p.taken_at,
      p.created_at,
      p.deleted_at,
      p.deleted_by,
      p.purge_at,
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
      and p.deleted_at is not null
    order by p.deleted_at desc
    limit 100
    `,
    [coupleId],
  );

  return rows
    .filter((row): row is PhotoWithUserRow & { deleted_at: string } => row.deleted_at !== null)
    .map((row) => ({
      ...mapPhoto(row),
      deleted_at: row.deleted_at,
      purge_at: row.purge_at,
    }));
};

export const getTrashDiaryEntries = async (coupleId: string): Promise<TrashDiaryItem[]> => {
  const rows = await dbQuery<DiaryWithUserRow>(
    `
    select
      d.id,
      d.couple_id,
      d.author_id,
      d.prompt_id,
      d.entry_date,
      d.content,
      d.visibility,
      d.created_at,
      d.deleted_at,
      d.deleted_by,
      d.purge_at,
      u.display_name as author_name,
      p.prompt_text
    from diary_entries d
    join users u on u.id = d.author_id
    left join diary_prompts p on p.id = d.prompt_id
    where d.couple_id = $1
      and d.deleted_at is not null
    order by d.deleted_at desc
    limit 100
    `,
    [coupleId],
  );

  return rows
    .filter((row): row is DiaryWithUserRow & { deleted_at: string } => row.deleted_at !== null)
    .map((row) => ({
      ...mapDiary(row),
      deleted_at: row.deleted_at,
      purge_at: row.purge_at,
      comments: [],
    }));
};

export const getReminders = async (coupleId: string): Promise<ReminderWithMeta[]> => {
  const rows = await dbQuery<ReminderRow>(
    `
    select
      r.id,
      r.couple_id,
      r.created_by,
      r.title,
      r.note,
      r.remind_at,
      r.is_done,
      r.done_at,
      r.in_app_notified_at,
      r.web_push_notified_at,
      r.created_at,
      u.display_name as creator_name
    from reminders r
    join users u on u.id = r.created_by
    where r.couple_id = $1
    order by r.is_done asc, r.remind_at asc
    limit 200
    `,
    [coupleId],
  );

  return rows.map(mapReminder);
};

export const getPetInteractions = async (coupleId: string): Promise<PetInteraction[]> => {
  const rows = await dbQuery<PetInteraction>(
    `
    select id, couple_id, user_id, action_type, growth_delta, mood_delta, health_delta, created_at
    from pet_interactions
    where couple_id = $1
    order by created_at desc
    limit 30
    `,
    [coupleId],
  );

  return rows;
};

export const getDashboardSnapshot = async (coupleId: string) => {
  const [prompt, petState, latestPhoto, latestDiary, reminders] = await Promise.all([
    getTodayPrompt(),
    getPetState(coupleId),
    getLatestPhoto(coupleId),
    getLatestDiaryEntry(coupleId),
    getReminders(coupleId),
  ]);

  const nextReminder = reminders.find((item) => !item.is_done) ?? null;

  return {
    prompt,
    petState,
    latestPhoto,
    latestDiary,
    nextReminder,
  };
};
