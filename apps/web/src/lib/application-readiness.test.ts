import { describe, expect, it, vi } from "vitest";

import { getApplicationReadiness } from "./application-readiness";

describe("getApplicationReadiness", () => {
  it("reports readiness only when PostgreSQL responds", async () => {
    const checkPostgres = vi.fn().mockResolvedValue(undefined);

    await expect(getApplicationReadiness(checkPostgres)).resolves.toEqual({
      service: "Portfolio Copilot",
      status: "ok",
      dependencies: { postgres: "ok" },
    });
    expect(checkPostgres).toHaveBeenCalledTimes(1);
  });

  it("fails closed without exposing the database error", async () => {
    const checkPostgres = vi.fn().mockRejectedValue(
      new Error("postgresql://user:secret@example.invalid/private"),
    );

    const result = await getApplicationReadiness(checkPostgres);

    expect(result).toEqual({
      service: "Portfolio Copilot",
      status: "unavailable",
      dependencies: { postgres: "unavailable" },
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("example.invalid");
  });
});
