"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { dbQuery, dbQueryOne, withTransaction } from "@/lib/server/db";
import { deletePhotoFromCos } from "@/lib/server/storage";

const redirectWithError = (message: string): never => {
  redirect(`/trash?error=${encodeURIComponent(message)}`);
};

export const restorePhotoFromTrashAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const photoId = String(formData.get("photoId") ?? "").trim();

  if (!photoId) {
    return redirectWithError("照片不存在");
  }

  try {
    await dbQueryOne(
      `
      update photos
      set deleted_at = null,
          deleted_by = null,
          purge_at = null
      where id = $1
        and couple_id = $2
        and deleted_at is not null
      returning id
      `,
      [photoId, context.membership.couple_id],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "恢复照片失败";
    return redirectWithError(message);
  }

  redirect("/trash?restored=1");
};

export const restoreDiaryFromTrashAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const entryId = String(formData.get("entryId") ?? "").trim();

  if (!entryId) {
    return redirectWithError("日记不存在");
  }

  try {
    await dbQueryOne(
      `
      update diary_entries
      set deleted_at = null,
          deleted_by = null,
          purge_at = null
      where id = $1
        and couple_id = $2
        and deleted_at is not null
      returning id
      `,
      [entryId, context.membership.couple_id],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "恢复日记失败";
    return redirectWithError(message);
  }

  redirect("/trash?restored=1");
};

export const emptyTrashAction = async () => {
  const context = await requireCoupleContext();
  let photoObjectKeys: string[] = [];

  try {
    await withTransaction(async (client) => {
      const photoRows = await client.query<{ object_key: string }>(
        `
        select object_key
        from photos
        where couple_id = $1
          and deleted_at is not null
        `,
        [context.membership.couple_id],
      );

      photoObjectKeys = photoRows.rows.map((row) => row.object_key);

      await client.query(
        `
        delete from photos
        where couple_id = $1
          and deleted_at is not null
        `,
        [context.membership.couple_id],
      );

      await client.query(
        `
        delete from diary_entries
        where couple_id = $1
          and deleted_at is not null
        `,
        [context.membership.couple_id],
      );
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "清空垃圾箱失败";
    return redirectWithError(message);
  }

  for (const key of photoObjectKeys) {
    try {
      await deletePhotoFromCos(key);
    } catch {
      // keep DB deletion successful even if one COS object cleanup fails
    }
  }

  redirect("/trash?emptied=1");
};

export const cleanupExpiredTrashAction = async () => {
  const context = await requireCoupleContext();
  let photoObjectKeys: string[] = [];

  try {
    photoObjectKeys = (
      await dbQuery<{ object_key: string }>(
        `
        select object_key
        from photos
        where couple_id = $1
          and deleted_at is not null
          and purge_at is not null
          and purge_at <= now()
        `,
        [context.membership.couple_id],
      )
    ).map((row) => row.object_key);

    await dbQueryOne(
      `
      delete from photos
      where couple_id = $1
        and deleted_at is not null
        and purge_at is not null
        and purge_at <= now()
      returning id
      `,
      [context.membership.couple_id],
    );

    await dbQueryOne(
      `
      delete from diary_entries
      where couple_id = $1
        and deleted_at is not null
        and purge_at is not null
        and purge_at <= now()
      returning id
      `,
      [context.membership.couple_id],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "清理过期垃圾失败";
    return redirectWithError(message);
  }

  for (const key of photoObjectKeys) {
    try {
      await deletePhotoFromCos(key);
    } catch {
      // ignore COS cleanup error
    }
  }

  redirect("/trash?cleaned=1");
};

