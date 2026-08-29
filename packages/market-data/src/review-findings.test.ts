import { describe, expect, it } from "vitest";

import {
  createPriceSnapshot,
  fetchWithExplicitFallback,
  InMemoryPriceProvider,
  InvalidMarketDataFallbackPolicyError,
  missingMarketData,
} from "./index";

const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";

function snapshot(provider: string) {
  return createPriceSnapshot({
    assetId: ASSET_ID,
    price: "10.1234",
    currency: "BRL",
    asOf: "2026-08-29T00:00:00.000Z",
    retrievedAt: "2026-08-29T12:00:00.000Z",
    provenance: { provider, normalizationVersion: "review-v1" },
  });
}

describe("senior review hardening", () => {
  it("rejects in-memory snapshots attributed to a different provider", () => {
    expect(() => new InMemoryPriceProvider("provider_a", [snapshot("provider_b")])).toThrowError(
      /does not match adapter/,
    );
  });

  it("rejects duplicate adapter names after normalization", async () => {
    const first = {
      name: "provider_a",
      async load() {
        return missingMarketData("provider_a", "No data.");
      },
    };
    const duplicate = {
      name: " PROVIDER_A ",
      async load() {
        return missingMarketData("provider_a", "No data.");
      },
    };

    await expect(
      fetchWithExplicitFallback(
        [first, duplicate],
        { orderedProviders: ["provider_a"], fallbackOn: ["MISSING"] },
        (provider) => provider.load(),
      ),
    ).rejects.toThrowError(InvalidMarketDataFallbackPolicyError);
  });
});
