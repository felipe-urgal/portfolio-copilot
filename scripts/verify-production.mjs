#!/usr/bin/env node

import { pathToFileURL } from "node:url";

import {
  positiveIntegerEnv,
  requiredProductionReadyUrl,
} from "./production-environment.mjs";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_INTERVAL_MS = 1_000;
const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
const SAFE_ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,63}$/;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function safeReadinessIssue(error) {
  if (!(error instanceof Error)) return "falha ao consultar readiness";

  const causeCode = error.cause && typeof error.cause === "object" ? error.cause.code : undefined;
  if (typeof causeCode === "string" && SAFE_ERROR_CODE_PATTERN.test(causeCode)) {
    return causeCode;
  }

  if (error.name === "TimeoutError" || error.name === "AbortError") return "TIMEOUT";
  return "falha ao consultar readiness";
}

export async function verifyProductionReadiness({
  url,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  intervalMs = DEFAULT_INTERVAL_MS,
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
  sleepImpl = sleep,
  now = Date.now,
} = {}) {
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("URL de readiness é obrigatória.");
  }

  const startedAt = now();
  let attempts = 0;
  let lastIssue = "readiness indisponível";

  while (true) {
    const elapsedBeforeAttempt = Math.max(0, now() - startedAt);
    const remainingMs = timeoutMs - elapsedBeforeAttempt;
    if (remainingMs <= 0 && attempts > 0) {
      return { ok: false, attempts, elapsedMs: elapsedBeforeAttempt, lastIssue };
    }

    attempts += 1;
    const attemptTimeoutMs = Math.max(1, Math.min(requestTimeoutMs, Math.max(1, remainingMs)));

    try {
      const response = await fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(attemptTimeoutMs),
      });

      if (response.ok) {
        return {
          ok: true,
          attempts,
          elapsedMs: Math.max(0, now() - startedAt),
          lastIssue: null,
        };
      }

      lastIssue = `HTTP ${response.status}`;
    } catch (error) {
      lastIssue = safeReadinessIssue(error);
    }

    const elapsedMs = Math.max(0, now() - startedAt);
    if (elapsedMs >= timeoutMs) {
      return { ok: false, attempts, elapsedMs, lastIssue };
    }

    await sleepImpl(Math.min(intervalMs, timeoutMs - elapsedMs));
  }
}

export function formatReadinessSuccess({ attempts, elapsedMs }) {
  return `Readiness de produção confirmado em ${attempts} tentativa(s) após ${elapsedMs} ms.`;
}

async function main() {
  let url;

  try {
    url = requiredProductionReadyUrl();
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Configuração de verify inválida.");
    process.exitCode = 1;
    return;
  }

  const timeoutMs = positiveIntegerEnv(
    process.env.PORTFOLIO_COPILOT_VERIFY_TIMEOUT_MS,
    DEFAULT_TIMEOUT_MS,
  );
  const intervalMs = positiveIntegerEnv(
    process.env.PORTFOLIO_COPILOT_VERIFY_INTERVAL_MS,
    DEFAULT_INTERVAL_MS,
  );
  const requestTimeoutMs = positiveIntegerEnv(
    process.env.PORTFOLIO_COPILOT_VERIFY_REQUEST_TIMEOUT_MS,
    DEFAULT_REQUEST_TIMEOUT_MS,
  );

  const result = await verifyProductionReadiness({
    url,
    timeoutMs,
    intervalMs,
    requestTimeoutMs,
  });

  if (result.ok) {
    console.log(formatReadinessSuccess(result));
    return;
  }

  console.error(
    `Readiness de produção não ficou disponível após ${result.attempts} tentativa(s) e ${result.elapsedMs} ms (${result.lastIssue}).`,
  );
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
