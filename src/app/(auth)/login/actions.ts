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

const redirectWithError = (message: string): never => {
  redirect(`/login?error=${encodeURIComponent(message)}`);
};

export const loginWithPasswordAction = async (formData: FormData) => {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return redirectWithError("邮箱和密码不能为空");
  }

  const user = await dbQueryOne<LoginUserRow>(
    `
    select id, email, password_hash, is_active
    from users
    where email = $1
    `,
    [email],
  );

  if (!user || !user.is_active) {
    return redirectWithError("账号不存在或不可用");
  }

  const activeUser = user;

  const ok = await verifyPassword(password, activeUser.password_hash);

  if (!ok) {
    return redirectWithError("邮箱或密码错误");
  }

  const userCoupleState = await dbQueryOne<UserCoupleStateRow>(
    `
    select exists(
      select 1
      from couple_members cm
      join couples c on c.id = cm.couple_id
      where cm.user_id = $1
    ) as has_couple
    `,
    [activeUser.id],
  );

  await createUserSession(activeUser.id);
  redirect(userCoupleState?.has_couple ? "/" : "/onboarding");
};
