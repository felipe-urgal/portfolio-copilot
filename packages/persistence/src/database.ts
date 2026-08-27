import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";

import { openOwnedPersistence, type OwnedPersistence } from "./repositories";
import * as schema from "./schema";

export type PersistenceDatabase = NodePgDatabase<typeof schema>;

export type PostgresConnection = Readonly<{
  db: PersistenceDatabase;
  pool: Pool;
  close: () => Promise<void>;
}>;

export type PostgresPersistence = Readonly<{
  ownedBy: (ownerSubject: string) => Promise<OwnedPersistence>;
  close: () => Promise<void>;
}>;

function normalizedPoolConfig(
  connectionString: string,
  overrides: Omit<PoolConfig, "connectionString">,
): PoolConfig {
  const normalizedConnectionString = connectionString.trim();

  if (!normalizedConnectionString) {
    throw new Error("PostgreSQL connection string is required.");
  }

  return {
    connectionString: normalizedConnectionString,
    max: 10,
    ...overrides,
  };
}

// Package-internal connection primitive. It is intentionally not re-exported
// from the package root so application code cannot bypass ownership repositories.
export function createPostgresConnection(
  connectionString: string,
  overrides: Omit<PoolConfig, "connectionString"> = {},
): PostgresConnection {
  const pool = new Pool(normalizedPoolConfig(connectionString, overrides));
  const db = drizzle({ client: pool, schema });

  return {
    db,
    pool,
    close: async () => pool.end(),
  };
}

export function createPostgresPersistence(
  connectionString: string,
  overrides: Omit<PoolConfig, "connectionString"> = {},
): PostgresPersistence {
  const connection = createPostgresConnection(connectionString, overrides);

  return {
    ownedBy: async (ownerSubject) => openOwnedPersistence(connection.db, ownerSubject),
    close: connection.close,
  };
}
