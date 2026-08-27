import { existsSync, readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

function databaseUrlFromRootEnv(): string | undefined {
  const explicit = process.env.DATABASE_URL?.trim();

  if (explicit) {
    return explicit;
  }

  for (const filename of [".env.local", ".env"]) {
    const path = fileURLToPath(new URL(`../../${filename}`, import.meta.url));

    if (!existsSync(path)) {
      continue;
    }

    const value = parseEnv(readFileSync(path, "utf8")).DATABASE_URL?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

const databaseUrl = databaseUrlFromRootEnv();

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is required. Set it in the environment, .env.local, or .env at the repository root.",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
});
