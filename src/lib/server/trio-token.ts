import { createHmac } from "node:crypto";
import { assertEnv, env } from "@/lib/env";

interface TrioIdentityInput {
  userId: string;
  coupleId: string;
  name: string;
}

const encodeBase64Url = (value: string | Buffer): string => {
  return Buffer.from(value).toString("base64url");
};

export const createTrioIdentityToken = ({
  userId,
  coupleId,
  name,
}: TrioIdentityInput): string => {
  assertEnv("TRIO_SHARED_SECRET");
  const payload = encodeBase64Url(
    JSON.stringify({
      sub: userId,
      couple_id: coupleId,
      name: name.trim().slice(0, 24) || "玩家",
      exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    }),
  );
  const signature = createHmac("sha256", env.TRIO_SHARED_SECRET)
    .update(payload)
    .digest("base64url");
  return `${payload}.${signature}`;
};
