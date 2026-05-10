"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { InAppReminderNotice } from "@/types/domain";

const POLL_INTERVAL_MS = 20_000;

const uniqueById = (items: InAppReminderNotice[]): InAppReminderNotice[] => {
  const map = new Map<string, InAppReminderNotice>();

  for (const item of items) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime(),
  );
};

export const InAppReminderNotifier = () => {
  const [items, setItems] = useState<InAppReminderNotice[]>([]);
  const inFlightRef = useRef(false);

  const hasItems = items.length > 0;

  const fetchDueReminders = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    try {
      const response = await fetch("/api/notifications/in-app", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { items?: InAppReminderNotice[] };
      const incoming = Array.isArray(data.items) ? data.items : [];

      if (incoming.length === 0) {
        return;
      }

      setItems((prev) => uniqueById([...prev, ...incoming]));
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const acknowledge = async (ids: string[]) => {
    if (ids.length === 0) {
      return;
    }

    await fetch("/api/notifications/in-app", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ ids }),
    }).catch(() => null);
  };

  const topItem = useMemo(() => items[0] ?? null, [items]);

  const dismissOne = async (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await acknowledge([id]);
  };

  const dismissAll = async () => {
    const ids = items.map((item) => item.id);
    setItems([]);
    await acknowledge(ids);
  };

  useEffect(() => {
    fetchDueReminders().catch(() => null);

    const timer = window.setInterval(() => {
      fetchDueReminders().catch(() => null);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [fetchDueReminders]);

  if (!hasItems || !topItem) {
    return null;
  }

  return (
    <aside className="fixed inset-x-0 top-16 z-20 mx-auto w-full max-w-md px-4">
      <div className="space-y-3 rounded-2xl border border-brand/30 bg-surface p-4 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand">提醒到点了</p>
        <p className="text-sm font-semibold">{topItem.title}</p>
        {topItem.note ? <p className="text-sm text-muted">{topItem.note}</p> : null}
        <p className="text-xs text-muted">提醒时间：{new Date(topItem.remind_at).toLocaleString()}</p>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => dismissOne(topItem.id)}
            className="h-9 rounded-xl border border-line text-xs font-semibold"
          >
            知道了
          </button>
          <button
            type="button"
            onClick={dismissAll}
            className="h-9 rounded-xl border border-line text-xs font-semibold"
          >
            全部已读
          </button>
          <Link
            href="/reminders"
            className="flex h-9 items-center justify-center rounded-xl bg-brand text-xs font-semibold text-white"
          >
            去查看
          </Link>
        </div>
      </div>
    </aside>
  );
};
