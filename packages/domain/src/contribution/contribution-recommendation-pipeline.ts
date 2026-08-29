import { AssetClass, AssetId, AssetQuantity, type AssetClassCode } from "../asset";
import { Money } from "../financial";
import {
  applyAssetClassConcentrationLimits,
  type AssetClassConcentrationLimitInput,
} from "./asset-class-concentration-limits";
import {
  allocateContribution,
  type ContributionAllocatorInput,
  type ContributionPlan,
} from "./contribution-allocator";
import {
  applyContributionCostTaxConstraints,
  type ContributionCostAdjustedDestination,
  type ContributionCostTaxConstraintInput,
} from "./contribution-cost-tax-constraints";
import {
  applyContributionExecutionConstraints,
  type ContributionExecutionDestinationInput,
} from "./contribution-execution-constraints";
import { InvalidContributionMethodologyVersionError } from "./errors";
import { applyContributionPolicy, type ContributionPolicy } from "./contribution-policy";

export const CONTRIBUTION_RECOMMENDATION_REASON_CODES = [
  "CONTRIBUTION_POLICY_ADJUSTED",
  "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
  "HARD_CONCENTRATION_LIMIT_APPLIED",
  "EXECUTION_DESTINATION_INELIGIBLE",
  "KNOWN_COSTS_BLOCKED_DESTINATION",
] as const;

export type ContributionRecommendationReasonCode =
  (typeof CONTRIBUTION_RECOMMENDATION_REASON_CODES)[number];

export const CONTRIBUTION_RECOMMENDATION_STATUSES = [
  "EXECUTABLE",
  "NOT_SELECTED_BY_POLICY",
  "BLOCKED_CONCENTRATION_LIMIT",
  "BLOCKED_INELIGIBLE",
  "BLOCKED_KNOWN_COSTS",
] as const;

export type ContributionRecommendationStatus =
  (typeof CONTRIBUTION_RECOMMENDATION_STATUSES)[number];

export type ContributionRecommendationPipelineInput = Readonly<{
  methodologyVersion: string;
  allocation: ContributionAllocatorInput;
  policy: ContributionPolicy;
  concentrationLimits: readonly AssetClassConcentrationLimitInput[];
  executionDestinations: readonly ContributionExecutionDestinationInput[];
  costTaxConstraints: readonly ContributionCostTaxConstraintInput[];
}>;

export type ContributionRecommendationPolicySnapshot = Readonly<{
  minimumMeaningfulContribution: string;
  maxDestinationsPerContribution: number;
}>;

export type ContributionRecommendationCashRemainderSnapshot = Readonly<{
  afterAllocator: string;
  afterPolicy: string;
  afterConcentration: string;
  afterExecution: string;
  afterCosts: string;
}>;

export type ContributionRecommendationDecisionSnapshot = Readonly<{
  assetClass: string;
  assetId: string | null;
  targetWeightPercent: string;
  currentValue: string;
  postContributionTargetValue: string;
  postContributionNeed: string;
  baselineAllocatedAmount: string;
  policyAllocatedAmount: string;
  concentrationAllocatedAmount: string;
  concentrationBlockedAmount: string;
  softMaxWeightPercent: string | null;
  hardMaxWeightPercent: string | null;
  executionEligible: boolean | null;
  minimumTradableQuantity: string | null;
  transactionCost: string;
  estimatedTaxImpact: string;
  totalKnownCost: string;
  consumedKnownCost: string;
  investableAmount: string;
  status: ContributionRecommendationStatus;
  reasonCodes: readonly ContributionRecommendationReasonCode[];
}>;

export type ContributionRecommendationSnapshot = Readonly<{
  methodologyVersion: string;
  portfolioId: string;
  currency: string;
  portfolioValue: string;
  contribution: string;
  postContributionValue: string;
  policy: ContributionRecommendationPolicySnapshot;
  cashRemainder: ContributionRecommendationCashRemainderSnapshot;
  totalInvestableAmount: string;
  totalConsumedKnownCost: string;
  unallocatedContribution: string;
  decisions: readonly ContributionRecommendationDecisionSnapshot[];
}>;

type NormalizedExecutionDestination = Readonly<{
  assetId: AssetId;
  assetClass: AssetClass;
  isEligible: boolean;
  minimumTradableQuantity: AssetQuantity;
}>;

const METHODOLOGY_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._\/-]{0,63}$/;

function validateMethodologyVersion(value: string): string {
  if (typeof value !== "string" || !METHODOLOGY_VERSION_PATTERN.test(value)) {
    throw new InvalidContributionMethodologyVersionError(String(value));
  }

  return value;
}

