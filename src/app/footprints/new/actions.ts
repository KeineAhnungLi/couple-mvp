"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { withTransaction } from "@/lib/server/db";
import { uploadFootprintPhotoToCos } from "@/lib/server/footprint-storage";

const MAX_PHOTO_COUNT = 6;
const MAX_PHOTO_SIZE = 8 * 1024 * 1024;
const MAX_TOTAL_PHOTO_SIZE = 18 * 1024 * 1024;

const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const parseOptionalNumber = (value: string): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const redirectWithError = (message: string): never => {
  redirect(`/footprints/new?error=${encodeURIComponent(message)}`);
};

export async function createFootprintEntryAction(formData: FormData) {
  const context = await requireAuth();
  const note = text(formData, "note");
  const province = text(formData, "province");
  const city = text(formData, "city");
  const district = text(formData, "district");
  const placeName = text(formData, "placeName");
  const mood = text(formData, "mood");
  const capturedAtRaw = text(formData, "capturedAt");
  const latitude = parseOptionalNumber(text(formData, "latitude"));
  const longitude = parseOptionalNumber(text(formData, "longitude"));
  const tags = Array.from(new Set(formData.getAll("tags").map((value) => String(value).trim()).filter(Boolean))).slice(0, 10);
  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > MAX_PHOTO_COUNT) {
    return redirectWithError(`一次最多选择 ${MAX_PHOTO_COUNT} 张照片`);
  }

  if (!placeName && !city && !note && files.length === 0) {
    return redirectWithError("至少写下一个地点、几句话，或添加一张照片");
  }

  if (files.some((file) => !file.type.startsWith("image/"))) {
    return redirectWithError("仅支持图片文件");
  }
  if (files.some((file) => file.size > MAX_PHOTO_SIZE)) {
    return redirectWithError("单张照片不能超过 8MB");
  }
  if (files.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_PHOTO_SIZE) {
    return redirectWithError("照片总大小不能超过 18MB");
  }

  const timezoneOffset = Number(text(formData, "timezoneOffset") || "0");
  const capturedAt = capturedAtRaw
    ? new Date(Date.parse(`${capturedAtRaw}:00Z`) + (Number.isFinite(timezoneOffset) ? timezoneOffset : 0) * 60_000)
    : new Date();
  if (Number.isNaN(capturedAt.getTime())) {
    return redirectWithError("记录时间格式不正确");
  }

  if (latitude !== null && (latitude < -90 || latitude > 90)) {
    return redirectWithError("GPS 纬度不正确");
  }
  if (longitude !== null && (longitude < -180 || longitude > 180)) {
    return redirectWithError("GPS 经度不正确");
  }

  const createTrip = formData.get("createTrip") === "on";
  const tripTitle = text(formData, "tripTitle");
  const tripStartDate = text(formData, "tripStartDate");
  const tripEndDate = text(formData, "tripEndDate");

  if (createTrip && (!tripTitle || !tripStartDate || !tripEndDate)) {
    return redirectWithError("旅行名称和起止日期需要填写完整");
  }
  if (createTrip && tripEndDate < tripStartDate) {
    return redirectWithError("旅行结束日期不能早于开始日期");
  }

  let entryId: string;
  try {
    entryId = await withTransaction(async (client) => {
      let tripId: string | null = null;

      if (createTrip) {
        const tripResult = await client.query<{ id: string }>(
          `insert into footprint_trips
             (user_id, title, start_date, end_date, province, city, overall_mood)
           values ($1, $2, $3::date, $4::date, $5, $6, $7)
           returning id`,
          [context.userId, tripTitle, tripStartDate, tripEndDate, province || null, city || null, mood || null],
        );
        tripId = tripResult.rows[0]?.id ?? null;
        if (!tripId) throw new Error("旅行保存失败");
      }

      const entryResult = await client.query<{ id: string }>(
        `insert into footprint_entries
           (user_id, trip_id, captured_at, latitude, longitude, province, city, district, place_name, mood, note, tags)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::text[])
         returning id`,
        [
          context.userId,
          tripId,
          capturedAt.toISOString(),
          latitude,
          longitude,
          province || null,
          city || null,
          district || null,
          placeName || null,
          mood || null,
          note || null,
          tags,
        ],
      );
      const id = entryResult.rows[0]?.id;
      if (!id) throw new Error("记录保存失败");
      return id;
    });
  } catch {
    return redirectWithError("保存失败，请稍后重试");
  }

  let photoFailures = 0;
  for (const [index, file] of files.entries()) {
    try {
      const uploaded = await uploadFootprintPhotoToCos(context.userId, file);
      await withTransaction(async (client) => {
        await client.query(
          `insert into footprint_entry_photos
             (entry_id, user_id, object_key, image_url, sort_order, taken_at)
           values ($1, $2, $3, $4, $5, $6)`,
          [entryId, context.userId, uploaded.objectKey, uploaded.url, index, capturedAt.toISOString()],
        );
      });
    } catch {
      photoFailures += 1;
    }
  }

  redirect(`/footprints?saved=1${photoFailures ? `&photoFailures=${photoFailures}` : ""}`);
}
