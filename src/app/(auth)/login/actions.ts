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

export const loginWithPasswordAction = async (formData: FormData) => {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=邮箱和密码不能为空");
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
    redirect("/login?error=账号不存在或不可用");
  }

  const ok = await verifyPassword(password, user.password_hash);

  if (!ok) {
    redirect("/login?error=邮箱或密码错误");
  }

  await createUserSession(user.id);
  redirect("/");
};
