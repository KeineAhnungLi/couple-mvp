"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { dbQueryOne } from "@/lib/server/db";

const redirectWithError = (message: string): never => {
  redirect(`/diary?error=${encodeURIComponent(message)}`);
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
