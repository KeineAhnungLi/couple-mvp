const readEnv = (key: string, fallback = ""): string => {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }
  return value;
};

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  NEXT_PUBLIC_SITE_URL: readEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
};

export const isSupabaseConfigured =
  Boolean(env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const assertSupabaseConfigured = () => {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase env missing: please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
  }
};

