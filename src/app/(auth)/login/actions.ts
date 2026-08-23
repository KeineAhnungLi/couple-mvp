"use server";

import { redirect } from "next/navigation";
import { dbQueryOne } from "@/lib/server/db";
import { createUserSession } from "@/lib/server/session";
import { verifyPassword } from "@/lib/server/password";

interface LoginUserRow {
  id: string;
  email: string;
  password_hash: string;
  is_active: boolean;
}

interface UserCoupleStateRow {
  has_couple: boolean;
}

const safeNextPath = (value: string): string | null => {
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  return value;
};

const redirectWithError = (message: string, nextPath: string | null): never => {
  const query = new URLSearchParams({ error: message });
  if (nextPath) query.set("next", nextPath);
  redirect(`/login?${query.toString()}`);
};

export const loginWithPasswordAction = async (formData: FormData) => {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(String(formData.get("next") ?? "").trim());

  if (!email || !password) return redirectWithError("邮箱和密码不能为空", nextPath);

  const user = await dbQueryOne<LoginUserRow>(
    `select id, email, password_hash, is_active from users where email = $1`,
    [email],
  );

  if (!user || !user.is_active) return redirectWithError("账号不存在或不可用", nextPath);
  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return redirectWithError("邮箱或密码错误", nextPath);

  const userCoupleState = await dbQueryOne<UserCoupleStateRow>(
    `select exists(
       select 1 from couple_members cm
       join couples c on c.id = cm.couple_id
       where cm.user_id = $1
     ) as has_couple`,
    [user.id],
  );

  await createUserSession(user.id);
  redirect(nextPath || (userCoupleState?.has_couple ? "/" : "/onboarding"));
};
