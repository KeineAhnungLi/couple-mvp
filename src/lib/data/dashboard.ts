import { dbQuery, dbQueryOne } from "@/lib/server/db";
import { getTodayPrompt } from "@/lib/data/prompts";
import type { DiaryEntryWithMeta, PetState, PhotoWithMeta } from "@/types/domain";

interface PhotoWithUserRow {
  id: string;
  couple_id: string;
  uploaded_by: string;
  object_key: string;
  image_url: string;
  caption: string | null;
  taken_at: string | null;
  created_at: string;
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
  author_name: string | null;
  prompt_text: string | null;
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
    author_name: row.author_name ?? "Unknown",
    prompt_text: row.prompt_text,
  };
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
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
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
      u.display_name as author_name,
      p.prompt_text
    from diary_entries d
    join users u on u.id = d.author_id
    left join diary_prompts p on p.id = d.prompt_id
    where d.couple_id = $1
    order by d.created_at desc
    limit 1
    `,
    [coupleId],
  );

  if (!row) {
    return null;
  }

  return mapDiary(row);
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

export const getPhotoList = async (coupleId: string): Promise<PhotoWithMeta[]> => {
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
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
    order by p.created_at desc
    limit 60
    `,
    [coupleId],
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
      u.display_name as uploader_name
    from photos p
    join users u on u.id = p.uploaded_by
    where p.couple_id = $1
      and p.id = $2
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
      u.display_name as author_name,
      p.prompt_text
    from diary_entries d
    join users u on u.id = d.author_id
    left join diary_prompts p on p.id = d.prompt_id
    where d.couple_id = $1
    order by d.entry_date desc, d.created_at desc
    limit 60
    `,
    [coupleId],
  );

  return rows.map(mapDiary);
};

export const getDashboardSnapshot = async (coupleId: string) => {
  const [prompt, petState, latestPhoto, latestDiary] = await Promise.all([
    getTodayPrompt(),
    getPetState(coupleId),
    getLatestPhoto(coupleId),
    getLatestDiaryEntry(coupleId),
  ]);

  return {
    prompt,
    petState,
    latestPhoto,
    latestDiary,
  };
};
