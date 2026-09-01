const POSTGRES_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

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

export function requiredCheckDatabaseUrl(env = process.env) {
  const value = env.CHECK_DATABASE_URL?.trim();

  if (!value) {
    throw new Error(
      "prod:check exige CHECK_DATABASE_URL apontando para um banco de teste isolado.",
    );
  }

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
