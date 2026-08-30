import {
  AssetClass,
  AssetId,
  type AllocationGap,
  type ContributionRecommendationDecisionSnapshot,
  type ContributionRecommendationSnapshot,
  type ContributionRecommendationStatus,
} from "@portfolio-copilot/domain";

import { normalizeEvaluationInstant } from "./evidence";
import type { PortfolioRankingMethodology } from "./portfolio-ranking-methodology";

export type PortfolioFitComponentId =
  "ALLOCATION_GAP" | "CONCENTRATION" | "CONTRIBUTION_ELIGIBILITY";

export type PortfolioFitReasonCode =
  | "ALLOCATION_GAP_PRESENT"
  | "NO_ALLOCATION_GAP"
  | "CONTRIBUTION_EXECUTABLE"
  | "CONTRIBUTION_POLICY_ADJUSTED"
  | "WITHIN_CONCENTRATION_LIMITS"
  | "SOFT_CONCENTRATION_LIMIT_EXCEEDED"
  | "HARD_CONCENTRATION_LIMIT_APPLIED"
  | "EXECUTION_DESTINATION_INELIGIBLE"
  | "KNOWN_COSTS_BLOCKED_DESTINATION"
  | "CONTRIBUTION_NOT_SELECTED_BY_POLICY"
  | "CONTRIBUTION_BLOCKED_CONCENTRATION_LIMIT"
  | "CONTRIBUTION_BLOCKED_INELIGIBLE"
  | "CONTRIBUTION_BLOCKED_KNOWN_COSTS";

export type PortfolioFitInsufficientReason =
  | "MISSING_CONTRIBUTION_CONTEXT"
  | "ALLOCATION_GAP_ASSET_CLASS_MISMATCH"
  | "CONTRIBUTION_PORTFOLIO_MISMATCH"
  | "CONTRIBUTION_ASSET_MISMATCH";

export type PortfolioFitComponentSnapshot = Readonly<{
  componentId: PortfolioFitComponentId;
  scoreBps: number;
  weightBps: number;
  weightedContributionNumerator: number;
  reasonCodes: readonly PortfolioFitReasonCode[];
}>;

export type PortfolioFitSnapshot = Readonly<{
  status: "SCORED";
  kind: "PORTFOLIO_FIT";
  assetId: string;
  assetClass: string;
  portfolioId: string;
  scoreBps: number;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  hardBlockStatus: ContributionRecommendationStatus | null;
  components: readonly PortfolioFitComponentSnapshot[];
  reasonCodes: readonly PortfolioFitReasonCode[];
}>;

export type PortfolioFitInsufficientData = Readonly<{
  status: "INSUFFICIENT_DATA";
  kind: "PORTFOLIO_FIT";
  assetId: string;
  assetClass: string;
  portfolioId: string;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  reasonCodes: readonly PortfolioFitInsufficientReason[];
}>;

export type PortfolioFitResult = PortfolioFitSnapshot | PortfolioFitInsufficientData;

export type PortfolioFitEvaluationInput = Readonly<{
  assetId: string;
  assetClass: AssetClass | string;
  evaluationAsOf: string;
  allocationGap: AllocationGap;
  contributionRecommendation: ContributionRecommendationSnapshot | null;
}>;

export class InvalidPortfolioFitInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidPortfolioFitInputError";
  }
}

const BLOCKED_STATUSES = new Set<ContributionRecommendationStatus>([
  "NOT_SELECTED_BY_POLICY",
  "BLOCKED_CONCENTRATION_LIMIT",
  "BLOCKED_INELIGIBLE",
  "BLOCKED_KNOWN_COSTS",
]);

function ratioBasisPoints(numerator: bigint, denominator: bigint): number {
  if (numerator < 0n || denominator < 0n) {
    throw new InvalidPortfolioFitInputError("Portfolio Fit monetary values cannot be negative.");
  }
  if (denominator === 0n) return 0;

  const rounded = (numerator * 10_000n + denominator / 2n) / denominator;
  const capped = rounded > 10_000n ? 10_000n : rounded;
  return Number(capped);
}

