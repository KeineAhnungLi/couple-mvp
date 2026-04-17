import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTodayPrompt } from "@/lib/data/prompts";
import type {
  DiaryEntryWithMeta,
  PetState,
  PhotoWithMeta,
} from "@/types/domain";

export const getSignedPhotoUrl = async (imagePath: string): Promise<string | null> => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.storage
    .from("couple-photos")
    .createSignedUrl(imagePath, 60 * 60);

  if (error) {
    return null;
  }

  return data.signedUrl;
};

export const getLatestPhoto = async (coupleId: string): Promise<PhotoWithMeta | null> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("photos")
    .select("id, couple_id, uploaded_by, image_url, caption, taken_at, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const { data: uploader } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", data.uploaded_by)
    .maybeSingle();

  return {
    ...data,
    uploader_name: uploader?.display_name ?? "Unknown",
    signed_url: await getSignedPhotoUrl(data.image_url),
  };
};

export const getLatestDiaryEntry = async (
  coupleId: string,
): Promise<DiaryEntryWithMeta | null> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("diary_entries")
    .select("id, couple_id, author_id, prompt_id, entry_date, content, visibility, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const [{ data: author }, { data: prompt }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name")
      .eq("id", data.author_id)
      .maybeSingle(),
    data.prompt_id
      ? supabase
          .from("diary_prompts")
          .select("prompt_text")
          .eq("id", data.prompt_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    ...data,
    author_name: author?.display_name ?? "Unknown",
    prompt_text: prompt?.prompt_text ?? null,
  };
};

export const getPetState = async (coupleId: string): Promise<PetState | null> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("pet_state")
    .select(
      "id, couple_id, level, growth_points, mood, health, last_interaction_date, current_stage, updated_at",
    )
    .eq("couple_id", coupleId)
    .maybeSingle();

  return data;
};

export const getPhotoList = async (coupleId: string): Promise<PhotoWithMeta[]> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("photos")
    .select("id, couple_id, uploaded_by, image_url, caption, taken_at, created_at")
    .eq("couple_id", coupleId)
    .order("created_at", { ascending: false })
    .limit(60);

  const photos = data ?? [];

  return Promise.all(
    photos.map(async (photo) => {
      const { data: uploader } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", photo.uploaded_by)
        .maybeSingle();

      return {
        ...photo,
        uploader_name: uploader?.display_name ?? "Unknown",
        signed_url: await getSignedPhotoUrl(photo.image_url),
      };
    }),
  );
};

export const getPhotoDetail = async (
  coupleId: string,
  photoId: string,
): Promise<PhotoWithMeta | null> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("photos")
    .select("id, couple_id, uploaded_by, image_url, caption, taken_at, created_at")
    .eq("couple_id", coupleId)
    .eq("id", photoId)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const { data: uploader } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", data.uploaded_by)
    .maybeSingle();

  return {
    ...data,
    uploader_name: uploader?.display_name ?? "Unknown",
    signed_url: await getSignedPhotoUrl(data.image_url),
  };
};

export const getDiaryEntries = async (coupleId: string): Promise<DiaryEntryWithMeta[]> => {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from("diary_entries")
    .select("id, couple_id, author_id, prompt_id, entry_date, content, visibility, created_at")
    .eq("couple_id", coupleId)
    .order("entry_date", { ascending: false })
    .limit(60);

  const entries = data ?? [];

  return Promise.all(
    entries.map(async (entry) => {
      const [{ data: author }, { data: prompt }] = await Promise.all([
        supabase
          .from("users")
          .select("display_name")
          .eq("id", entry.author_id)
          .maybeSingle(),
        entry.prompt_id
          ? supabase
              .from("diary_prompts")
              .select("prompt_text")
              .eq("id", entry.prompt_id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      return {
        ...entry,
        author_name: author?.display_name ?? "Unknown",
        prompt_text: prompt?.prompt_text ?? null,
      };
    }),
  );
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

