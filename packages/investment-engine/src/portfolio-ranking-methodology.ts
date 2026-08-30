import { normalizeInvestmentIdentifier } from "./evidence";

const TOTAL_WEIGHT_BPS = 10_000;
const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

export type PortfolioFitWeightsInput = Readonly<{
  allocationGapWeightBps: number;
  concentrationWeightBps: number;
  contributionEligibilityWeightBps: number;
}>;

export type PortfolioFitWeights = Readonly<{
  allocationGapWeightBps: number;
  concentrationWeightBps: number;
  contributionEligibilityWeightBps: number;
}>;

export type InvestmentRankingWeightsInput = Readonly<{
  qualityWeightBps: number;
  opportunityWeightBps: number;
  portfolioFitWeightBps: number;
}>;

export type InvestmentRankingWeights = Readonly<{
  qualityWeightBps: number;
  opportunityWeightBps: number;
  portfolioFitWeightBps: number;
}>;

export type PortfolioRankingMethodologyInput = Readonly<{
  methodologyId: string;
  version: string;
  portfolioFitWeights: PortfolioFitWeightsInput;
  rankingWeights: InvestmentRankingWeightsInput;
  softConcentrationScoreBps: number;
}>;

export type PortfolioRankingMethodology = Readonly<{
  methodologyId: string;
  version: string;
  portfolioFitWeights: PortfolioFitWeights;
  rankingWeights: InvestmentRankingWeights;
  softConcentrationScoreBps: number;
}>;

export class InvalidPortfolioRankingMethodologyError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidPortfolioRankingMethodologyError";
  }
}

function normalizeVersion(value: string): string {
  const normalized = value.trim();
  if (!VERSION_PATTERN.test(normalized)) {
    throw new InvalidPortfolioRankingMethodologyError(
      `Invalid portfolio ranking methodology version: ${JSON.stringify(value)}`,
    );
  }

  return normalized;
}

function normalizeWeight(field: string, value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > TOTAL_WEIGHT_BPS) {
    throw new InvalidPortfolioRankingMethodologyError(
      `Invalid ${field}: ${String(value)}. Expected an integer from 1 to ${TOTAL_WEIGHT_BPS}.`,
    );
  }

  return value;
}

function normalizeScoreBps(field: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > TOTAL_WEIGHT_BPS) {
    throw new InvalidPortfolioRankingMethodologyError(
      `Invalid ${field}: ${String(value)}. Expected an integer from 0 to ${TOTAL_WEIGHT_BPS}.`,
    );
  }

  return value;
}

function assertTotalWeight(field: string, weights: readonly number[]): void {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total !== TOTAL_WEIGHT_BPS) {
    throw new InvalidPortfolioRankingMethodologyError(
      `${field} weights must sum to ${TOTAL_WEIGHT_BPS}, received ${total}.`,
    );
  }
}

export function createPortfolioRankingMethodology(
  input: PortfolioRankingMethodologyInput,
): PortfolioRankingMethodology {
  const portfolioFitWeights = Object.freeze({
    allocationGapWeightBps: normalizeWeight(
      "portfolioFitWeights.allocationGapWeightBps",
      input.portfolioFitWeights.allocationGapWeightBps,
    ),
    concentrationWeightBps: normalizeWeight(
      "portfolioFitWeights.concentrationWeightBps",
      input.portfolioFitWeights.concentrationWeightBps,
    ),
    contributionEligibilityWeightBps: normalizeWeight(
      "portfolioFitWeights.contributionEligibilityWeightBps",
      input.portfolioFitWeights.contributionEligibilityWeightBps,
    ),
  });

  assertTotalWeight("Portfolio Fit", [
    portfolioFitWeights.allocationGapWeightBps,
    portfolioFitWeights.concentrationWeightBps,
    portfolioFitWeights.contributionEligibilityWeightBps,
  ]);

  const rankingWeights = Object.freeze({
    qualityWeightBps: normalizeWeight(
      "rankingWeights.qualityWeightBps",
      input.rankingWeights.qualityWeightBps,
    ),
    opportunityWeightBps: normalizeWeight(
      "rankingWeights.opportunityWeightBps",
      input.rankingWeights.opportunityWeightBps,
    ),
    portfolioFitWeightBps: normalizeWeight(
      "rankingWeights.portfolioFitWeightBps",
      input.rankingWeights.portfolioFitWeightBps,
    ),
  });

  assertTotalWeight("Ranking", [
    rankingWeights.qualityWeightBps,
    rankingWeights.opportunityWeightBps,
    rankingWeights.portfolioFitWeightBps,
  ]);

  return Object.freeze({
    methodologyId: normalizeInvestmentIdentifier("methodologyId", input.methodologyId),
    version: normalizeVersion(input.version),
    portfolioFitWeights,
    rankingWeights,
    softConcentrationScoreBps: normalizeScoreBps(
      "softConcentrationScoreBps",
      input.softConcentrationScoreBps,
    ),
  });
}

export const BASELINE_PORTFOLIO_RANKING_METHODOLOGY = createPortfolioRankingMethodology({
  methodologyId: "PORTFOLIO_FIT_RANKING_BR",
  version: "1.0.0",
  portfolioFitWeights: {
    allocationGapWeightBps: 4_000,
    concentrationWeightBps: 3_000,
    contributionEligibilityWeightBps: 3_000,
  },
  rankingWeights: {
    qualityWeightBps: 3_500,
    opportunityWeightBps: 3_500,
    portfolioFitWeightBps: 3_000,
  },
  softConcentrationScoreBps: 5_000,
});
