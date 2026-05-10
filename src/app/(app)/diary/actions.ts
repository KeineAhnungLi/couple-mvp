"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { dbQueryOne } from "@/lib/server/db";

const redirectWithError = (message: string): never => {
  redirect(`/diary?error=${encodeURIComponent(message)}`);
};

const redirectWithEntryError = (entryId: string, message: string): never => {
  redirect(`/diary?entry=${encodeURIComponent(entryId)}&error=${encodeURIComponent(message)}`);
};

export const createDiaryEntryAction = async (formData: FormData) => {
  const context = await requireCoupleContext();

  const content = String(formData.get("content") ?? "").trim();
  const promptIdRaw = String(formData.get("promptId") ?? "").trim();
  const promptId = promptIdRaw ? Number(promptIdRaw) : null;

  if (!content) {
    return redirectWithError("内容不能为空");
  }

  const entryDate = new Date().toISOString().slice(0, 10);

  try {
    await dbQueryOne(
      `
      insert into diary_entries (couple_id, author_id, prompt_id, entry_date, content, visibility)
      values ($1, $2, $3, $4, $5, 'couple')
      returning id
      `,
      [
        context.membership.couple_id,
        context.userId,
        Number.isFinite(promptId) ? promptId : null,
        entryDate,
        content,
      ],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "发布失败";

    return redirectWithError(message);
  }

  redirect("/diary?saved=1");
};

export const moveDiaryEntryToTrashAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const entryId = String(formData.get("entryId") ?? "").trim();

  if (!entryId) {
    return redirectWithError("日记不存在");
  }

  try {
    const row = await dbQueryOne<{ id: string }>(
      `
      update diary_entries
      set deleted_at = now(),
          deleted_by = $3,
          purge_at = now() + interval '30 days'
      where id = $1
        and couple_id = $2
        and deleted_at is null
      returning id
      `,
      [entryId, context.membership.couple_id, context.userId],
    );

    if (!row) {
      return redirectWithError("日记不存在或已删除");
    }
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "删除失败";

    return redirectWithError(message);
  }

  redirect("/diary?deleted=1");
};

export const addDiaryCommentAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const entryId = String(formData.get("entryId") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  if (!entryId) {
    return redirectWithError("未找到日记");
  }

  if (!content) {
    return redirectWithEntryError(entryId, "评论不能为空");
  }

  try {
    const entry = await dbQueryOne<{ id: string }>(
      `
      select id
      from diary_entries
      where id = $1
        and couple_id = $2
        and deleted_at is null
      `,
      [entryId, context.membership.couple_id],
    );

    if (!entry) {
      return redirectWithEntryError(entryId, "日记不存在或已删除");
    }

    await dbQueryOne(
      `
      insert into diary_comments (entry_id, couple_id, author_id, content)
      values ($1, $2, $3, $4)
      returning id
      `,
      [entryId, context.membership.couple_id, context.userId, content],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "评论失败";

    return redirectWithEntryError(entryId, message);
  }

  redirect(`/diary?commented=1&entry=${encodeURIComponent(entryId)}`);
};
