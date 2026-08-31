const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);
const POSITIVE_INTEGER_PATTERN = /^[1-9]\d*$/;

export function requiredDirectDatabaseUrl(env = process.env) {
  const value = env.DATABASE_DIRECT_URL?.trim();
  if (!value) {
    throw new Error("DATABASE_DIRECT_URL é obrigatória para migrations de produção.");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_DIRECT_URL precisa ser uma URL PostgreSQL válida.");
  }

  if (!POSTGRES_PROTOCOLS.has(url.protocol)) {
    throw new Error("DATABASE_DIRECT_URL precisa usar postgres:// ou postgresql://.");
  }

  if (url.hostname.toLowerCase().includes("-pooler")) {
    throw new Error("DATABASE_DIRECT_URL precisa usar a conexão direta, sem pooling.");
  }

  return value;
}

export function requiredProductionReadyUrl(env = process.env) {
  const value = env.PORTFOLIO_COPILOT_PRODUCTION_READY_URL?.trim();
  if (!value) {
    throw new Error("PORTFOLIO_COPILOT_PRODUCTION_READY_URL é obrigatória para prod:verify.");
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("PORTFOLIO_COPILOT_PRODUCTION_READY_URL precisa ser uma URL HTTPS válida.");
  }

  if (url.protocol !== "https:") {
    throw new Error("PORTFOLIO_COPILOT_PRODUCTION_READY_URL precisa usar HTTPS.");
  }

  if (url.username || url.password || url.search || url.hash) {
    throw new Error(
      "PORTFOLIO_COPILOT_PRODUCTION_READY_URL não pode conter credenciais, query string ou fragmento.",
    );
  }

  return url.toString();
}

export function positiveIntegerEnv(value, fallback) {
  const normalized = value?.trim();
  if (!normalized || !POSITIVE_INTEGER_PATTERN.test(normalized)) return fallback;

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}