function component(
  componentId: PortfolioFitComponentId,
  scoreBps: number,
  weightBps: number,
  reasonCodes: readonly PortfolioFitReasonCode[],
): PortfolioFitComponentSnapshot {
  return Object.freeze({
    componentId,
    scoreBps,
    weightBps,
    weightedContributionNumerator: scoreBps * weightBps,
    reasonCodes: Object.freeze([...reasonCodes]),
  });
}

function aggregateScore(components: readonly PortfolioFitComponentSnapshot[]): number {
  const numerator = components.reduce(
    (sum, candidate) => sum + candidate.weightedContributionNumerator,
    0,
  );
  return Math.floor((numerator + 5_000) / 10_000);
}

function uniqueReasons(
  values: readonly PortfolioFitReasonCode[],
): readonly PortfolioFitReasonCode[] {
  return Object.freeze([...new Set(values)].sort());
}

function decisionReasonCodes(
  decision: ContributionRecommendationDecisionSnapshot,
): readonly PortfolioFitReasonCode[] {
  const reasons: PortfolioFitReasonCode[] = [...decision.reasonCodes];

  switch (decision.status) {
    case "EXECUTABLE":
      reasons.push("CONTRIBUTION_EXECUTABLE");
      break;
    case "NOT_SELECTED_BY_POLICY":
      reasons.push("CONTRIBUTION_NOT_SELECTED_BY_POLICY");
      break;
    case "BLOCKED_CONCENTRATION_LIMIT":
      reasons.push("CONTRIBUTION_BLOCKED_CONCENTRATION_LIMIT");
      break;
    case "BLOCKED_INELIGIBLE":
      reasons.push("CONTRIBUTION_BLOCKED_INELIGIBLE");
      break;
    case "BLOCKED_KNOWN_COSTS":
      reasons.push("CONTRIBUTION_BLOCKED_KNOWN_COSTS");
      break;
  }

  return uniqueReasons(reasons);
}

function insufficient(
  methodology: PortfolioRankingMethodology,
  input: Readonly<{
    assetId: string;
    assetClass: string;
    portfolioId: string;
    evaluationAsOf: string;
  }>,
  reasonCodes: readonly PortfolioFitInsufficientReason[],
): PortfolioFitInsufficientData {
  return Object.freeze({
    status: "INSUFFICIENT_DATA",
    kind: "PORTFOLIO_FIT",
    assetId: input.assetId,
    assetClass: input.assetClass,
    portfolioId: input.portfolioId,
    evaluationAsOf: input.evaluationAsOf,
    methodologyId: methodology.methodologyId,
    methodologyVersion: methodology.version,
    reasonCodes: Object.freeze([...new Set(reasonCodes)].sort()),
  });
}

function findContributionDecision(
  recommendation: ContributionRecommendationSnapshot,
  assetClass: string,
): ContributionRecommendationDecisionSnapshot | null {
  const matches = recommendation.decisions.filter((decision) => decision.assetClass === assetClass);
  if (matches.length > 1) {
    throw new InvalidPortfolioFitInputError(
      `Contribution recommendation contains duplicate decisions for ${assetClass}.`,
    );
  }

  return matches[0] ?? null;
}

