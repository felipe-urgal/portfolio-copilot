import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";

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

const manifest = JSON.parse(
  await readFile(new URL("../.dev-dashboard/production.json", import.meta.url), "utf8"),
);
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const productionGatePath = new URL("./production-gate.mjs", import.meta.url).pathname;

describe("production contract", () => {
  it("declares the validated Vercel production without a local deploy command", () => {
    expect(manifest.production).toMatchObject({
      enabled: true,
      strategy: "git-managed",
      provider: "vercel",
      branch: "main",
      commands: {
        check: "prod:check",
        migrate: "prod:migrate",
        verify: "prod:verify",
      },
      health: {
        type: "http",
        url: "https://portfolio-copilot-plum.vercel.app/api/health/ready",
      },
      external: { project: "portfolio-copilot" },
      policies: {
        backup: "external",
        migrations: "before-deploy",
        rollback: "manual-restore",
      },
    });
    expect(manifest.production.commands.deploy).toBeUndefined();
    expect(manifest.production.blockedBy).toBeUndefined();
  });

  it("loads local operator env for migrate and verify without exposing it to Vercel runtime", () => {
    expect(packageJson.scripts["prod:migrate"]).toContain("--env-file-if-exists=.env.local");
    expect(packageJson.scripts["prod:verify"]).toContain("--env-file-if-exists=.env.local");
  });

  it("reports enabled git-managed status and refuses local deploy", () => {
    const status = spawnSync(process.execPath, [productionGatePath, "status"], { encoding: "utf8" });
    expect(status.status).toBe(0);
    expect(status.stdout).toContain("production.enabled=true");
    expect(status.stdout).toContain("provider=vercel");

    const deploy = spawnSync(process.execPath, [productionGatePath, "deploy"], { encoding: "utf8" });
    expect(deploy.status).toBe(2);
    expect(deploy.stderr).toContain("git-managed pela Vercel");
  });
});

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
