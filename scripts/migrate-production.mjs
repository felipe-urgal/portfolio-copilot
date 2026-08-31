#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { requiredDirectDatabaseUrl } from "./production-environment.mjs";

let directDatabaseUrl;

try {
  directDatabaseUrl = requiredDirectDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Configuração de migration inválida.");
  process.exit(1);
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["--filter", "@portfolio-copilot/persistence", "db:migrate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: directDatabaseUrl,
  },
});

if (result.error) {
  console.error("Não foi possível iniciar a migration de produção.");
  process.exit(1);
}

process.exit(result.status ?? 1);
