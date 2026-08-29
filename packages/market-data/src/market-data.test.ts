import { describe, expect, it } from "vitest";

import {
  createFxSnapshot,
  createMacroSnapshot,
  createPriceSnapshot,
  fetchWithExplicitFallback,
  foundMarketData,
  InMemoryMarketDataCache,
  InvalidMarketDataFallbackPolicyError,
  InvalidMarketDataSnapshotError,
  MarketDataFreshnessPolicy,
  missingMarketData,
  providerError,
  type PriceProvider,
} from "./index";

const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const PROVENANCE = {
  provider: "provider_a",
  sourceId: "daily-close-001",
  sourceUrl: "https://example.com/prices/001",
  rawIdentifier: " b3:itub4 ",
  normalizationVersion: "market-data-v1",
} as const;

function priceSnapshot(
  asOf = "2026-08-29T12:00:00.000Z",
  retrievedAt = "2026-08-29T12:05:00.000Z",
) {
  return createPriceSnapshot({
    assetId: ASSET_ID,
    price: "42.501234",
    currency: "BRL",
    asOf,
    retrievedAt,
    provenance: PROVENANCE,
  });
}

describe("material market data snapshots", () => {
  it("normalizes price identity and provenance while preserving exact decimal precision", () => {
    const snapshot = priceSnapshot();

    expect(snapshot).toEqual({
      category: "PRICE",
      assetId: ASSET_ID,
      price: "42.501234",
      currency: "BRL",
      asOf: "2026-08-29T12:00:00.000Z",
      retrievedAt: "2026-08-29T12:05:00.000Z",
      provenance: {
        provider: "PROVIDER_A",
        sourceId: "daily-close-001",
        sourceUrl: "https://example.com/prices/001",
        rawIdentifier: "b3:itub4",
        normalizationVersion: "market-data-v1",
      },
      qualityFlags: [],
    });
  });

  it("rejects snapshots retrieved before their observation time", () => {
    expect(() =>
      createPriceSnapshot({
        assetId: ASSET_ID,
        price: "42.50",
        currency: "BRL",
        asOf: "2026-08-29T12:05:00.000Z",
        retrievedAt: "2026-08-29T12:00:00.000Z",
        provenance: PROVENANCE,
      }),
    ).toThrowError(InvalidMarketDataSnapshotError);
  });

  it("rejects non-positive prices and excessive decimal scale", () => {
    expect(() =>
      createPriceSnapshot({
        assetId: ASSET_ID,
        price: "0",
        currency: "BRL",
        asOf: "2026-08-29T12:00:00.000Z",
        retrievedAt: "2026-08-29T12:00:01.000Z",
        provenance: PROVENANCE,
      }),
    ).toThrowError(InvalidMarketDataSnapshotError);

    expect(() =>
      createPriceSnapshot({
        assetId: ASSET_ID,
        price: "1.1234567890123456789",
        currency: "BRL",
        asOf: "2026-08-29T12:00:00.000Z",
        retrievedAt: "2026-08-29T12:00:01.000Z",
        provenance: PROVENANCE,
      }),
    ).toThrowError(InvalidMarketDataSnapshotError);
  });

  it("normalizes FX pairs and decimal rates without floating point conversion", () => {
    const snapshot = createFxSnapshot({
      baseCurrency: "usd",
      quoteCurrency: "brl",
      rate: "005.43000",
      asOf: "2026-08-29T12:00:00.000Z",
      retrievedAt: "2026-08-29T12:01:00.000Z",
      provenance: PROVENANCE,
    });

    expect(snapshot.baseCurrency).toBe("USD");
    expect(snapshot.quoteCurrency).toBe("BRL");
    expect(snapshot.rate).toBe("5.43");
  });

  it("supports signed macro observations with explicit unit and indicator identity", () => {
    const snapshot = createMacroSnapshot({
      indicatorId: "bcb:selic-change",
      value: "-00.2500",
      unit: "percentage-point",
      asOf: "2026-08-29T12:00:00.000Z",
      retrievedAt: "2026-08-29T12:02:00.000Z",
      provenance: PROVENANCE,
    });

    expect(snapshot.indicatorId).toBe("BCB:SELIC-CHANGE");
    expect(snapshot.value).toBe("-0.25");
    expect(snapshot.unit).toBe("percentage-point");
  });
});

