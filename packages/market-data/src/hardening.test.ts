import { describe, expect, it } from "vitest";

import { fetchWithExplicitFallback, foundMarketData, InMemoryMarketDataCache } from "./index";

describe("Market Data hardening", () => {
  it("rejects an invalid cache clock during reads instead of returning stale data indefinitely", () => {
    let now = 1_000;
    const cache = new InMemoryMarketDataCache<string>(() => now);
    cache.set("price:asset", "snapshot", 100);

    now = Number.NaN;

    expect(() => cache.get("price:asset")).toThrowError(TypeError);
  });

  it("turns thrown provider failures into explicit PROVIDER_ERROR and follows policy", async () => {
    const first = { name: "first" };
    const second = { name: "second" };

    const result = await fetchWithExplicitFallback(
      [first, second],
      { orderedProviders: ["first", "second"], fallbackOn: ["PROVIDER_ERROR"] },
      async (provider) => {
        if (provider.name === "first") throw new Error("upstream failed");
        return foundMarketData("second", "ok");
      },
    );

    expect(result).toEqual({
      result: { status: "FOUND", provider: "SECOND", snapshot: "ok" },
      attempts: [
        { provider: "FIRST", status: "PROVIDER_ERROR" },
        { provider: "SECOND", status: "FOUND" },
      ],
    });
  });

  it("does not fallback after a thrown provider failure unless policy allows it", async () => {
    const result = await fetchWithExplicitFallback(
      [{ name: "first" }, { name: "second" }],
      { orderedProviders: ["first", "second"], fallbackOn: ["MISSING"] },
      async () => {
        throw new Error("upstream failed");
      },
    );

    expect(result).toEqual({
      result: {
        status: "PROVIDER_ERROR",
        provider: "FIRST",
        errorCode: "UNHANDLED_PROVIDER_EXCEPTION",
      },
      attempts: [{ provider: "FIRST", status: "PROVIDER_ERROR" }],
    });
  });
});
