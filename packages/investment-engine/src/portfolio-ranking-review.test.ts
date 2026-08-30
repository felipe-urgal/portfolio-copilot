import {
  Money,
  PortfolioId,
  TargetAllocation,
  calculateAllocationGaps,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";
import { describe, expect, it } from "vitest";

import {
  BASELINE_PORTFOLIO_RANKING_METHODOLOGY,
  evaluatePortfolioFit,
  rankInvestmentCandidates,
  type InvestmentScoreSnapshot,
  type PortfolioFitSnapshot,
} from "./index";

const PORTFOLIO_ID = "650e8400-e29b-41d4-a716-446655440000";
const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const EVALUATION_AS_OF = "2026-08-30T10:00:00.000Z";

function equityGap() {
  const portfolioId = PortfolioId.from(PORTFOLIO_ID);
  const targetAllocation = TargetAllocation.create({
    portfolioId,
    buckets: [
      { assetClass: "EQUITY", targetWeight: "60" },
      { assetClass: "FIXED_INCOME", targetWeight: "40" },
    ],
  });
  const gaps = calculateAllocationGaps({
    portfolioId,
    targetAllocation,
    totalValue: Money.fromDecimal("1000", "BRL"),
    currentValues: [
      { assetClass: "EQUITY", currentValue: Money.fromDecimal("300", "BRL") },
      { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("700", "BRL") },
    ],
  });
  const gap = gaps.find((candidate) => candidate.assetClass.code === "EQUITY");
  if (gap === undefined) throw new Error("Expected equity allocation gap fixture.");
  return gap;
}

function hardLimitedRecommendation(): ContributionRecommendationSnapshot {
  return {
    methodologyVersion: "test-v1",
    portfolioId: PORTFOLIO_ID,
    currency: "BRL",
    portfolioValue: "1000",
    contribution: "100",
    postContributionValue: "1100",
    policy: {
      minimumMeaningfulContribution: "1",
      maxDestinationsPerContribution: 1,
    },
    cashRemainder: {
      afterAllocator: "0",
      afterPolicy: "0",
      afterConcentration: "0",
      afterExecution: "0",
      afterCosts: "0",
    },
    totalInvestableAmount: "100",
    totalConsumedKnownCost: "0",
    unallocatedContribution: "0",
    decisions: [
      {
        assetClass: "EQUITY",
        assetId: ASSET_ID,
        targetWeightPercent: "60",
        currentValue: "300",
        postContributionTargetValue: "660",
        postContributionNeed: "360",
        baselineAllocatedAmount: "100",
        policyAllocatedAmount: "100",
        concentrationAllocatedAmount: "80",
        concentrationBlockedAmount: "20",
        softMaxWeightPercent: "70",
        hardMaxWeightPercent: "80",
        executionEligible: true,
        minimumTradableQuantity: "1",
        transactionCost: "0",
        estimatedTaxImpact: "0",
        totalKnownCost: "0",
        consumedKnownCost: "0",
        investableAmount: "80",
        status: "EXECUTABLE",
        reasonCodes: ["HARD_CONCENTRATION_LIMIT_APPLIED"],
      },
    ],
  };
}

function scoredDimension(kind: "QUALITY" | "OPPORTUNITY"): InvestmentScoreSnapshot {
  return Object.freeze({
    status: "SCORED",
    kind,
    assetId: ASSET_ID,
    scoreBps: 8_000,
    evaluationAsOf: EVALUATION_AS_OF,
    methodologyId: "EQUITY_STOCK_GENERAL",
    methodologyVersion: "1.0.0",
    classification: Object.freeze({
      assetClass: "EQUITY",
      instrumentType: "STOCK",
      sector: "GENERAL",
    }),
    components: Object.freeze([]),
    valuation: null,
  });
}

describe("portfolio ranking review hardening", () => {
  it("makes a hard concentration limit visible in the concentration component", () => {
    const result = evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      assetId: ASSET_ID,
      assetClass: "EQUITY",
      evaluationAsOf: EVALUATION_AS_OF,
      allocationGap: equityGap(),
      contributionRecommendation: hardLimitedRecommendation(),
    });

    expect(result).toMatchObject({
      status: "SCORED",
      scoreBps: 5_000,
      hardBlockStatus: null,
    });
    expect(result.status === "SCORED" ? result.components : []).toContainEqual(
      expect.objectContaining({
        componentId: "CONCENTRATION",
        scoreBps: 0,
        reasonCodes: ["HARD_CONCENTRATION_LIMIT_APPLIED"],
      }),
    );
  });

  it("keeps Portfolio Fit from a different asset class out of the ranking", () => {
    const portfolioFit: PortfolioFitSnapshot = Object.freeze({
      status: "SCORED",
      kind: "PORTFOLIO_FIT",
      assetId: ASSET_ID,
      assetClass: "FIXED_INCOME",
      portfolioId: PORTFOLIO_ID,
      scoreBps: 8_000,
      evaluationAsOf: EVALUATION_AS_OF,
      methodologyId: BASELINE_PORTFOLIO_RANKING_METHODOLOGY.methodologyId,
      methodologyVersion: BASELINE_PORTFOLIO_RANKING_METHODOLOGY.version,
      hardBlockStatus: null,
      components: Object.freeze([]),
      reasonCodes: Object.freeze([]),
    });

    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_ID,
          quality: scoredDimension("QUALITY"),
          opportunity: scoredDimension("OPPORTUNITY"),
          portfolioFit,
        },
      ],
    });

    expect(radar.ranked).toEqual([]);
    expect(radar.insufficient[0]).toMatchObject({
      reasons: ["PORTFOLIO_FIT_ASSET_CLASS_MISMATCH"],
    });
  });
});
