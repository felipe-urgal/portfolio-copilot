import {
  Money,
  PortfolioId,
  TargetAllocation,
  calculateAllocationGaps,
  type AllocationGap,
  type ContributionRecommendationDecisionSnapshot,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";
import { describe, expect, it } from "vitest";

import {
  BASELINE_PORTFOLIO_RANKING_METHODOLOGY,
  createPortfolioRankingMethodology,
  evaluatePortfolioFit,
  InvalidPortfolioRankingMethodologyError,
  rankInvestmentCandidates,
  type InvestmentScoreInsufficientData,
  type InvestmentScoreSnapshot,
} from "./index";

const PORTFOLIO_ID = "650e8400-e29b-41d4-a716-446655440000";
const OTHER_PORTFOLIO_ID = "650e8400-e29b-41d4-a716-446655440001";
const ASSET_A = "550e8400-e29b-41d4-a716-446655440000";
const ASSET_B = "550e8400-e29b-41d4-a716-446655440001";
const EVALUATION_AS_OF = "2026-08-30T10:00:00.000Z";
const STOCK_CLASSIFICATION = Object.freeze({
  assetClass: "EQUITY",
  instrumentType: "STOCK",
  sector: "GENERAL",
} as const);

function equityGap(equityValue: string, fixedIncomeValue: string): AllocationGap {
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
      { assetClass: "EQUITY", currentValue: Money.fromDecimal(equityValue, "BRL") },
      {
        assetClass: "FIXED_INCOME",
        currentValue: Money.fromDecimal(fixedIncomeValue, "BRL"),
      },
    ],
  });
  const gap = gaps.find((candidate) => candidate.assetClass.code === "EQUITY");
  if (gap === undefined) throw new Error("Expected equity allocation gap fixture.");
  return gap;
}

function contributionDecision(
  assetId: string,
  overrides: Partial<ContributionRecommendationDecisionSnapshot> = {},
): ContributionRecommendationDecisionSnapshot {
  return {
    assetClass: "EQUITY",
    assetId,
    targetWeightPercent: "60",
    currentValue: "300",
    postContributionTargetValue: "660",
    postContributionNeed: "360",
    baselineAllocatedAmount: "100",
    policyAllocatedAmount: "100",
    concentrationAllocatedAmount: "100",
    concentrationBlockedAmount: "0",
    softMaxWeightPercent: "70",
    hardMaxWeightPercent: "80",
    executionEligible: true,
    minimumTradableQuantity: "1",
    transactionCost: "0",
    estimatedTaxImpact: "0",
    totalKnownCost: "0",
    consumedKnownCost: "0",
    investableAmount: "100",
    status: "EXECUTABLE",
    reasonCodes: [],
    ...overrides,
  };
}

function contributionRecommendation(
  assetId: string,
  decisionOverrides: Partial<ContributionRecommendationDecisionSnapshot> = {},
  portfolioId = PORTFOLIO_ID,
): ContributionRecommendationSnapshot {
  return {
    methodologyVersion: "test-v1",
    portfolioId,
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
    decisions: [contributionDecision(assetId, decisionOverrides)],
  };
}

function scoredDimension(
  kind: "QUALITY" | "OPPORTUNITY",
  assetId: string,
  scoreBps: number,
): InvestmentScoreSnapshot {
  return Object.freeze({
    status: "SCORED",
    kind,
    assetId,
    scoreBps,
    evaluationAsOf: EVALUATION_AS_OF,
    methodologyId: "EQUITY_STOCK_GENERAL",
    methodologyVersion: "1.0.0",
    classification: STOCK_CLASSIFICATION,
    components: Object.freeze([
      Object.freeze({
        componentId: `${kind}_SYNTHETIC`,
        scoreBps,
        weightBps: 10_000,
        weightedContributionNumerator: scoreBps * 10_000,
        reasonCodes: Object.freeze([`${kind}_ASSESSED`]),
        evidence: Object.freeze([]),
      }),
    ]),
    valuation: null,
  });
}

function insufficientQuality(assetId: string): InvestmentScoreInsufficientData {
  return Object.freeze({
    status: "INSUFFICIENT_DATA",
    kind: "QUALITY",
    assetId,
    evaluationAsOf: EVALUATION_AS_OF,
    methodologyId: "EQUITY_STOCK_GENERAL",
    methodologyVersion: "1.0.0",
    classification: STOCK_CLASSIFICATION,
    reasonCodes: Object.freeze(["STALE_EVIDENCE"]),
    affectedComponents: Object.freeze(["ROE"]),
    components: Object.freeze([]),
    valuation: null,
  });
}

