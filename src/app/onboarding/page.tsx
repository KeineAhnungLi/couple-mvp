import Link from "next/link";
import { redirect } from "next/navigation";
import { createCoupleAction, joinCoupleAction } from "@/app/onboarding/actions";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface OnboardingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const context = await requireAuth();
  const params = await searchParams;
  const inviteCode = typeof params.invite === "string" ? params.invite : null;
  const error = typeof params.error === "string" ? params.error : null;
  const hasMembership = Boolean(context.membership);

  if (hasMembership && !inviteCode && !error) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-6 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">创建或加入双人空间</h1>
        <p className="text-sm text-muted">每个空间最多 2 人，满员后会锁定，第三人无法加入。</p>
      </header>

      {inviteCode ? (
        <section className="space-y-3 rounded-2xl border border-brand bg-brand-soft p-4">
          <p className="text-sm">空间创建成功，请把邀请码发给另一半：</p>
          <p className="text-2xl font-bold tracking-[0.3em]">{inviteCode}</p>
          <p className="text-xs text-muted">
            邀请链接：
            <Link className="underline" href={`/invite/${inviteCode}`}>
              /invite/{inviteCode}
            </Link>
          </p>
        </section>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
      ) : null}

      {hasMembership ? (
        <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
          <p className="text-sm text-muted">你已在情侣空间中。</p>
          <Link href="/" className="inline-block text-sm font-semibold text-brand">
            返回首页
          </Link>
        </section>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">创建空间</h2>
            <form action={createCoupleAction} className="space-y-3">
              <input
                name="name"
                required
                maxLength={60}
                placeholder="例如：我们的小宇宙"
                className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
              />
              <button
                type="submit"
                className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white"
              >
                创建并生成邀请码
              </button>
            </form>
          </section>

          <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
            <h2 className="text-lg font-semibold">加入空间</h2>
            <form action={joinCoupleAction} className="space-y-3">
              <input
                name="inviteCode"
                required
                maxLength={8}
                placeholder="输入邀请码"
                className="h-11 w-full rounded-xl border border-line px-3 text-sm uppercase outline-none ring-brand focus:ring-2"
              />
              <button
                type="submit"
                className="h-11 w-full rounded-xl bg-foreground text-sm font-semibold text-white"
              >
                通过邀请码加入
              </button>
            </form>
          </section>
        </>
      )}
    </main>
  );
}
