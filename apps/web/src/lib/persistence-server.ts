import {
  createPostgresPersistence,
  type PostgresPersistence,
} from "@portfolio-copilot/persistence";

import { requireAuthenticatedIdentity } from "@/lib/identity-server";

declare global {
  var portfolioCopilotPostgres: PostgresPersistence | undefined;
}

function databaseUrl(): string {
  const value = process.env.DATABASE_URL?.trim();

  if (!value) {
    throw new Error("Server persistence is not configured.");
  }

  return value;
}

function postgresPersistence(): PostgresPersistence {
  globalThis.portfolioCopilotPostgres ??= createPostgresPersistence(databaseUrl());
  return globalThis.portfolioCopilotPostgres;
}

export async function requireOwnedPersistence() {
  const identity = await requireAuthenticatedIdentity();
  return postgresPersistence().ownedBy(identity.subject);
}
