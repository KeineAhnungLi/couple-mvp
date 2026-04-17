"use server";

import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { withTransaction } from "@/lib/server/db";

const generateInviteCode = () => {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
};

const parseDbActionError = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.startsWith("ACTION:")) {
    return error.message.replace("ACTION:", "");
  }

  const dbCode =
    typeof error === "object" &&
    error !== null &&
    "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const dbConstraint =
    typeof error === "object" &&
    error !== null &&
    "constraint" in error
      ? String((error as { constraint: unknown }).constraint)
      : "";

  if (dbCode === "23505" && dbConstraint.includes("couple_members_user_id")) {
    return "你已经加入了另一个情侣空间";
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  return fallback;
};

const throwActionError = (message: string) => {
  throw new Error(`ACTION:${message}`);
};

const redirectWithError = (message: string): never => {
  redirect(`/onboarding?error=${encodeURIComponent(message)}`);
};

export const createCoupleAction = async (formData: FormData) => {
  const context = await requireAuth();

  if (context.membership) {
    return redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return redirectWithError("请输入空间名称");
  }

  let inviteCode = "";
  let created = false;
  let lastError = "创建空间失败";

  for (let i = 0; i < 5; i += 1) {
    inviteCode = generateInviteCode();

    try {
      await withTransaction(async (client) => {
        const coupleRes = await client.query<{ id: string }>(
          `
          insert into couples (name, invite_code, status, created_by)
          values ($1, $2, 'open', $3)
          returning id
          `,
          [name, inviteCode, context.userId],
        );

        const coupleId = coupleRes.rows[0]?.id;

        if (!coupleId) {
          throwActionError("创建空间失败");
        }

        await client.query(
          `
          insert into couple_members (couple_id, user_id, role)
          values ($1, $2, 'owner')
          `,
          [coupleId, context.userId],
        );
      });

      created = true;
      break;
    } catch (error) {
      const dbCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? String((error as { code: unknown }).code)
          : "";

      if (dbCode === "23505") {
        lastError = "邀请码冲突，正在重试";
        continue;
      }

      lastError = parseDbActionError(error, "创建空间失败");
      break;
    }
  }

  if (!created) {
    return redirectWithError(lastError);
  }

  redirect(`/onboarding?invite=${inviteCode}`);
};

const internalJoinByCode = async (inviteCode: string) => {
  const context = await requireAuth();

  if (context.membership) {
    return redirect("/");
  }

  if (!inviteCode) {
    return redirectWithError("邀请码不能为空");
  }

  try {
    await withTransaction(async (client) => {
      const coupleRes = await client.query<{ id: string; status: string }>(
        `
        select id, status
        from couples
        where invite_code = $1
        for update
        `,
        [inviteCode],
      );

      const couple = coupleRes.rows[0];

      if (!couple) {
        throwActionError("邀请码不存在");
      }

      if (couple.status !== "open") {
        throwActionError("该空间已满员或不可加入");
      }

      const memberCountRes = await client.query<{ total: string }>(
        `
        select count(*)::text as total
        from couple_members
        where couple_id = $1
        `,
        [couple.id],
      );

      const memberCount = Number(memberCountRes.rows[0]?.total ?? "0");

      if (memberCount >= 2) {
        await client.query(`update couples set status = 'full' where id = $1`, [couple.id]);
        throwActionError("该空间已满员");
      }

      await client.query(
        `
        insert into couple_members (couple_id, user_id, role)
        values ($1, $2, 'partner')
        `,
        [couple.id, context.userId],
      );

      if (memberCount + 1 >= 2) {
        await client.query(`update couples set status = 'full' where id = $1`, [couple.id]);
      }
    });
  } catch (error) {
    const message = parseDbActionError(error, "加入空间失败");
    return redirectWithError(message);
  }

  redirect("/");
};

export const joinCoupleAction = async (formData: FormData) => {
  const code = String(formData.get("inviteCode") ?? "")
    .trim()
    .toUpperCase();

  await internalJoinByCode(code);
};

export const joinCoupleByCodeAction = async (inviteCode: string) => {
  await internalJoinByCode(inviteCode.trim().toUpperCase());
};
