import { AssetId, PortfolioId } from "@portfolio-copilot/domain";

import { normalizeEvaluationInstant } from "./evidence";
import type { PortfolioFitResult, PortfolioFitSnapshot } from "./portfolio-fit";
import type { PortfolioRankingMethodology } from "./portfolio-ranking-methodology";
import type { InvestmentScoreResult, InvestmentScoreSnapshot } from "./score";

export type InvestmentRankingInsufficientReason =
  | "QUALITY_INSUFFICIENT_DATA"
  | "OPPORTUNITY_INSUFFICIENT_DATA"
  | "PORTFOLIO_FIT_INSUFFICIENT_DATA"
  | "DIMENSION_AS_OF_MISMATCH"
  | "ANALYTICAL_METHODOLOGY_MISMATCH"
  | "ANALYTICAL_CLASSIFICATION_MISMATCH"
  | "PORTFOLIO_FIT_METHODOLOGY_MISMATCH"
  | "PORTFOLIO_CONTEXT_MISMATCH";

export type InvestmentCandidateRankingInput = Readonly<{
  assetId: string;
  quality: InvestmentScoreResult;
  opportunity: InvestmentScoreResult;
  portfolioFit: PortfolioFitResult;
}>;

export type InvestmentRankingEvaluationInput = Readonly<{
  portfolioId: string;
  evaluationAsOf: string;
  candidates: readonly InvestmentCandidateRankingInput[];
}>;

export type InvestmentRankingDimensionContribution = Readonly<{
  scoreBps: number;
  weightBps: number;
  weightedContributionNumerator: number;
}>;

export type InvestmentCandidateRankingSnapshot = Readonly<{
  status: "RANKED";
  rank: number;
  assetId: string;
  rankingScoreBps: number;
  quality: InvestmentScoreSnapshot;
  opportunity: InvestmentScoreSnapshot;
  portfolioFit: PortfolioFitSnapshot;
  contributions: Readonly<{
    quality: InvestmentRankingDimensionContribution;
    opportunity: InvestmentRankingDimensionContribution;
    portfolioFit: InvestmentRankingDimensionContribution;
  }>;
  reasonCodes: readonly string[];
}>;

export type InvestmentCandidateRankingInsufficientData = Readonly<{
  status: "INSUFFICIENT_DATA";
  assetId: string;
  reasonCodes: readonly string[];
  reasons: readonly InvestmentRankingInsufficientReason[];
  quality: InvestmentScoreResult;
  opportunity: InvestmentScoreResult;
  portfolioFit: PortfolioFitResult;
}>;

export type InvestmentRadarSnapshot = Readonly<{
  status: "RANKED";
  portfolioId: string;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  tieBreakRule: "RANKING_SCORE_DESC_ASSET_ID_ASC";
  ranked: readonly InvestmentCandidateRankingSnapshot[];
  insufficient: readonly InvestmentCandidateRankingInsufficientData[];
}>;

export class InvalidInvestmentRankingInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidInvestmentRankingInputError";
  }
}

function contribution(
  scoreBps: number,
  weightBps: number,
): InvestmentRankingDimensionContribution {
  return Object.freeze({
    scoreBps,
    weightBps,
    weightedContributionNumerator: scoreBps * weightBps,
  });
}

function aggregateRankingScore(
  contributions: Readonly<{
    quality: InvestmentRankingDimensionContribution;
    opportunity: InvestmentRankingDimensionContribution;
    portfolioFit: InvestmentRankingDimensionContribution;
  }>,
): number {
  const numerator =
    contributions.quality.weightedContributionNumerator +
    contributions.opportunity.weightedContributionNumerator +
    contributions.portfolioFit.weightedContributionNumerator;
  return Math.floor((numerator + 5_000) / 10_000);
}

