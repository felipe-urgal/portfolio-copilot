import { describe, expect, it } from "vitest";

import { AssetClass, AssetId } from "../asset";
import { Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import { apportionMinorUnitsByAssetClass } from "./allocation-state";
import { buildContributionRecommendationSnapshot } from "./contribution-recommendation-pipeline";
import { InvalidContributionMethodologyVersionError } from "./errors";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440070");
const ASSET_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440071");

function minimalPipelineInput(methodologyVersion: string) {
  return {
    methodologyVersion,
    allocation: {
      portfolioId: PORTFOLIO_ID,
      targetAllocation: TargetAllocation.create({
        portfolioId: PORTFOLIO_ID,
        buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
      }),
      portfolioValue: Money.zero("BRL"),
      currentValues: [],
      contribution: Money.fromDecimal("100.00", "BRL"),
    },
    policy: {
      minimumMeaningfulContribution: Money.zero("BRL"),
      maxDestinationsPerContribution: 1,
    },
    concentrationLimits: [],
    executionDestinations: [
      {
        assetId: ASSET_ID,
        assetClass: "EQUITY",
        isEligible: true,
        minimumTradableQuantity: "1",
      },
    ],
    costTaxConstraints: [],
  } as const;
}

describe("Contribution hardening", () => {
  it("rejects duplicate asset classes before largest-remainder Map construction", () => {
    const equity = AssetClass.from("EQUITY");

    expect(() =>
      apportionMinorUnitsByAssetClass(100n, [
        { assetClass: equity, weightUnits: 1n },
        { assetClass: equity, weightUnits: 1n },
      ]),
    ).toThrowError(RangeError);
  });

  it.each(["portfolio-engine/1\nforged", "a".repeat(65), "portfolio engine/1"])(
    "rejects unsafe methodologyVersion %j",
    (methodologyVersion) => {
      expect(() =>
        buildContributionRecommendationSnapshot(minimalPipelineInput(methodologyVersion)),
      ).toThrowError(InvalidContributionMethodologyVersionError);
    },
  );
});
