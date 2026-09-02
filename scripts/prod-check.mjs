#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import {
  createCheckEnvironment,
  waitForCheckDatabase,
} from "./check-environment.mjs";

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const preDatabaseSteps = [["format:check"], ["lint"], ["typecheck"]];
const databaseSteps = [["db:migrate"], ["test"], ["build"]];

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

function runStep(script) {
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

for (const [script] of preDatabaseSteps) {
  runStep(script);
}

try {
  await waitForCheckDatabase(environment.DATABASE_URL);
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Banco isolado de check indisponível.",
  );
  process.exit(1);
}

for (const [script] of databaseSteps) {
  runStep(script);
}