function compareAssetId(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function prefixedScoreReasons(prefix: string, score: InvestmentScoreResult): readonly string[] {
  if (score.status === "INSUFFICIENT_DATA") {
    return score.reasonCodes.map((reason) => `${prefix}:${reason}`);
  }

  return score.components.flatMap((component) =>
    component.reasonCodes.map((reason) => `${prefix}:${reason}`),
  );
}

function prefixedPortfolioFitReasons(portfolioFit: PortfolioFitResult): readonly string[] {
  return portfolioFit.reasonCodes.map((reason) => `PORTFOLIO_FIT:${reason}`);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

function sameAnalyticalClassification(
  quality: InvestmentScoreResult,
  opportunity: InvestmentScoreResult,
): boolean {
  return (
    quality.classification.assetClass === opportunity.classification.assetClass &&
    quality.classification.instrumentType === opportunity.classification.instrumentType &&
    quality.classification.sector === opportunity.classification.sector
  );
}

function assertCandidateShape(candidate: InvestmentCandidateRankingInput, assetId: string): void {
  if (candidate.quality.kind !== "QUALITY") {
    throw new InvalidInvestmentRankingInputError(
      `Candidate ${assetId} quality dimension must have kind QUALITY.`,
    );
  }
  if (candidate.opportunity.kind !== "OPPORTUNITY") {
    throw new InvalidInvestmentRankingInputError(
      `Candidate ${assetId} opportunity dimension must have kind OPPORTUNITY.`,
    );
  }
  if (
    candidate.quality.assetId !== assetId ||
    candidate.opportunity.assetId !== assetId ||
    candidate.portfolioFit.assetId !== assetId
  ) {
    throw new InvalidInvestmentRankingInputError(
      `Candidate ${assetId} contains a dimension for another asset.`,
    );
  }
}

function insufficientCandidate(
  assetId: string,
  candidate: InvestmentCandidateRankingInput,
  reasons: readonly InvestmentRankingInsufficientReason[],
): InvestmentCandidateRankingInsufficientData {
  return Object.freeze({
    status: "INSUFFICIENT_DATA",
    assetId,
    reasons: Object.freeze([...new Set(reasons)].sort()),
    reasonCodes: uniqueSorted([
      ...prefixedScoreReasons("QUALITY", candidate.quality),
      ...prefixedScoreReasons("OPPORTUNITY", candidate.opportunity),
      ...prefixedPortfolioFitReasons(candidate.portfolioFit),
    ]),
    quality: candidate.quality,
    opportunity: candidate.opportunity,
    portfolioFit: candidate.portfolioFit,
  });
}

function scoreCandidate(
  methodology: PortfolioRankingMethodology,
  portfolioId: string,
  evaluationAsOf: string,
  candidate: InvestmentCandidateRankingInput,
): InvestmentCandidateRankingSnapshot | InvestmentCandidateRankingInsufficientData {
  const assetId = AssetId.from(candidate.assetId).toString();
  assertCandidateShape(candidate, assetId);

  const reasons: InvestmentRankingInsufficientReason[] = [];
  if (candidate.quality.status !== "SCORED") reasons.push("QUALITY_INSUFFICIENT_DATA");
  if (candidate.opportunity.status !== "SCORED") {
    reasons.push("OPPORTUNITY_INSUFFICIENT_DATA");
  }
  if (candidate.portfolioFit.status !== "SCORED") {
    reasons.push("PORTFOLIO_FIT_INSUFFICIENT_DATA");
  }

  if (
    candidate.quality.evaluationAsOf !== evaluationAsOf ||
    candidate.opportunity.evaluationAsOf !== evaluationAsOf ||
    candidate.portfolioFit.evaluationAsOf !== evaluationAsOf
  ) {
    reasons.push("DIMENSION_AS_OF_MISMATCH");
  }

  if (
    candidate.quality.methodologyId !== candidate.opportunity.methodologyId ||
    candidate.quality.methodologyVersion !== candidate.opportunity.methodologyVersion
  ) {
    reasons.push("ANALYTICAL_METHODOLOGY_MISMATCH");
  }

  if (!sameAnalyticalClassification(candidate.quality, candidate.opportunity)) {
    reasons.push("ANALYTICAL_CLASSIFICATION_MISMATCH");
  }

  if (
    candidate.portfolioFit.methodologyId !== methodology.methodologyId ||
    candidate.portfolioFit.methodologyVersion !== methodology.version
  ) {
    reasons.push("PORTFOLIO_FIT_METHODOLOGY_MISMATCH");
  }

  if (candidate.portfolioFit.portfolioId !== portfolioId) {
    reasons.push("PORTFOLIO_CONTEXT_MISMATCH");
  }

  if (reasons.length > 0) {
    return insufficientCandidate(assetId, candidate, reasons);
  }

  const quality = candidate.quality as InvestmentScoreSnapshot;
  const opportunity = candidate.opportunity as InvestmentScoreSnapshot;
  const portfolioFit = candidate.portfolioFit as PortfolioFitSnapshot;
  const contributions = Object.freeze({
    quality: contribution(quality.scoreBps, methodology.rankingWeights.qualityWeightBps),
    opportunity: contribution(
      opportunity.scoreBps,
      methodology.rankingWeights.opportunityWeightBps,
    ),
    portfolioFit: contribution(
      portfolioFit.scoreBps,
      methodology.rankingWeights.portfolioFitWeightBps,
    ),
  });

  return Object.freeze({
    status: "RANKED",
    rank: 0,
    assetId,
    rankingScoreBps: aggregateRankingScore(contributions),
    quality,
    opportunity,
    portfolioFit,
    contributions,
    reasonCodes: uniqueSorted([
      ...prefixedScoreReasons("QUALITY", quality),
      ...prefixedScoreReasons("OPPORTUNITY", opportunity),
      ...prefixedPortfolioFitReasons(portfolioFit),
    ]),
  });
}

export function rankInvestmentCandidates(
  methodology: PortfolioRankingMethodology,
  input: InvestmentRankingEvaluationInput,
): InvestmentRadarSnapshot {
  const portfolioId = PortfolioId.from(input.portfolioId).toString();
  const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
  const seenAssetIds = new Set<string>();
  const ranked: InvestmentCandidateRankingSnapshot[] = [];
  const insufficient: InvestmentCandidateRankingInsufficientData[] = [];

  for (const candidate of input.candidates) {
    const assetId = AssetId.from(candidate.assetId).toString();
    if (seenAssetIds.has(assetId)) {
      throw new InvalidInvestmentRankingInputError(`Duplicate ranking candidate ${assetId}.`);
    }
    seenAssetIds.add(assetId);

    const result = scoreCandidate(methodology, portfolioId, evaluationAsOf, candidate);
    if (result.status === "RANKED") ranked.push(result);
    else insufficient.push(result);
  }

  ranked.sort((left, right) => {
    if (left.rankingScoreBps !== right.rankingScoreBps) {
      return right.rankingScoreBps - left.rankingScoreBps;
    }
    return compareAssetId(left.assetId, right.assetId);
  });

  const rankedWithPositions = Object.freeze(
    ranked.map((candidate, index) =>
      Object.freeze({
        ...candidate,
        rank: index + 1,
      }),
    ),
  );

  insufficient.sort((left, right) => compareAssetId(left.assetId, right.assetId));

  return Object.freeze({
    status: "RANKED",
    portfolioId,
    evaluationAsOf,
    methodologyId: methodology.methodologyId,
    methodologyVersion: methodology.version,
    tieBreakRule: "RANKING_SCORE_DESC_ASSET_ID_ASC",
    ranked: rankedWithPositions,
    insufficient: Object.freeze(insufficient),
  });
}
