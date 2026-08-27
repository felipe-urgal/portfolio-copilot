import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import * as schema from "./schema";

export type PersistenceDatabase = NodePgDatabase<typeof schema>;

export type PostgresPersistence = Readonly<{
  db: PersistenceDatabase;
  pool: Pool;
  close: () => Promise<void>;
}>;

export function createPostgresPersistence(
  connectionString: string,
  overrides: Omit<PoolConfig, "connectionString"> = {},
): PostgresPersistence {
  const normalizedConnectionString = connectionString.trim();

  if (!normalizedConnectionString) {
    throw new Error("PostgreSQL connection string is required.");
  }

  const pool = new Pool({
    connectionString: normalizedConnectionString,
    max: 10,
    ...overrides,
  });
  const db = drizzle({ client: pool, schema });

  return {
    db,
    pool,
    close: async () => pool.end(),
  };
}
