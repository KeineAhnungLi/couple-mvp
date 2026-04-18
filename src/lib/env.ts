const readEnv = (key: string, fallback = ""): string => {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }
  return value;
};

const readBooleanEnv = (key: string): boolean | null => {
  const value = process.env[key];
  if (typeof value !== "string" || value.trim() === "") {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return null;
};

export const env = {
  NODE_ENV: readEnv("NODE_ENV", "development"),
  DATABASE_URL: readEnv("DATABASE_URL"),
  APP_BASE_URL: readEnv("APP_BASE_URL", "http://localhost:3000"),
  NEXT_PUBLIC_APP_URL: readEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  SESSION_SECRET: readEnv("SESSION_SECRET"),
  SESSION_COOKIE_NAME: readEnv("SESSION_COOKIE_NAME", "couple_session"),
  SESSION_TTL_DAYS: Number(readEnv("SESSION_TTL_DAYS", "30")),
  COS_SECRET_ID: readEnv("COS_SECRET_ID"),
  COS_SECRET_KEY: readEnv("COS_SECRET_KEY"),
  COS_REGION: readEnv("COS_REGION"),
  COS_BUCKET: readEnv("COS_BUCKET"),
  COS_PUBLIC_BASE_URL: readEnv("COS_PUBLIC_BASE_URL"),
};

export const isProduction = env.NODE_ENV === "production";
export const useSecureSessionCookie =
  readBooleanEnv("SESSION_COOKIE_SECURE") ?? env.APP_BASE_URL.startsWith("https://");

export const assertEnv = (...keys: Array<keyof typeof env>) => {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
};
