import {
  AssetClass,
  CurrencyMismatchError,
  DuplicateAssetClassConcentrationLimitError,
  InvalidAssetClassConcentrationRangeError,
  InvalidAssetClassConcentrationWeightError,
  InvalidAssetClassError,
  InvalidCurrencyCodeError,
  InvalidPortfolioIdError,
  Money,
  PortfolioId,
  applyAssetClassConcentrationLimits,
  type AssetClassCode,
  type ContributionPlan,
  type MoneySnapshot,
} from "@portfolio-copilot/domain";

import {
  normalizeContributionDecimal,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";

export type ContributionConcentrationRowDraft = Readonly<{
  assetClass: AssetClassCode;
  enabled: boolean;
  softMaxWeight: string;
  hardMaxWeight: string;
}>;

export type ContributionConcentrationDraft = Readonly<{
  rows: readonly ContributionConcentrationRowDraft[];
}>;

export type ContributionConcentrationRowErrors = Readonly<{
  softMaxWeight?: string;
  hardMaxWeight?: string;
  range?: string;
}>;

export type ContributionConcentrationFieldErrors = Readonly<{
  rows?: Partial<Record<AssetClassCode, ContributionConcentrationRowErrors>>;
  form?: string;
}>;

export type ContributionConcentrationStatus =
  "NO_LIMIT" | "WITHIN_LIMITS" | "SOFT_ALERT" | "HARD_LIMITED";

export type ContributionConcentrationAllocationSnapshot = Readonly<{
  assetClass: AssetClassCode;
  policyAllocatedAmount: MoneySnapshot;
  concentrationAllocatedAmount: MoneySnapshot;
  softMaxWeightPercent: string | null;
  hardMaxWeightPercent: string | null;
  softLimitExceeded: boolean;
  hardLimitApplied: boolean;
  blockedAmount: MoneySnapshot;
  status: ContributionConcentrationStatus;
}>;

export type ContributionConcentrationSnapshot = Readonly<{
  allocations: readonly ContributionConcentrationAllocationSnapshot[];
  unallocatedContribution: MoneySnapshot;
}>;

export type ContributionConcentrationResult =
  | Readonly<{ ok: true; snapshot: ContributionConcentrationSnapshot }>
  | Readonly<{ ok: false; errors: ContributionConcentrationFieldErrors }>;

const WEIGHT_ERROR = "Informe um percentual válido entre 0 e 100.";
const RANGE_ERROR = "O limite de alerta deve ser menor ou igual ao limite rígido.";
const DUPLICATE_ERROR = "Cada classe pode ter no máximo uma configuração de concentração.";
const TECHNICAL_ERROR =
  "Não foi possível aplicar os limites locais de concentração. Tente novamente.";

function rowError(
  assetClass: AssetClassCode,
  errors: ContributionConcentrationRowErrors,
): ContributionConcentrationResult {
  return { ok: false, errors: { rows: { [assetClass]: errors } } };
}

function rehydratePolicyPlan(
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
): ContributionPlan {
  const portfolioId = PortfolioId.from(baseline.targetAllocation.portfolioId);
  const policyByClass = new Map(
    policy.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
  );

  return Object.freeze({
    portfolioId,
    portfolioValue: Money.fromSnapshot(baseline.portfolioValue),
    contribution: Money.fromSnapshot(baseline.contribution),
    postContributionValue: Money.fromSnapshot(baseline.postContributionValue),
    allocations: Object.freeze(
      baseline.allocations.map((allocation) => {
        const policyAllocation = policyByClass.get(allocation.assetClass);

        if (policyAllocation === undefined) {
          throw new Error(`Missing policy allocation for ${allocation.assetClass}`);
        }

        return Object.freeze({
          portfolioId,
          assetClass: AssetClass.from(allocation.assetClass),
          currentValue: Money.fromSnapshot(allocation.currentValue),
          postContributionTargetValue: Money.fromSnapshot(allocation.postContributionTargetValue),
          postContributionNeed: Money.fromSnapshot(allocation.postContributionNeed),
          allocatedAmount: Money.fromSnapshot(policyAllocation.policyAllocatedAmount),
        });
      }),
    ),
    unallocatedContribution: Money.fromSnapshot(policy.unallocatedContribution),
  });
}

function concentrationStatus(
  hasLimit: boolean,
  softLimitExceeded: boolean,
  hardLimitApplied: boolean,
): ContributionConcentrationStatus {
  if (!hasLimit) return "NO_LIMIT";
  if (hardLimitApplied) return "HARD_LIMITED";
  if (softLimitExceeded) return "SOFT_ALERT";
  return "WITHIN_LIMITS";
}

export function createInitialContributionConcentrationDraft(
  policy: ContributionPolicySnapshot,
): ContributionConcentrationDraft {
  return {
    rows: policy.allocations.map((allocation) => ({
      assetClass: allocation.assetClass,
      enabled: false,
      softMaxWeight: "",
      hardMaxWeight: "",
    })),
  };
}

export function createContributionConcentrationSnapshot(
  draft: ContributionConcentrationDraft,
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
): ContributionConcentrationResult {
  try {
    const policyPlan = rehydratePolicyPlan(baseline, policy);
    const limits = draft.rows
      .filter((row) => row.enabled)
      .map((row) => ({
        assetClass: row.assetClass,
        softMaxWeight: normalizeContributionDecimal(row.softMaxWeight),
        hardMaxWeight: normalizeContributionDecimal(row.hardMaxWeight),
      }));
    const concentrationPlan = applyAssetClassConcentrationLimits({ plan: policyPlan, limits });
    const policyByClass = new Map(
      policy.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
    );

    return {
      ok: true,
      snapshot: {
        allocations: concentrationPlan.allocations.map((allocation) => {
          const assetClass = allocation.assetClass.code;
          const policyAllocation = policyByClass.get(assetClass);

          if (policyAllocation === undefined) {
            throw new Error(`Missing policy allocation for ${assetClass}`);
          }

          const hasLimit = allocation.softMaxWeight !== null && allocation.hardMaxWeight !== null;

          return {
            assetClass,
            policyAllocatedAmount: policyAllocation.policyAllocatedAmount,
            concentrationAllocatedAmount: allocation.allocatedAmount.toSnapshot(),
            softMaxWeightPercent: allocation.softMaxWeight?.toPercentString() ?? null,
            hardMaxWeightPercent: allocation.hardMaxWeight?.toPercentString() ?? null,
            softLimitExceeded: allocation.softLimitExceeded,
            hardLimitApplied: allocation.hardLimitApplied,
            blockedAmount: allocation.blockedAmount.toSnapshot(),
            status: concentrationStatus(
              hasLimit,
              allocation.softLimitExceeded,
              allocation.hardLimitApplied,
            ),
          };
        }),
        unallocatedContribution: concentrationPlan.unallocatedContribution.toSnapshot(),
      },
    };
  } catch (error) {
    if (error instanceof InvalidAssetClassConcentrationWeightError) {
      return rowError(error.assetClass as AssetClassCode, {
        [error.field]: WEIGHT_ERROR,
      });
    }

    if (error instanceof InvalidAssetClassConcentrationRangeError) {
      return rowError(error.assetClass as AssetClassCode, { range: RANGE_ERROR });
    }

    if (error instanceof DuplicateAssetClassConcentrationLimitError) {
      return { ok: false, errors: { form: DUPLICATE_ERROR } };
    }

    if (
      error instanceof InvalidAssetClassError ||
      error instanceof InvalidPortfolioIdError ||
      error instanceof InvalidCurrencyCodeError ||
      error instanceof CurrencyMismatchError
    ) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
