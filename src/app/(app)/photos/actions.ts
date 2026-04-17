"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { dbQueryOne } from "@/lib/server/db";
import { uploadPhotoToCos } from "@/lib/server/storage";

const MAX_FILE_SIZE = 15 * 1024 * 1024;

const redirectWithError = (message: string): never => {
  redirect(`/photos?error=${encodeURIComponent(message)}`);
};

export const uploadPhotoAction = async (formData: FormData) => {
  const context = await requireCoupleContext();

  const photoEntry = formData.get("photo");
  const caption = String(formData.get("caption") ?? "").trim();

  if (!(photoEntry instanceof File) || photoEntry.size === 0) {
    return redirectWithError("请选择照片");
  }

  const photo = photoEntry;

  if (!photo.type.startsWith("image/")) {
    return redirectWithError("仅支持图片文件");
  }

  if (photo.size > MAX_FILE_SIZE) {
    return redirectWithError("图片不能超过15MB");
  }

  try {
    const uploaded = await uploadPhotoToCos({
      file: photo,
      coupleId: context.membership.couple_id,
    });

    await dbQueryOne(
      `
      insert into photos (couple_id, uploaded_by, object_key, image_url, caption, taken_at)
      values ($1, $2, $3, $4, $5, $6)
      returning id
      `,
      [
        context.membership.couple_id,
        context.userId,
        uploaded.objectKey,
        uploaded.url,
        caption || null,
        new Date().toISOString(),
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "上传失败，请稍后重试";

    return redirectWithError(message);
  }

  redirect("/photos?uploaded=1");
};
