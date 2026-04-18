import { createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { assertEnv, env, useSecureSessionCookie } from "@/lib/env";
import { dbQueryOne } from "@/lib/server/db";
import type { SessionUser } from "@/types/domain";

interface SessionRow {
  id: string;
  user_id: string;
  expires_at: string;
}

interface SessionLookupRow {
  session_id: string;
  user_id: string;
  expires_at: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  expiresAt: string;
  user: SessionUser;
}

const nowPlusDays = (days: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

const hashToken = (token: string): string => {
  assertEnv("SESSION_SECRET");
  return createHmac("sha256", env.SESSION_SECRET).update(token).digest("hex");
};

const generateSessionToken = (): string => {
  return randomBytes(32).toString("hex");
};

const setSessionCookie = async (token: string, expiresAt: Date) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: env.SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: useSecureSessionCookie,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: env.SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: useSecureSessionCookie,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });
};

export const createUserSession = async (userId: string): Promise<void> => {
  assertEnv("SESSION_SECRET");

  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = nowPlusDays(env.SESSION_TTL_DAYS);

  await dbQueryOne<SessionRow>(
    `
    insert into sessions (token_hash, user_id, expires_at)
    values ($1, $2, $3)
    returning id, user_id, expires_at
    `,
    [tokenHash, userId, expiresAt.toISOString()],
  );

  await setSessionCookie(token, expiresAt);
};

export const destroyCurrentSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (token) {
    const tokenHash = hashToken(token);
    await dbQueryOne(
      `
      delete from sessions
      where token_hash = $1
      returning id
      `,
      [tokenHash],
    );
  }

  await clearSessionCookie();
};

export const getCurrentSession = async (): Promise<AuthSession | null> => {
  assertEnv("SESSION_SECRET");

  const cookieStore = await cookies();
  const token = cookieStore.get(env.SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);

  const row = await dbQueryOne<SessionLookupRow>(
    `
    select
      s.id as session_id,
      s.user_id,
      s.expires_at,
      u.email,
      u.display_name,
      u.avatar_url,
      u.is_active
    from sessions s
    join users u on u.id = s.user_id
    where s.token_hash = $1
      and s.expires_at > now()
    `,
    [tokenHash],
  );

  if (!row || !row.is_active) {
    await clearSessionCookie();
    return null;
  }

  return {
    sessionId: row.session_id,
    userId: row.user_id,
    expiresAt: row.expires_at,
    user: {
      id: row.user_id,
      email: row.email,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      is_active: row.is_active,
    },
  };
};

