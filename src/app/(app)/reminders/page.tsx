import {
  createReminderAction,
  deleteReminderAction,
  toggleReminderDoneAction,
} from "@/app/(app)/reminders/actions";
import { requireCoupleContext } from "@/lib/auth";
import { getReminders } from "@/lib/data/dashboard";

interface RemindersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function RemindersPage({ searchParams }: RemindersPageProps) {
  const context = await requireCoupleContext();
  const reminders = await getReminders(context.membership.couple_id);
  const params = await searchParams;

  const saved = params.saved === "1";
  const updated = params.updated === "1";
  const deleted = params.deleted === "1";
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-2xl border border-line bg-surface p-4">
        <h1 className="text-lg font-bold">双人提醒</h1>
        <p className="text-sm text-muted">页面内会自动弹出到点提醒，后续可升级为 HTTPS Web Push。</p>

        {saved ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">提醒创建成功</p> : null}
        {updated ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">提醒状态已更新</p> : null}
        {deleted ? <p className="rounded-xl bg-brand-soft px-3 py-2 text-sm">提醒已删除</p> : null}
        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{decodeURIComponent(error)}</p>
        ) : null}

        <form action={createReminderAction} className="space-y-3">
          <input
            name="title"
            required
            maxLength={80}
            placeholder="提醒标题"
            className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <textarea
            name="note"
            rows={3}
            maxLength={300}
            placeholder="备注（可选）"
            className="w-full rounded-xl border border-line p-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <input
            name="remindAt"
            required
            type="datetime-local"
            className="h-11 w-full rounded-xl border border-line px-3 text-sm outline-none ring-brand focus:ring-2"
          />
          <button type="submit" className="h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white">
            添加提醒
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">提醒列表</h2>
        {reminders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
            还没有提醒。
          </div>
        ) : (
          <ul className="space-y-3">
            {reminders.map((item) => (
              <li key={item.id} className="space-y-2 rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className={`text-sm font-semibold ${item.is_done ? "text-muted line-through" : ""}`}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      提醒时间：{new Date(item.remind_at).toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted">创建人：{item.creator_name}</p>
                    {item.note ? <p className="mt-2 text-sm leading-6">{item.note}</p> : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <form action={toggleReminderDoneAction}>
                    <input type="hidden" name="reminderId" value={item.id} />
                    <input type="hidden" name="done" value={item.is_done ? "0" : "1"} />
                    <button
                      type="submit"
                      className="h-10 w-full rounded-xl border border-line text-xs font-semibold"
                    >
                      {item.is_done ? "标记未完成" : "标记完成"}
                    </button>
                  </form>

                  <form action={deleteReminderAction}>
                    <input type="hidden" name="reminderId" value={item.id} />
                    <button
                      type="submit"
                      className="h-10 w-full rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600"
                    >
                      删除提醒
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
