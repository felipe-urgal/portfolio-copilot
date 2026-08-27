import {
  AssetClass,
  CurrencyMismatchError,
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidMaxDestinationsPerContributionError,
  InvalidPortfolioIdError,
  Money,
  NegativeAllocationValueError,
  PortfolioId,
  applyContributionPolicy,
  type AssetClassCode,
  type ContributionPlan,
  type MoneySnapshot,
} from "@portfolio-copilot/domain";

import {
  normalizeContributionDecimal,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";

export type ContributionPolicyDraft = Readonly<{
  minimumMeaningfulContribution: string;
  maxDestinationsPerContribution: string;
}>;

export type ContributionPolicyFieldErrors = Readonly<{
  minimumMeaningfulContribution?: string;
  maxDestinationsPerContribution?: string;
  form?: string;
}>;

export type ContributionPolicyAllocationStatus = "KEPT" | "REMOVED" | "NO_BASELINE";

export type ContributionPolicyAllocationSnapshot = Readonly<{
  assetClass: AssetClassCode;
  baselineAllocatedAmount: MoneySnapshot;
  policyAllocatedAmount: MoneySnapshot;
  status: ContributionPolicyAllocationStatus;
}>;

export type ContributionPolicySnapshot = Readonly<{
  minimumMeaningfulContribution: MoneySnapshot;
  maxDestinationsPerContribution: number;
  allocations: readonly ContributionPolicyAllocationSnapshot[];
  unallocatedContribution: MoneySnapshot;
}>;

export type ContributionPolicyResult =
  | Readonly<{ ok: true; snapshot: ContributionPolicySnapshot }>
  | Readonly<{ ok: false; errors: ContributionPolicyFieldErrors }>;

const MINIMUM_FORMAT_ERROR = "Informe um valor monetário válido para o mínimo significativo.";
const MINIMUM_NEGATIVE_ERROR = "O mínimo significativo não pode ser negativo.";
const MAX_DESTINATIONS_ERROR = "Informe um inteiro positivo seguro para o limite de destinos.";
const TECHNICAL_ERROR = "Não foi possível aplicar a política local do aporte. Tente novamente.";

export function createInitialContributionPolicyDraft(): ContributionPolicyDraft {
  return {
    minimumMeaningfulContribution: "",
    maxDestinationsPerContribution: "",
  };
}

function rehydrateContributionPlan(baseline: ContributionBaselineSnapshot): ContributionPlan {
  const portfolioId = PortfolioId.from(baseline.targetAllocation.portfolioId);

  return Object.freeze({
    portfolioId,
    portfolioValue: Money.fromSnapshot(baseline.portfolioValue),
    contribution: Money.fromSnapshot(baseline.contribution),
    postContributionValue: Money.fromSnapshot(baseline.postContributionValue),
    allocations: Object.freeze(
      baseline.allocations.map((allocation) =>
        Object.freeze({
          portfolioId,
          assetClass: AssetClass.from(allocation.assetClass),
          currentValue: Money.fromSnapshot(allocation.currentValue),
          postContributionTargetValue: Money.fromSnapshot(allocation.postContributionTargetValue),
          postContributionNeed: Money.fromSnapshot(allocation.postContributionNeed),
          allocatedAmount: Money.fromSnapshot(allocation.allocatedAmount),
        }),
      ),
    ),
    unallocatedContribution: Money.fromSnapshot(baseline.unallocatedContribution),
  });
}

function allocationStatus(
  baselineAllocatedAmount: Money,
  policyAllocatedAmount: Money,
): ContributionPolicyAllocationStatus {
  if (baselineAllocatedAmount.isZero()) return "NO_BASELINE";
  if (policyAllocatedAmount.isZero()) return "REMOVED";
  return "KEPT";
}

export function createContributionPolicySnapshot(
  draft: ContributionPolicyDraft,
  baseline: ContributionBaselineSnapshot,
): ContributionPolicyResult {
  let minimumMeaningfulContribution: Money;

  try {
    minimumMeaningfulContribution = Money.fromDecimal(
      normalizeContributionDecimal(draft.minimumMeaningfulContribution),
      baseline.contribution.currency,
    );
  } catch (error) {
    if (error instanceof InvalidDecimalError) {
      return { ok: false, errors: { minimumMeaningfulContribution: MINIMUM_FORMAT_ERROR } };
    }

    if (error instanceof InvalidCurrencyCodeError) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }

  const maxDestinationsPerContribution = Number(draft.maxDestinationsPerContribution.trim());

  try {
    const baselinePlan = rehydrateContributionPlan(baseline);
    const policyPlan = applyContributionPolicy({
      plan: baselinePlan,
      policy: {
        minimumMeaningfulContribution,
        maxDestinationsPerContribution,
      },
    });
    const policyAllocations = new Map(
      policyPlan.allocations.map((allocation) => [allocation.assetClass.code, allocation] as const),
    );

    return {
      ok: true,
      snapshot: {
        minimumMeaningfulContribution: minimumMeaningfulContribution.toSnapshot(),
        maxDestinationsPerContribution,
        allocations: baselinePlan.allocations.map((allocation) => {
          const policyAllocation = policyAllocations.get(allocation.assetClass.code);

          if (policyAllocation === undefined) {
            throw new Error(`Missing policy allocation for ${allocation.assetClass.code}`);
          }

          return {
            assetClass: allocation.assetClass.code,
            baselineAllocatedAmount: allocation.allocatedAmount.toSnapshot(),
            policyAllocatedAmount: policyAllocation.allocatedAmount.toSnapshot(),
            status: allocationStatus(allocation.allocatedAmount, policyAllocation.allocatedAmount),
          };
        }),
        unallocatedContribution: policyPlan.unallocatedContribution.toSnapshot(),
      },
    };
  } catch (error) {
    if (error instanceof InvalidMaxDestinationsPerContributionError) {
      return { ok: false, errors: { maxDestinationsPerContribution: MAX_DESTINATIONS_ERROR } };
    }

    if (
      error instanceof NegativeAllocationValueError &&
      error.field === "minimumMeaningfulContribution"
    ) {
      return { ok: false, errors: { minimumMeaningfulContribution: MINIMUM_NEGATIVE_ERROR } };
    }

    if (
      error instanceof CurrencyMismatchError ||
      error instanceof InvalidPortfolioIdError ||
      error instanceof InvalidCurrencyCodeError
    ) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
