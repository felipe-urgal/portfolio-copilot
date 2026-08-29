import { createPriceSnapshot } from "@portfolio-copilot/market-data";
import { describe, expect, it } from "vitest";

import { evaluateValuation } from "./index";

const PRICE_ASSET_ID = "550e8400-e29b-41d4-a716-446655440080";
const FAIR_VALUE_ASSET_ID = "550e8400-e29b-41d4-a716-446655440081";

function evidence() {
  return {
    evidenceId: "FAIR_VALUE_INPUT",
    asOf: "2026-08-29T10:00:00.000Z",
    retrievedAt: "2026-08-29T10:05:00.000Z",
    provenance: {
      provider: "fundamentals_provider",
      sourceId: "fair-value-input",
      normalizationVersion: "v1",
    },
  } as const;
}

describe("Investment Engine hardening", () => {
  it("rejects a fair value produced for another AssetId", () => {
    const currentPrice = createPriceSnapshot({
      assetId: PRICE_ASSET_ID,
      price: "80",
      currency: "BRL",
      asOf: "2026-08-29T10:00:00.000Z",
      retrievedAt: "2026-08-29T10:01:00.000Z",
      provenance: { provider: "price_provider", normalizationVersion: "v1" },
    });

    const result = evaluateValuation({
      evaluationAsOf: "2026-08-29T11:00:00.000Z",
      currentPrice,
      fairValue: {
        assetId: FAIR_VALUE_ASSET_ID,
        value: "100",
        currency: "BRL",
        evidence: evidence(),
      },
      model: { modelId: "DCF_BASE", version: "1.0.0" },
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      assetId: PRICE_ASSET_ID,
      fairValueAssetId: FAIR_VALUE_ASSET_ID,
      reasonCodes: ["FAIR_VALUE_ASSET_MISMATCH"],
    });
  });
});
