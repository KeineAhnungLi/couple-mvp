import { dbQuery } from "@/lib/server/db";
import type { InAppReminderNotice } from "@/types/domain";

interface PendingPushReminderRow {
  id: string;
  title: string;
  note: string | null;
  remind_at: string;
}

export const getPendingWebPushReminders = async (): Promise<InAppReminderNotice[]> => {
  const rows = await dbQuery<PendingPushReminderRow>(
    `
    select id, title, note, remind_at
    from reminders
    where is_done = false
      and remind_at <= now()
      and web_push_notified_at is null
    order by remind_at asc
    limit 200
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    remind_at: row.remind_at,
  }));
};

export const reserveWebPushDispatch = async (): Promise<{
  pending: number;
  message: string;
}> => {
  const pending = (await getPendingWebPushReminders()).length;

  return {
    pending,
    message: "Web Push reserved only. Enable HTTPS + service worker + VAPID to activate delivery.",
  };
};