describe("MarketDataFreshnessPolicy", () => {
  it("marks stale data explicitly without mutating the original snapshot", () => {
    const policy = MarketDataFreshnessPolicy.create({
      PRICE: 60_000,
      FX: 120_000,
      MACRO: 3_600_000,
    });
    const snapshot = priceSnapshot();

    expect(policy.evaluate(snapshot, "2026-08-29T12:00:30.000Z").status).toBe("FRESH");
    expect(policy.flagsFor(snapshot, "2026-08-29T12:02:00.000Z")).toEqual(["STALE"]);
    expect(snapshot.qualityFlags).toEqual([]);
  });

  it("preserves provider conflict while adding stale quality", () => {
    const policy = MarketDataFreshnessPolicy.create({ PRICE: 1, FX: 1, MACRO: 1 });
    const snapshot = createPriceSnapshot({
      assetId: ASSET_ID,
      price: "42.50",
      currency: "BRL",
      asOf: "2026-08-29T12:00:00.000Z",
      retrievedAt: "2026-08-29T12:05:00.000Z",
      provenance: PROVENANCE,
      qualityFlags: ["CONFLICT"],
    });

    expect(policy.flagsFor(snapshot, "2026-08-29T12:05:01.000Z")).toEqual(["CONFLICT", "STALE"]);
  });

  it("treats future observations as conflicting instead of current", () => {
    const policy = MarketDataFreshnessPolicy.create({
      PRICE: 60_000,
      FX: 60_000,
      MACRO: 60_000,
    });
    const snapshot = priceSnapshot(
      "2026-08-29T12:10:00.000Z",
      "2026-08-29T12:11:00.000Z",
    );

    expect(policy.evaluate(snapshot, "2026-08-29T12:09:00.000Z").status).toBe("FUTURE");
    expect(policy.flagsFor(snapshot, "2026-08-29T12:09:00.000Z")).toEqual(["CONFLICT"]);
  });
});

describe("InMemoryMarketDataCache", () => {
  it("expires entries by TTL and supports explicit invalidation", () => {
    let now = 1_000;
    const cache = new InMemoryMarketDataCache<string>(() => now);

    cache.set(" price:1 ", "first", 100);
    expect(cache.get("price:1")).toBe("first");

    expect(cache.invalidate(" price:1 ")).toBe(true);
    expect(cache.get("price:1")).toBeNull();

    cache.set("price:1", "second", 100);
    now = 1_100;
    expect(cache.get(" price:1 ")).toBeNull();
    expect(cache.size()).toBe(0);
  });
});

describe("explicit provider fallback", () => {
  const firstProvider: PriceProvider = {
    name: "provider_a",
    async fetchPrice() {
      return missingMarketData("provider_a", "No completed close available.");
    },
  };
  const secondProvider: PriceProvider = {
    name: "provider_b",
    async fetchPrice() {
      return foundMarketData("provider_b", priceSnapshot());
    },
  };

  it("uses the next provider only when the policy explicitly permits that failure class", async () => {
    const result = await fetchWithExplicitFallback(
      [firstProvider, secondProvider],
      { orderedProviders: ["provider_a", "provider_b"], fallbackOn: ["MISSING"] },
      (provider) => provider.fetchPrice(ASSET_ID),
    );

    expect(result.result.status).toBe("FOUND");
    expect(result.attempts).toEqual([
      { provider: "PROVIDER_A", status: "MISSING" },
      { provider: "PROVIDER_B", status: "FOUND" },
    ]);
  });

  it("does not hide a provider error when the policy only allows fallback on missing data", async () => {
    const failingProvider: PriceProvider = {
      name: "provider_a",
      async fetchPrice() {
        return providerError("provider_a", "timeout");
      },
    };

    const result = await fetchWithExplicitFallback(
      [failingProvider, secondProvider],
      { orderedProviders: ["provider_a", "provider_b"], fallbackOn: ["MISSING"] },
      (provider) => provider.fetchPrice(ASSET_ID),
    );

    expect(result.result).toEqual({
      status: "PROVIDER_ERROR",
      provider: "PROVIDER_A",
      errorCode: "TIMEOUT",
    });
    expect(result.attempts).toEqual([{ provider: "PROVIDER_A", status: "PROVIDER_ERROR" }]);
  });

  it("keeps absence explicit with a MISSING quality flag", () => {
    expect(missingMarketData("provider_a", "Not published yet.")).toEqual({
      status: "MISSING",
      provider: "PROVIDER_A",
      reason: "Not published yet.",
      qualityFlags: ["MISSING"],
    });
  });

  it("rejects fallback policies that reference adapters that are not available", async () => {
    await expect(
      fetchWithExplicitFallback(
        [firstProvider],
        { orderedProviders: ["provider_a", "provider_b"], fallbackOn: ["MISSING"] },
        (provider) => provider.fetchPrice(ASSET_ID),
      ),
    ).rejects.toThrowError(InvalidMarketDataFallbackPolicyError);
  });
});
