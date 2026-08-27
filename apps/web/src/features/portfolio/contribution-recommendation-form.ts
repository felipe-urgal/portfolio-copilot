import {
  InvalidContributionMethodologyVersionError,
  Money,
  TargetAllocation,
  buildContributionRecommendationSnapshot,
  type ContributionRecommendationSnapshot,
} from "@portfolio-copilot/domain";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { type ContributionCostSnapshot } from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";

export type ContributionRecommendationDraft = Readonly<{
  methodologyVersion: string;
}>;

export type ContributionRecommendationFieldErrors = Readonly<{
  methodologyVersion?: string;
}>;

export type ContributionRecommendationResult =
  | Readonly<{ ok: true; snapshot: ContributionRecommendationSnapshot }>
  | Readonly<{ ok: false; errors: ContributionRecommendationFieldErrors }>;

const METHODOLOGY_VERSION_ERROR =
  "Informe uma versão explícita, não vazia e sem espaços no início ou no fim.";

export function createInitialContributionRecommendationDraft(): ContributionRecommendationDraft {
  return { methodologyVersion: "" };
}

export function createContributionRecommendationSnapshot(
  draft: ContributionRecommendationDraft,
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
  concentration: ContributionConcentrationSnapshot,
  execution: ContributionExecutionSnapshot,
  cost: ContributionCostSnapshot,
): ContributionRecommendationResult {
  const targetAllocation = TargetAllocation.fromSnapshot(baseline.targetAllocation);
  const concentrationLimits = concentration.allocations.flatMap((allocation) => {
    if (allocation.softMaxWeightPercent === null || allocation.hardMaxWeightPercent === null) {
      return [];
    }

    return [
      {
        assetClass: allocation.assetClass,
        softMaxWeight: allocation.softMaxWeightPercent,
        hardMaxWeight: allocation.hardMaxWeightPercent,
      },
    ];
  });
  const executionDestinations = execution.destinations.map((destination) => ({
    assetId: destination.assetId,
    assetClass: destination.assetClass,
    isEligible: destination.isEligible,
    minimumTradableQuantity: destination.minimumTradableQuantity,
  }));
  const costTaxConstraints = cost.destinations.map((destination) => ({
    assetId: destination.assetId,
    transactionCost: Money.fromSnapshot(destination.transactionCost),
    estimatedTaxImpact: Money.fromSnapshot(destination.estimatedTaxImpact),
  }));

  try {
    const snapshot = buildContributionRecommendationSnapshot({
      methodologyVersion: draft.methodologyVersion,
      allocation: {
        portfolioId: baseline.targetAllocation.portfolioId,
        targetAllocation,
        portfolioValue: Money.fromSnapshot(baseline.portfolioValue),
        currentValues: baseline.allocations.map((allocation) => ({
          assetClass: allocation.assetClass,
          currentValue: Money.fromSnapshot(allocation.currentValue),
        })),
        contribution: Money.fromSnapshot(baseline.contribution),
      },
      policy: {
        minimumMeaningfulContribution: Money.fromSnapshot(policy.minimumMeaningfulContribution),
        maxDestinationsPerContribution: policy.maxDestinationsPerContribution,
      },
      concentrationLimits,
      executionDestinations,
      costTaxConstraints,
    });

    return { ok: true, snapshot };
  } catch (error) {
    if (error instanceof InvalidContributionMethodologyVersionError) {
      return { ok: false, errors: { methodologyVersion: METHODOLOGY_VERSION_ERROR } };
    }

    throw error;
  }
}