function normalizeExecutionDestinations(
  inputs: readonly ContributionExecutionDestinationInput[],
): ReadonlyMap<AssetClassCode, NormalizedExecutionDestination> {
  return new Map(
    inputs.map((input) => {
      const assetId =
        typeof input.assetId === "string" ? AssetId.from(input.assetId) : input.assetId;
      const assetClass =
        typeof input.assetClass === "string" ? AssetClass.from(input.assetClass) : input.assetClass;
      const minimumTradableQuantity =
        typeof input.minimumTradableQuantity === "string"
          ? AssetQuantity.fromDecimal(input.minimumTradableQuantity)
          : input.minimumTradableQuantity;

      return [
        assetClass.code,
        Object.freeze({
          assetId,
          assetClass,
          isEligible: input.isEligible,
          minimumTradableQuantity,
        }),
      ] as const;
    }),
  );
}

function allocationsByClass(plan: ContributionPlan): ReadonlyMap<AssetClassCode, bigint> {
  return new Map(
    plan.allocations.map((allocation) => [
      allocation.assetClass.code,
      allocation.allocatedAmount.minorUnits,
    ]),
  );
}

function costDestinationByClass(
  destinations: readonly ContributionCostAdjustedDestination[],
): ReadonlyMap<AssetClassCode, ContributionCostAdjustedDestination> {
  return new Map(destinations.map((destination) => [destination.assetClass.code, destination]));
}

function moneyString(minorUnits: bigint, currency: Money["currency"]): string {
  return Money.fromMinorUnits(minorUnits, currency).toDecimalString();
}

