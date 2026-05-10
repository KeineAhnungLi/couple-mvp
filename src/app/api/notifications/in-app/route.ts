import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth";
import { dbQuery } from "@/lib/server/db";
import type { InAppReminderNotice } from "@/types/domain";

interface DueReminderRow {
  id: string;
  title: string;
  note: string | null;
  remind_at: string;
}

const unauthorized = () => {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
};

export async function GET() {
  const context = await getViewerContext();

  if (!context?.membership || !context.couple) {
    return unauthorized();
  }

  const rows = await dbQuery<DueReminderRow>(
    `
    select id, title, note, remind_at
    from reminders
    where couple_id = $1
      and is_done = false
      and remind_at <= now()
      and in_app_notified_at is null
    order by remind_at asc
    limit 20
    `,
    [context.membership.couple_id],
  );

  const items: InAppReminderNotice[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    note: row.note,
    remind_at: row.remind_at,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const context = await getViewerContext();

  if (!context?.membership || !context.couple) {
    return unauthorized();
  }

  const payload = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = Array.isArray(payload?.ids)
    ? payload.ids.filter((value): value is string => typeof value === "string" && value.length > 0)
    : [];

  if (ids.length === 0) {
    return NextResponse.json({ error: "invalid_ids" }, { status: 400 });
  }

  const updated = await dbQuery<{ id: string }>(
    `
    update reminders
    set in_app_notified_at = now()
    where couple_id = $1
      and id = any($2::uuid[])
      and is_done = false
      and remind_at <= now()
    returning id
    `,
    [context.membership.couple_id, ids],
  );

  return NextResponse.json({ acknowledged: updated.length });
}

