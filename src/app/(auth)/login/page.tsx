import { redirect } from "next/navigation";
import { sendLoginOtpAction } from "@/app/(auth)/login/actions";
import { getViewerContext } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  if (!isSupabaseConfigured) {
    return (
      <section className="space-y-4 rounded-2xl border border-line bg-surface p-5">
        <h1 className="text-xl font-bold">CoupleSpace 登录</h1>
        <p className="text-sm text-muted">
          请先配置 `.env.local` 中的 Supabase 环境变量，再刷新页面。
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

  const sent = params.sent === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <section className="space-y-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">
          CoupleSpace MVP
        </p>
        <h1 className="text-2xl font-bold">私密双人空间登录</h1>
        <p className="text-sm text-muted">使用邮箱 OTP 登录，首次登录后可创建或加入情侣空间。</p>
      </div>

      {sent ? (
        <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm text-foreground">
          邮件已发送，请点击邮箱中的登录链接。
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
      ) : null}

      <form action={sendLoginOtpAction} className="space-y-3">
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

        <button
          type="submit"
          className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white"
        >
          发送登录链接
        </button>
      </form>
    </section>
  );
}
