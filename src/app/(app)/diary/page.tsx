import { createDiaryEntryAction } from "@/app/(app)/diary/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getDiaryEntries } from "@/lib/data/dashboard";
import { getTodayPrompt } from "@/lib/data/prompts";

interface DiaryPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DiaryPage({ searchParams }: DiaryPageProps) {
  const context = await requireCoupleContext();
  const [todayPrompt, entries, params] = await Promise.all([
    getTodayPrompt(),
    getDiaryEntries(context.membership.couple_id),
    searchParams,
  ]);

  const saved = params.saved === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">今日日记</h1>
        <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">{todayPrompt.promptText}</p>

        {saved ? <p className="text-sm text-green-600">发布成功</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        <form action={createDiaryEntryAction} className="space-y-3">
          <input type="hidden" name="promptId" value={todayPrompt.id ?? ""} />
          <textarea
            name="content"
            required
            rows={5}
            placeholder="写下今天的心情..."
            className="w-full rounded-xl border border-line p-3 text-sm leading-6 outline-none ring-brand focus:ring-2"
          />
          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white"
          >
            发布日记
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">历史日记</h2>
        {entries.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            暂无历史日记。
          </div>
        ) : (
          <ul className="space-y-3">
            {entries.map((entry) => (
              <li key={entry.id} className="rounded-2xl border border-line bg-surface p-4">
                <p className="text-sm leading-6">{entry.content}</p>
                <div className="mt-2 text-xs text-muted">
                  <p>{entry.author_name}</p>
                  <p>{new Date(entry.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

