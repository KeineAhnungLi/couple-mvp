import { BottomNav } from "@/components/bottom-nav";
import { signOutAction } from "@/app/(app)/actions";
import { requireCoupleContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireCoupleContext();

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-background pb-20">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">CoupleSpace</p>
            <p className="text-sm font-semibold">{context.couple.name}</p>
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-1 text-xs font-medium"
            >
              退出
            </button>
          </form>
        </div>
      </header>

      <main className="space-y-4 px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
