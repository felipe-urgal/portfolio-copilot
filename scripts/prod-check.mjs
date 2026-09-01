#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { createCheckEnvironment } from "./check-environment.mjs";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const steps = [
  ["format:check"],
  ["lint"],
  ["typecheck"],
  ["db:migrate"],
  ["test"],
  ["build"],
];

let environment;
try {
  environment = createCheckEnvironment();
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Configuração do banco de check inválida.",
  );
  process.exit(1);
}

for (const [script] of steps) {
  const result = spawnSync(command, [script], {
    stdio: "inherit",
    env: environment,
  });

  if (result.error) {
    console.error(`Não foi possível iniciar o gate ${script}.`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