function portfolioFit(assetId: string, softLimit = false) {
  return evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
    assetId,
    assetClass: "EQUITY",
    evaluationAsOf: EVALUATION_AS_OF,
    allocationGap: equityGap("300", "700"),
    contributionRecommendation: contributionRecommendation(assetId, {
      reasonCodes: softLimit ? ["SOFT_CONCENTRATION_LIMIT_EXCEEDED"] : [],
    }),
  });
}

describe("portfolio ranking methodology", () => {
  it("requires Portfolio Fit and ranking weights to total exactly 10000 basis points", () => {
    expect(() =>
      createPortfolioRankingMethodology({
        methodologyId: "INVALID_PORTFOLIO_RANKING",
        version: "1.0.0",
        portfolioFitWeights: {
          allocationGapWeightBps: 4_000,
          concentrationWeightBps: 3_000,
          contributionEligibilityWeightBps: 2_999,
        },
        rankingWeights: {
          qualityWeightBps: 3_500,
          opportunityWeightBps: 3_500,
          portfolioFitWeightBps: 3_000,
        },
        softConcentrationScoreBps: 5_000,
      }),
    ).toThrowError(InvalidPortfolioRankingMethodologyError);
  });
});

describe("Portfolio Fit", () => {
  it("scores allocation need, concentration and contribution eligibility separately", () => {
    const result = portfolioFit(ASSET_A);

    expect(result).toMatchObject({
      status: "SCORED",
      kind: "PORTFOLIO_FIT",
      assetId: ASSET_A,
      assetClass: "EQUITY",
      scoreBps: 8_000,
      hardBlockStatus: null,
      reasonCodes: ["ALLOCATION_GAP_PRESENT", "CONTRIBUTION_EXECUTABLE"],
    });
    expect(result.status === "SCORED" ? result.components : []).toMatchObject([
      { componentId: "ALLOCATION_GAP", scoreBps: 5_000, weightBps: 4_000 },
      { componentId: "CONCENTRATION", scoreBps: 10_000, weightBps: 3_000 },
      { componentId: "CONTRIBUTION_ELIGIBILITY", scoreBps: 10_000, weightBps: 3_000 },
    ]);
  });

  it("penalizes a soft concentration breach without hiding it", () => {
    const result = portfolioFit(ASSET_A, true);

    expect(result).toMatchObject({
      status: "SCORED",
      scoreBps: 6_500,
      reasonCodes: [
        "ALLOCATION_GAP_PRESENT",
        "CONTRIBUTION_EXECUTABLE",
        "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
      ],
    });
  });

  it("hard-blocks candidates that the contribution pipeline says cannot receive the aporte", () => {
    const result = evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      assetId: ASSET_A,
      assetClass: "EQUITY",
      evaluationAsOf: EVALUATION_AS_OF,
      allocationGap: equityGap("300", "700"),
      contributionRecommendation: contributionRecommendation(ASSET_A, {
        status: "BLOCKED_CONCENTRATION_LIMIT",
        concentrationAllocatedAmount: "0",
        concentrationBlockedAmount: "100",
        reasonCodes: ["HARD_CONCENTRATION_LIMIT_APPLIED"],
      }),
    });

    expect(result).toMatchObject({
      status: "SCORED",
      scoreBps: 0,
      hardBlockStatus: "BLOCKED_CONCENTRATION_LIMIT",
      reasonCodes: [
        "ALLOCATION_GAP_PRESENT",
        "CONTRIBUTION_BLOCKED_CONCENTRATION_LIMIT",
        "HARD_CONCENTRATION_LIMIT_APPLIED",
      ],
    });
  });

  it("returns zero without inventing contribution context when there is no allocation gap", () => {
    const result = evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      assetId: ASSET_A,
      assetClass: "EQUITY",
      evaluationAsOf: EVALUATION_AS_OF,
      allocationGap: equityGap("600", "400"),
      contributionRecommendation: null,
    });

    expect(result).toMatchObject({
      status: "SCORED",
      scoreBps: 0,
      reasonCodes: ["NO_ALLOCATION_GAP"],
    });
  });

  it("keeps missing contribution context explicit when the portfolio has a gap", () => {
    const result = evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      assetId: ASSET_A,
      assetClass: "EQUITY",
      evaluationAsOf: EVALUATION_AS_OF,
      allocationGap: equityGap("300", "700"),
      contributionRecommendation: null,
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["MISSING_CONTRIBUTION_CONTEXT"],
    });
  });

  it("rejects contribution context from another portfolio", () => {
    const result = evaluatePortfolioFit(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      assetId: ASSET_A,
      assetClass: "EQUITY",
      evaluationAsOf: EVALUATION_AS_OF,
      allocationGap: equityGap("300", "700"),
      contributionRecommendation: contributionRecommendation(ASSET_A, {}, OTHER_PORTFOLIO_ID),
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["CONTRIBUTION_PORTFOLIO_MISMATCH"],
    });
  });
});