export function buildContributionRecommendationSnapshot(
  input: ContributionRecommendationPipelineInput,
): ContributionRecommendationSnapshot {
  const methodologyVersion = validateMethodologyVersion(input.methodologyVersion);
  const baselinePlan = allocateContribution(input.allocation);
  const policyPlan = applyContributionPolicy({ plan: baselinePlan, policy: input.policy });
  const concentrationPlan = applyAssetClassConcentrationLimits({
    plan: policyPlan,
    limits: input.concentrationLimits,
  });
  const executionPlan = applyContributionExecutionConstraints({
    plan: concentrationPlan,
    destinations: input.executionDestinations,
  });
  const costAdjustedPlan = applyContributionCostTaxConstraints({
    plan: executionPlan,
    constraints: input.costTaxConstraints,
  });

  const baselineByClass = allocationsByClass(baselinePlan);
  const policyByClass = allocationsByClass(policyPlan);
  const executionDestinationsByClass = normalizeExecutionDestinations(input.executionDestinations);
  const costDestinationsByClass = costDestinationByClass(costAdjustedPlan.destinations);
  let totalInvestableMinorUnits = 0n;
  let totalConsumedKnownCostMinorUnits = 0n;

  const decisions = concentrationPlan.allocations
    .filter((allocation) => {
      const baselineAmount = baselineByClass.get(allocation.assetClass.code) ?? 0n;
      const policyAmount = policyByClass.get(allocation.assetClass.code) ?? 0n;
      return baselineAmount > 0n || policyAmount > 0n || allocation.allocatedAmount.minorUnits > 0n;
    })
    .map<ContributionRecommendationDecisionSnapshot>((allocation) => {
      const assetClassCode = allocation.assetClass.code;
      const baselineMinorUnits = baselineByClass.get(assetClassCode) ?? 0n;
      const policyMinorUnits = policyByClass.get(assetClassCode) ?? 0n;
      const concentrationMinorUnits = allocation.allocatedAmount.minorUnits;
      const executionDestination =
        concentrationMinorUnits > 0n ? executionDestinationsByClass.get(assetClassCode) : undefined;
      const costDestination = costDestinationsByClass.get(assetClassCode);
      const reasonCodes: ContributionRecommendationReasonCode[] = [];

      if (baselineMinorUnits !== policyMinorUnits) {
        reasonCodes.push("CONTRIBUTION_POLICY_ADJUSTED");
      }
      if (allocation.softLimitExceeded) {
        reasonCodes.push("SOFT_CONCENTRATION_LIMIT_EXCEEDED");
      }
      if (allocation.hardLimitApplied) {
        reasonCodes.push("HARD_CONCENTRATION_LIMIT_APPLIED");
      }
      if (executionDestination !== undefined && !executionDestination.isEligible) {
        reasonCodes.push("EXECUTION_DESTINATION_INELIGIBLE");
      }
      if (costDestination?.status === "BLOCKED_KNOWN_COSTS") {
        reasonCodes.push("KNOWN_COSTS_BLOCKED_DESTINATION");
      }

      let status: ContributionRecommendationStatus;
      if (baselineMinorUnits > 0n && policyMinorUnits === 0n) {
        status = "NOT_SELECTED_BY_POLICY";
      } else if (policyMinorUnits > 0n && concentrationMinorUnits === 0n) {
        status = "BLOCKED_CONCENTRATION_LIMIT";
      } else if (executionDestination !== undefined && !executionDestination.isEligible) {
        status = "BLOCKED_INELIGIBLE";
      } else if (costDestination?.status === "BLOCKED_KNOWN_COSTS") {
        status = "BLOCKED_KNOWN_COSTS";
      } else {
        status = "EXECUTABLE";
      }

      const isExecutable = status === "EXECUTABLE" && costDestination !== undefined;
      const transactionCostMinorUnits = costDestination?.transactionCost.minorUnits ?? 0n;
      const estimatedTaxImpactMinorUnits = costDestination?.estimatedTaxImpact.minorUnits ?? 0n;
      const totalKnownCostMinorUnits = costDestination?.totalKnownCost.minorUnits ?? 0n;
      const consumedKnownCostMinorUnits = isExecutable ? totalKnownCostMinorUnits : 0n;
      const investableMinorUnits = isExecutable ? costDestination.investableAmount.minorUnits : 0n;

      totalInvestableMinorUnits += investableMinorUnits;
      totalConsumedKnownCostMinorUnits += consumedKnownCostMinorUnits;

      return Object.freeze({
        assetClass: assetClassCode,
        assetId: executionDestination?.assetId.toString() ?? null,
        targetWeightPercent: input.allocation.targetAllocation
          .targetWeightFor(allocation.assetClass)
          .toPercentString(),
        currentValue: allocation.currentValue.toDecimalString(),
        postContributionTargetValue: allocation.postContributionTargetValue.toDecimalString(),
        postContributionNeed: allocation.postContributionNeed.toDecimalString(),
        baselineAllocatedAmount: moneyString(
          baselineMinorUnits,
          baselinePlan.contribution.currency,
        ),
        policyAllocatedAmount: moneyString(policyMinorUnits, baselinePlan.contribution.currency),
        concentrationAllocatedAmount: moneyString(
          concentrationMinorUnits,
          baselinePlan.contribution.currency,
        ),
        concentrationBlockedAmount: allocation.blockedAmount.toDecimalString(),
        softMaxWeightPercent: allocation.softMaxWeight?.toPercentString() ?? null,
        hardMaxWeightPercent: allocation.hardMaxWeight?.toPercentString() ?? null,
        executionEligible: executionDestination?.isEligible ?? null,
        minimumTradableQuantity:
          executionDestination?.minimumTradableQuantity.toDecimalString() ?? null,
        transactionCost: moneyString(transactionCostMinorUnits, baselinePlan.contribution.currency),
        estimatedTaxImpact: moneyString(
          estimatedTaxImpactMinorUnits,
          baselinePlan.contribution.currency,
        ),
        totalKnownCost: moneyString(totalKnownCostMinorUnits, baselinePlan.contribution.currency),
        consumedKnownCost: moneyString(
          consumedKnownCostMinorUnits,
          baselinePlan.contribution.currency,
        ),
        investableAmount: moneyString(investableMinorUnits, baselinePlan.contribution.currency),
        status,
        reasonCodes: Object.freeze(reasonCodes),
      });
    });

  return Object.freeze({
    methodologyVersion,
    portfolioId: baselinePlan.portfolioId.toString(),
    currency: baselinePlan.contribution.currency.code,
    portfolioValue: baselinePlan.portfolioValue.toDecimalString(),
    contribution: baselinePlan.contribution.toDecimalString(),
    postContributionValue: baselinePlan.postContributionValue.toDecimalString(),
    policy: Object.freeze({
      minimumMeaningfulContribution: input.policy.minimumMeaningfulContribution.toDecimalString(),
      maxDestinationsPerContribution: input.policy.maxDestinationsPerContribution,
    }),
    cashRemainder: Object.freeze({
      afterAllocator: baselinePlan.unallocatedContribution.toDecimalString(),
      afterPolicy: policyPlan.unallocatedContribution.toDecimalString(),
      afterConcentration: concentrationPlan.unallocatedContribution.toDecimalString(),
      afterExecution: executionPlan.unallocatedContribution.toDecimalString(),
      afterCosts: costAdjustedPlan.unallocatedContribution.toDecimalString(),
    }),
    totalInvestableAmount: moneyString(
      totalInvestableMinorUnits,
      baselinePlan.contribution.currency,
    ),
    totalConsumedKnownCost: moneyString(
      totalConsumedKnownCostMinorUnits,
      baselinePlan.contribution.currency,
    ),
    unallocatedContribution: costAdjustedPlan.unallocatedContribution.toDecimalString(),
    decisions: Object.freeze(decisions),
  });
}
