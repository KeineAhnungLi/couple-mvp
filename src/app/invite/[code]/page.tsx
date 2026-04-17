import Link from "next/link";
import { joinCoupleByCodeAction } from "@/app/onboarding/actions";
import { requireAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface InvitePageProps {
  params: Promise<{ code: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  await requireAuth();
  const { code } = await params;
  const inviteCode = code.trim().toUpperCase();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-6 py-8">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-xl font-bold">加入情侣空间</h1>
        <p className="text-sm text-muted">
          你正在使用邀请码 <span className="font-semibold text-foreground">{inviteCode}</span>
          加入空间。
        </p>

        <form
          action={async () => {
            "use server";
            await joinCoupleByCodeAction(inviteCode);
          }}
        >
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white"
          >
            确认加入
          </button>
        </form>

        <Link href="/onboarding" className="block text-center text-sm text-muted underline">
          返回 onboarding
        </Link>
      </section>
    </main>
  );
}