describe("investment radar ranking", () => {
  it("ranks candidates by a decomposed score and preserves every dimension", () => {
    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_A,
          quality: scoredDimension("QUALITY", ASSET_A, 8_000),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_A, 8_000),
          portfolioFit: portfolioFit(ASSET_A, true),
        },
        {
          assetId: ASSET_B,
          quality: scoredDimension("QUALITY", ASSET_B, 7_500),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_B, 7_500),
          portfolioFit: portfolioFit(ASSET_B),
        },
      ],
    });

    expect(radar).toMatchObject({ portfolioId: PORTFOLIO_ID });
    expect(radar.ranked.map((candidate) => [candidate.rank, candidate.assetId])).toEqual([
      [1, ASSET_B],
      [2, ASSET_A],
    ]);
    expect(radar.ranked[0]).toMatchObject({
      assetId: ASSET_B,
      rankingScoreBps: 7_650,
      contributions: {
        quality: { scoreBps: 7_500, weightBps: 3_500 },
        opportunity: { scoreBps: 7_500, weightBps: 3_500 },
        portfolioFit: { scoreBps: 8_000, weightBps: 3_000 },
      },
    });
    expect(radar.ranked[0]?.reasonCodes).toContain("QUALITY:QUALITY_ASSESSED");
    expect(radar.ranked[0]?.reasonCodes).toContain("PORTFOLIO_FIT:CONTRIBUTION_EXECUTABLE");
  });

  it("uses canonical AssetId ascending as the deterministic tie-break", () => {
    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_B,
          quality: scoredDimension("QUALITY", ASSET_B, 8_000),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_B, 8_000),
          portfolioFit: portfolioFit(ASSET_B),
        },
        {
          assetId: ASSET_A,
          quality: scoredDimension("QUALITY", ASSET_A, 8_000),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_A, 8_000),
          portfolioFit: portfolioFit(ASSET_A),
        },
      ],
    });

    expect(radar.tieBreakRule).toBe("RANKING_SCORE_DESC_ASSET_ID_ASC");
    expect(radar.ranked.map((candidate) => candidate.assetId)).toEqual([ASSET_A, ASSET_B]);
  });

  it("does not turn missing analytical data into a neutral score", () => {
    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_A,
          quality: insufficientQuality(ASSET_A),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_A, 8_000),
          portfolioFit: portfolioFit(ASSET_A),
        },
      ],
    });

    expect(radar.ranked).toEqual([]);
    expect(radar.insufficient[0]).toMatchObject({
      assetId: ASSET_A,
      reasons: ["QUALITY_INSUFFICIENT_DATA"],
    });
    expect(radar.insufficient[0]?.reasonCodes).toContain("QUALITY:STALE_EVIDENCE");
  });

  it("does not compare Portfolio Fit snapshots from another portfolio", () => {
    const fit = portfolioFit(ASSET_A);
    const crossPortfolioFit = Object.freeze({ ...fit, portfolioId: OTHER_PORTFOLIO_ID });
    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_A,
          quality: scoredDimension("QUALITY", ASSET_A, 8_000),
          opportunity: scoredDimension("OPPORTUNITY", ASSET_A, 8_000),
          portfolioFit: crossPortfolioFit,
        },
      ],
    });

    expect(radar.ranked).toEqual([]);
    expect(radar.insufficient[0]).toMatchObject({
      reasons: ["PORTFOLIO_CONTEXT_MISMATCH"],
    });
  });

  it("does not combine analytical dimensions with different classifications", () => {
    const opportunity = scoredDimension("OPPORTUNITY", ASSET_A, 8_000);
    const mismatchedOpportunity = Object.freeze({
      ...opportunity,
      classification: Object.freeze({
        ...opportunity.classification,
        sector: "BANKS",
      }),
    });
    const radar = rankInvestmentCandidates(BASELINE_PORTFOLIO_RANKING_METHODOLOGY, {
      portfolioId: PORTFOLIO_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      candidates: [
        {
          assetId: ASSET_A,
          quality: scoredDimension("QUALITY", ASSET_A, 8_000),
          opportunity: mismatchedOpportunity,
          portfolioFit: portfolioFit(ASSET_A),
        },
      ],
    });

    expect(radar.ranked).toEqual([]);
    expect(radar.insufficient[0]).toMatchObject({
      reasons: ["ANALYTICAL_CLASSIFICATION_MISMATCH"],
    });
  });
});