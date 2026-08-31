import { describe, expect, it } from "vitest";

import {
  positiveIntegerEnv,
  requiredDirectDatabaseUrl,
  requiredProductionReadyUrl,
} from "./production-environment.mjs";
import {
  formatReadinessSuccess,
  safeReadinessIssue,
  verifyProductionReadiness,
} from "./verify-production.mjs";

describe("production environment", () => {
  it("requires a direct PostgreSQL URL for migrations", () => {
    expect(
      requiredDirectDatabaseUrl({
        DATABASE_DIRECT_URL: "postgresql://owner:secret@ep-example.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toContain("ep-example.aws.neon.tech");

    expect(() =>
      requiredDirectDatabaseUrl({
        DATABASE_DIRECT_URL:
          "postgresql://owner:secret@ep-example-pooler.aws.neon.tech/neondb?sslmode=require",
      }),
    ).toThrow(/conexão direta/);
  });

  it("requires a credential-free HTTPS readiness URL", () => {
    expect(
      requiredProductionReadyUrl({
        PORTFOLIO_COPILOT_PRODUCTION_READY_URL:
          "https://portfolio-copilot.example/api/health/ready",
      }),
    ).toBe("https://portfolio-copilot.example/api/health/ready");

    expect(() =>
      requiredProductionReadyUrl({
        PORTFOLIO_COPILOT_PRODUCTION_READY_URL:
          "https://user:secret@portfolio-copilot.example/api/health/ready",
      }),
    ).toThrow(/credenciais/);

    expect(() =>
      requiredProductionReadyUrl({
        PORTFOLIO_COPILOT_PRODUCTION_READY_URL:
          "https://portfolio-copilot.example/api/health/ready?token=secret",
      }),
    ).toThrow(/query string/);
  });

  it("rejects partially numeric millisecond overrides", () => {
    expect(positiveIntegerEnv("30000", 1000)).toBe(30000);
    expect(positiveIntegerEnv("30s", 1000)).toBe(1000);
    expect(positiveIntegerEnv("30_000", 1000)).toBe(1000);
    expect(positiveIntegerEnv("0", 1000)).toBe(1000);
  });
});

describe("production readiness verify", () => {
  it("retries until readiness succeeds", async () => {
    let calls = 0;
    let clock = 0;

    const result = await verifyProductionReadiness({
      url: "https://portfolio-copilot.example/api/health/ready",
      timeoutMs: 5_000,
      intervalMs: 100,
      requestTimeoutMs: 50,
      now: () => clock,
      sleepImpl: async (ms) => {
        clock += ms;
      },
      fetchImpl: async () => {
        calls += 1;
        return { ok: calls >= 3, status: calls >= 3 ? 200 : 503 };
      },
    });

    expect(result).toEqual({ ok: true, attempts: 3, elapsedMs: 200, lastIssue: null });
    expect(formatReadinessSuccess(result)).not.toMatch(/https?:\/\//);
  });

  it("fails within the configured window when readiness stays unavailable", async () => {
    let clock = 0;

    const result = await verifyProductionReadiness({
      url: "https://portfolio-copilot.example/api/health/ready",
      timeoutMs: 250,
      intervalMs: 100,
      requestTimeoutMs: 50,
      now: () => clock,
      sleepImpl: async (ms) => {
        clock += ms;
      },
      fetchImpl: async () => ({ ok: false, status: 503 }),
    });

    expect(result).toEqual({
      ok: false,
      attempts: 3,
      elapsedMs: 250,
      lastIssue: "HTTP 503",
    });
  });

  it("sanitizes URL-bearing fetch errors", () => {
    const error = new TypeError(
      "Failed to parse URL from https://user:secret@portfolio-copilot.example/api/health/ready",
    );

    expect(safeReadinessIssue(error)).toBe("falha ao consultar readiness");
    expect(safeReadinessIssue(error)).not.toContain("secret");
  });
});
