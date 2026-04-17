import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { assertEnv, env } from "@/lib/env";

declare global {
  var __coupleMvpPgPool: Pool | undefined;
}

const createPool = () => {
  assertEnv("DATABASE_URL");

  return new Pool({
    connectionString: env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
};

const getPool = (): Pool => {
  if (global.__coupleMvpPgPool) {
    return global.__coupleMvpPgPool;
  }

  const pool = createPool();

  if (env.NODE_ENV !== "production") {
    global.__coupleMvpPgPool = pool;
  }

  return pool;
};

export const dbQuery = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const result = await getPool().query<T>(text, params);
  return result.rows;
};

export const dbQueryOne = async <T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> => {
  const rows = await dbQuery<T>(text, params);
  return rows[0] ?? null;
};

export const withTransaction = async <T>(
  callback: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};
