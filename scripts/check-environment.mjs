import { createConnection } from "node:net";
import { setTimeout as delay } from "node:timers/promises";

const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const LOCAL_COMPOSE_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const DEFAULT_POSTGRES_PORT = 5432;
const LOCAL_COMPOSE_POSTGRES_PORT = 5433;
const DEFAULT_WAIT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRY_INTERVAL_MS = 500;
const DEFAULT_CONNECT_TIMEOUT_MS = 1_000;

const PRODUCTION_ONLY_VARIABLES = [
  "DATABASE_DIRECT_URL",
  "PORTFOLIO_COPILOT_PRODUCTION_READY_URL",
  "AUTH_SECRET",
  "AUTH_GITHUB_ID",
  "AUTH_GITHUB_SECRET",
  "AUTH_GITHUB_ALLOWED_ACCOUNT_ID",
  "VERCEL_TOKEN",
  "VERCEL_TEAM_ID",
];

function parseCheckDatabaseUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("CHECK_DATABASE_URL precisa ser uma URL PostgreSQL válida.");
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error("CHECK_DATABASE_URL precisa usar postgres:// ou postgresql://.");
  }

  if (!url.hostname || !url.pathname || url.pathname === "/") {
    throw new Error("CHECK_DATABASE_URL precisa identificar host e database de teste.");
  }

  return url;
}

function checkDatabaseEndpoint(databaseUrl) {
  const url = parseCheckDatabaseUrl(databaseUrl);
  const port = url.port ? Number.parseInt(url.port, 10) : DEFAULT_POSTGRES_PORT;
  return `${url.hostname}:${port}`;
}

export function requiredCheckDatabaseUrl(env = process.env) {
  const value = env.CHECK_DATABASE_URL?.trim();

  if (!value) {
    throw new Error(
      "prod:check exige CHECK_DATABASE_URL apontando para um banco de teste isolado.",
    );
  }

  parseCheckDatabaseUrl(value);
  return value;
}

export function createCheckEnvironment(env = process.env) {
  const databaseUrl = requiredCheckDatabaseUrl(env);
  const checkEnvironment = {
    ...env,
    DATABASE_URL: databaseUrl,
  };

  delete checkEnvironment.CHECK_DATABASE_URL;

  for (const variable of PRODUCTION_ONLY_VARIABLES) {
    delete checkEnvironment[variable];
  }

  return checkEnvironment;
}

export function probeCheckDatabase(
  databaseUrl,
  connectTimeoutMs = DEFAULT_CONNECT_TIMEOUT_MS,
) {
  const url = parseCheckDatabaseUrl(databaseUrl);
  const port = url.port ? Number.parseInt(url.port, 10) : DEFAULT_POSTGRES_PORT;

  return new Promise((resolve) => {
    const socket = createConnection({ host: url.hostname, port });
    let settled = false;

    const finish = (ready) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ready);
    };

    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
    socket.setTimeout(connectTimeoutMs, () => finish(false));
  });
}

export function usesLocalComposeCheckDatabase(databaseUrl) {
  const url = parseCheckDatabaseUrl(databaseUrl);
  const port = url.port ? Number.parseInt(url.port, 10) : DEFAULT_POSTGRES_PORT;

  return (
    LOCAL_COMPOSE_HOSTS.has(url.hostname.toLowerCase()) &&
    port === LOCAL_COMPOSE_POSTGRES_PORT
  );
}

export async function ensureCheckDatabase(
  databaseUrl,
  {
    probe = probeCheckDatabase,
    startLocalDatabase,
    wait = waitForCheckDatabase,
  } = {},
) {
  if (await probe(databaseUrl)) return false;

  if (usesLocalComposeCheckDatabase(databaseUrl)) {
    if (typeof startLocalDatabase !== "function") {
      throw new Error("Inicialização do banco local de check não configurada.");
    }

    await startLocalDatabase();
    await wait(databaseUrl);
    return true;
  }

  await wait(databaseUrl);
  return false;
}

export async function waitForCheckDatabase(
  databaseUrl,
  {
    timeoutMs = DEFAULT_WAIT_TIMEOUT_MS,
    retryIntervalMs = DEFAULT_RETRY_INTERVAL_MS,
    probe = probeCheckDatabase,
    sleep = delay,
  } = {},
) {
  const deadline = Date.now() + timeoutMs;

  while (true) {
    if (await probe(databaseUrl)) return;

    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) {
      const timeoutSeconds = Math.ceil(timeoutMs / 1000);
      throw new Error(
        `Banco isolado de check indisponível em ${checkDatabaseEndpoint(databaseUrl)} após ${timeoutSeconds}s. Inicie ou recupere o banco configurado em CHECK_DATABASE_URL e tente novamente.`,
      );
    }

    await sleep(Math.min(retryIntervalMs, remainingMs));
  }
}
