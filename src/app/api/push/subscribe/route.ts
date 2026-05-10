import { NextResponse } from "next/server";
import { getViewerContext } from "@/lib/auth";
import { dbQueryOne } from "@/lib/server/db";

interface SubscribePayload {
  endpoint?: unknown;
  keys?: {
    p256dh?: unknown;
    auth?: unknown;
  };
}

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

export async function POST(request: Request) {
  const context = await getViewerContext();

  if (!context) {
    return unauthorized();
  }

  const body = (await request.json().catch(() => null)) as SubscribePayload | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh.trim() : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth.trim() : "";

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "invalid_subscription" }, { status: 400 });
  }

  await dbQueryOne(
    `
    insert into push_subscriptions (user_id, endpoint, p256dh, auth, is_active, updated_at)
    values ($1, $2, $3, $4, true, now())
    on conflict (endpoint)
    do update set
      user_id = excluded.user_id,
      p256dh = excluded.p256dh,
      auth = excluded.auth,
      is_active = true,
      updated_at = now()
    returning id
    `,
    [context.userId, endpoint, p256dh, auth],
  );

  return NextResponse.json({ ok: true });
}

