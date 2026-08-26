import { AssetClass, type AssetClassCode } from "../asset";
import { AllocationWeight, Money } from "../financial";
import { type ContributionAllocation, type ContributionPlan } from "./contribution-allocator";
import {
  DuplicateAssetClassConcentrationLimitError,
  InvalidAssetClassConcentrationRangeError,
  InvalidAssetClassConcentrationWeightError,
} from "./errors";

const FULL_WEIGHT_UNITS = AllocationWeight.full().percentage.scaledUnits;

type ConcentrationWeightField = "softMaxWeight" | "hardMaxWeight";

export type AssetClassConcentrationLimitInput = Readonly<{
  assetClass: AssetClass | string;
  softMaxWeight: AllocationWeight | string;
  hardMaxWeight: AllocationWeight | string;
}>;

export type ContributionConcentrationLimitsInput = Readonly<{
  plan: ContributionPlan;
  limits: readonly AssetClassConcentrationLimitInput[];
}>;

export type ContributionConcentrationAllocation = ContributionAllocation &
  Readonly<{
    softMaxWeight: AllocationWeight | null;
    hardMaxWeight: AllocationWeight | null;
    softLimitExceeded: boolean;
    hardLimitApplied: boolean;
    blockedAmount: Money;
  }>;

export type ContributionConcentrationPlan = Omit<ContributionPlan, "allocations"> &
  Readonly<{
    allocations: readonly ContributionConcentrationAllocation[];
  }>;

type NormalizedAssetClassConcentrationLimit = Readonly<{
  assetClass: AssetClass;
  softMaxWeight: AllocationWeight;
  hardMaxWeight: AllocationWeight;
}>;

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function toAllocationWeight(
  assetClass: AssetClass,
  field: ConcentrationWeightField,
  value: AllocationWeight | string,
): AllocationWeight {
  if (value instanceof AllocationWeight) return value;

  if (typeof value !== "string") {
    throw new InvalidAssetClassConcentrationWeightError(assetClass.code, field, String(value));
  }

  try {
    return AllocationWeight.fromPercent(value);
  } catch {
    throw new InvalidAssetClassConcentrationWeightError(assetClass.code, field, value);
  }
}

function normalizeLimits(
  inputs: readonly AssetClassConcentrationLimitInput[],
): ReadonlyMap<AssetClassCode, NormalizedAssetClassConcentrationLimit> {
  const limitsByClass = new Map<AssetClassCode, NormalizedAssetClassConcentrationLimit>();

  for (const input of inputs) {
    const assetClass = toAssetClass(input.assetClass);

    if (limitsByClass.has(assetClass.code)) {
      throw new DuplicateAssetClassConcentrationLimitError(assetClass.code);
    }

    const softMaxWeight = toAllocationWeight(assetClass, "softMaxWeight", input.softMaxWeight);
    const hardMaxWeight = toAllocationWeight(assetClass, "hardMaxWeight", input.hardMaxWeight);

    if (softMaxWeight.compare(hardMaxWeight) > 0) {
      throw new InvalidAssetClassConcentrationRangeError(
        assetClass.code,
        softMaxWeight.toPercentString(),
        hardMaxWeight.toPercentString(),
      );
    }

    limitsByClass.set(
      assetClass.code,
      Object.freeze({
        assetClass,
        softMaxWeight,
        hardMaxWeight,
      }),
    );
  }

  return limitsByClass;
}

function maximumAllowedClassValueMinorUnits(
  postContributionValueMinorUnits: bigint,
  hardMaxWeight: AllocationWeight,
): bigint {
  return (
    (postContributionValueMinorUnits * hardMaxWeight.percentage.scaledUnits) / FULL_WEIGHT_UNITS
  );
}

function exceedsWeight(
  valueMinorUnits: bigint,
  totalMinorUnits: bigint,
  weight: AllocationWeight,
): boolean {
  if (totalMinorUnits === 0n) return false;

  return valueMinorUnits * FULL_WEIGHT_UNITS > totalMinorUnits * weight.percentage.scaledUnits;
}

export function applyAssetClassConcentrationLimits(
  input: ContributionConcentrationLimitsInput,
): ContributionConcentrationPlan {
  const limitsByClass = normalizeLimits(input.limits);
  let blockedMinorUnits = 0n;

  const allocations = input.plan.allocations.map<ContributionConcentrationAllocation>(
    (allocation) => {
      const limit = limitsByClass.get(allocation.assetClass.code);

      if (limit === undefined) {
        return Object.freeze({
          ...allocation,
          softMaxWeight: null,
          hardMaxWeight: null,
          softLimitExceeded: false,
          hardLimitApplied: false,
          blockedAmount: Money.zero(input.plan.contribution.currency),
        });
      }

      const maximumClassValueMinorUnits = maximumAllowedClassValueMinorUnits(
        input.plan.postContributionValue.minorUnits,
        limit.hardMaxWeight,
      );
      const availableMinorUnits =
        maximumClassValueMinorUnits > allocation.currentValue.minorUnits
          ? maximumClassValueMinorUnits - allocation.currentValue.minorUnits
          : 0n;
      const allocatedMinorUnits =
        allocation.allocatedAmount.minorUnits < availableMinorUnits
          ? allocation.allocatedAmount.minorUnits
          : availableMinorUnits;
      const blockedAmountMinorUnits = allocation.allocatedAmount.minorUnits - allocatedMinorUnits;
      const projectedClassValueMinorUnits =
        allocation.currentValue.minorUnits + allocatedMinorUnits;

      blockedMinorUnits += blockedAmountMinorUnits;

      return Object.freeze({
        ...allocation,
        allocatedAmount: Money.fromMinorUnits(
          allocatedMinorUnits,
          input.plan.contribution.currency,
        ),
        softMaxWeight: limit.softMaxWeight,
        hardMaxWeight: limit.hardMaxWeight,
        softLimitExceeded: exceedsWeight(
          projectedClassValueMinorUnits,
          input.plan.postContributionValue.minorUnits,
          limit.softMaxWeight,
        ),
        hardLimitApplied: blockedAmountMinorUnits > 0n,
        blockedAmount: Money.fromMinorUnits(
          blockedAmountMinorUnits,
          input.plan.contribution.currency,
        ),
      });
    },
  );

  return Object.freeze({
    ...input.plan,
    allocations: Object.freeze(allocations),
    unallocatedContribution: Money.fromMinorUnits(
      input.plan.unallocatedContribution.minorUnits + blockedMinorUnits,
      input.plan.contribution.currency,
    ),
  });
}
