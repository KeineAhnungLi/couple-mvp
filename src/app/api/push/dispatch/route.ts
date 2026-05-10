import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { reserveWebPushDispatch } from "@/lib/server/push";

const isAuthorizedCron = (request: Request): boolean => {
  if (!env.NOTIFICATION_CRON_SECRET) {
    return true;
  }

  const token = request.headers.get("x-cron-secret");
  return token === env.NOTIFICATION_CRON_SECRET;
};

export async function POST(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const result = await reserveWebPushDispatch();

  return NextResponse.json(
    {
      ok: false,
      ...result,
      reservedEndpoint: "/api/push/dispatch",
      requiredEnv: [
        "WEB_PUSH_VAPID_PUBLIC_KEY",
        "WEB_PUSH_VAPID_PRIVATE_KEY",
        "WEB_PUSH_SUBJECT",
      ],
    },
    { status: 501 },
  );
}

export async function GET() {
  const result = await reserveWebPushDispatch();

  return NextResponse.json(
    {
      ok: false,
      ...result,
      reservedEndpoint: "/api/push/dispatch",
      requiredEnv: [
        "WEB_PUSH_VAPID_PUBLIC_KEY",
        "WEB_PUSH_VAPID_PRIVATE_KEY",
        "WEB_PUSH_SUBJECT",
      ],
    },
    { status: 501 },
  );
}