export function evaluatePortfolioFit(
  methodology: PortfolioRankingMethodology,
  input: PortfolioFitEvaluationInput,
): PortfolioFitResult {
  const assetId = AssetId.from(input.assetId).toString();
  const assetClass =
    input.assetClass instanceof AssetClass ? input.assetClass : AssetClass.from(input.assetClass);
  const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
  const portfolioId = input.allocationGap.portfolioId.toString();

  if (input.allocationGap.gap.isNegative() || input.allocationGap.targetValue.isNegative()) {
    throw new InvalidPortfolioFitInputError("Allocation gap values cannot be negative.");
  }
  if (input.allocationGap.gap.compare(input.allocationGap.targetValue) > 0) {
    throw new InvalidPortfolioFitInputError("Allocation gap cannot exceed its target value.");
  }

  const base = Object.freeze({
    assetId,
    assetClass: assetClass.code,
    portfolioId,
    evaluationAsOf,
  });

  if (input.allocationGap.assetClass.code !== assetClass.code) {
    return insufficient(methodology, base, ["ALLOCATION_GAP_ASSET_CLASS_MISMATCH"]);
  }

  const allocationScoreBps = ratioBasisPoints(
    input.allocationGap.gap.minorUnits,
    input.allocationGap.targetValue.minorUnits,
  );

  if (input.allocationGap.gap.isZero()) {
    const components = Object.freeze([
      component("ALLOCATION_GAP", 0, methodology.portfolioFitWeights.allocationGapWeightBps, [
        "NO_ALLOCATION_GAP",
      ]),
      component("CONCENTRATION", 0, methodology.portfolioFitWeights.concentrationWeightBps, [
        "NO_ALLOCATION_GAP",
      ]),
      component(
        "CONTRIBUTION_ELIGIBILITY",
        0,
        methodology.portfolioFitWeights.contributionEligibilityWeightBps,
        ["NO_ALLOCATION_GAP"],
      ),
    ]);

    return Object.freeze({
      status: "SCORED",
      kind: "PORTFOLIO_FIT",
      ...base,
      scoreBps: 0,
      methodologyId: methodology.methodologyId,
      methodologyVersion: methodology.version,
      hardBlockStatus: null,
      components,
      reasonCodes: Object.freeze(["NO_ALLOCATION_GAP"] as const),
    });
  }

  const recommendation = input.contributionRecommendation;
  if (recommendation === null) {
    return insufficient(methodology, base, ["MISSING_CONTRIBUTION_CONTEXT"]);
  }
  if (recommendation.portfolioId !== portfolioId) {
    return insufficient(methodology, base, ["CONTRIBUTION_PORTFOLIO_MISMATCH"]);
  }

  const decision = findContributionDecision(recommendation, assetClass.code);
  if (decision === null) {
    return insufficient(methodology, base, ["MISSING_CONTRIBUTION_CONTEXT"]);
  }
  if (decision.assetId !== null && decision.assetId !== assetId) {
    return insufficient(methodology, base, ["CONTRIBUTION_ASSET_MISMATCH"]);
  }

  const decisionReasons = decisionReasonCodes(decision);
  const reasons = uniqueReasons(["ALLOCATION_GAP_PRESENT", ...decisionReasons]);
  const hardBlockStatus = BLOCKED_STATUSES.has(decision.status) ? decision.status : null;
  const hardConcentrationLimitApplied =
    decision.status === "BLOCKED_CONCENTRATION_LIMIT" ||
    decision.reasonCodes.includes("HARD_CONCENTRATION_LIMIT_APPLIED");
  const softConcentrationLimitExceeded = decision.reasonCodes.includes(
    "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
  );
  const concentrationScoreBps = hardConcentrationLimitApplied
    ? 0
    : softConcentrationLimitExceeded
      ? methodology.softConcentrationScoreBps
      : 10_000;
  const concentrationReasonCodes: PortfolioFitReasonCode[] = [];
  if (hardConcentrationLimitApplied) {
    concentrationReasonCodes.push("HARD_CONCENTRATION_LIMIT_APPLIED");
  }
  if (softConcentrationLimitExceeded) {
    concentrationReasonCodes.push("SOFT_CONCENTRATION_LIMIT_EXCEEDED");
  }
  if (concentrationReasonCodes.length === 0) {
    concentrationReasonCodes.push("WITHIN_CONCENTRATION_LIMITS");
  }
  const contributionEligibilityScoreBps = decision.status === "EXECUTABLE" ? 10_000 : 0;

  const components = Object.freeze([
    component(
      "ALLOCATION_GAP",
      allocationScoreBps,
      methodology.portfolioFitWeights.allocationGapWeightBps,
      ["ALLOCATION_GAP_PRESENT"],
    ),
    component(
      "CONCENTRATION",
      concentrationScoreBps,
      methodology.portfolioFitWeights.concentrationWeightBps,
      uniqueReasons(concentrationReasonCodes),
    ),
    component(
      "CONTRIBUTION_ELIGIBILITY",
      contributionEligibilityScoreBps,
      methodology.portfolioFitWeights.contributionEligibilityWeightBps,
      decisionReasons,
    ),
  ]);

  return Object.freeze({
    status: "SCORED",
    kind: "PORTFOLIO_FIT",
    ...base,
    scoreBps: hardBlockStatus === null ? aggregateScore(components) : 0,
    methodologyId: methodology.methodologyId,
    methodologyVersion: methodology.version,
    hardBlockStatus,
    components,
    reasonCodes: reasons,
  });
}
