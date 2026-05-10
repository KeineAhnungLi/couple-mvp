"use server";

import { redirect } from "next/navigation";
import { requireCoupleContext } from "@/lib/auth";
import { dbQueryOne } from "@/lib/server/db";

const redirectWithError = (message: string): never => {
  redirect(`/reminders?error=${encodeURIComponent(message)}`);
};

export const createReminderAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const title = String(formData.get("title") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const remindAtRaw = String(formData.get("remindAt") ?? "").trim();

  if (!title) {
    return redirectWithError("提醒标题不能为空");
  }

  if (!remindAtRaw) {
    return redirectWithError("请选择提醒时间");
  }

  const remindAt = new Date(remindAtRaw);
  if (Number.isNaN(remindAt.getTime())) {
    return redirectWithError("提醒时间格式不正确");
  }

  try {
    await dbQueryOne(
      `
      insert into reminders (couple_id, created_by, title, note, remind_at)
      values ($1, $2, $3, $4, $5)
      returning id
      `,
      [context.membership.couple_id, context.userId, title, note || null, remindAt.toISOString()],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "创建提醒失败";
    return redirectWithError(message);
  }

  redirect("/reminders?saved=1");
};

export const toggleReminderDoneAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const reminderId = String(formData.get("reminderId") ?? "").trim();
  const done = String(formData.get("done") ?? "").trim() === "1";

  if (!reminderId) {
    return redirectWithError("提醒不存在");
  }

  try {
    await dbQueryOne(
      `
      update reminders
      set is_done = $3,
          done_at = case when $3 then now() else null end,
          in_app_notified_at = case when $3 then in_app_notified_at else null end,
          web_push_notified_at = case when $3 then web_push_notified_at else null end
      where id = $1
        and couple_id = $2
      returning id
      `,
      [reminderId, context.membership.couple_id, done],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "更新提醒状态失败";
    return redirectWithError(message);
  }

  redirect("/reminders?updated=1");
};

export const deleteReminderAction = async (formData: FormData) => {
  const context = await requireCoupleContext();
  const reminderId = String(formData.get("reminderId") ?? "").trim();

  if (!reminderId) {
    return redirectWithError("提醒不存在");
  }

  try {
    await dbQueryOne(
      `
      delete from reminders
      where id = $1
        and couple_id = $2
      returning id
      `,
      [reminderId, context.membership.couple_id],
    );
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "删除提醒失败";
    return redirectWithError(message);
  }

  redirect("/reminders?deleted=1");
};
