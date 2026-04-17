import { redirect } from "next/navigation";
import { loginWithPasswordAction } from "@/app/(auth)/login/actions";
import { getViewerContext } from "@/lib/auth";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (!env.DATABASE_URL || !env.SESSION_SECRET) {
    return (
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h1 className="text-xl font-bold">CoupleSpace 登录</h1>
        <p className="text-sm text-muted">
          请先配置 `.env.local` 中的 `DATABASE_URL` 和 `SESSION_SECRET`。
        </p>
      </section>
    );
  }

  const context = await getViewerContext();

  if (context?.membership) {
    redirect("/");
  }

  if (context && !context.membership) {
    redirect("/onboarding");
  }

  const error = typeof params.error === "string" ? params.error : null;

  return (
    <section className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">CoupleSpace MVP</p>
        <h1 className="text-2xl font-bold">私密双人空间登录</h1>
        <p className="text-sm text-muted">使用邮箱和密码登录，第一版默认仅支持管理员预置账号。</p>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
      ) : null}

      <form action={loginWithPasswordAction} className="space-y-3">
        <label className="flex flex-col gap-2 text-sm">
          邮箱
          <input
            required
            type="email"
            name="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          密码
          <input
            required
            type="password"
            name="password"
            placeholder="请输入密码"
            className="h-11 rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
        </label>

        <button type="submit" className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white">
          登录
        </button>
      </form>
    </section>
  );
}
