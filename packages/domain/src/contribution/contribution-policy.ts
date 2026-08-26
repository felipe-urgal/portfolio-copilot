import { type AssetClassCode } from "../asset";
import { CurrencyMismatchError, Money } from "../financial";
import { apportionMinorUnitsByAssetClass } from "./allocation-state";
import { type ContributionAllocation, type ContributionPlan } from "./contribution-allocator";
import { InvalidMaxDestinationsPerContributionError, NegativeAllocationValueError } from "./errors";

export type ContributionPolicy = Readonly<{
  minimumMeaningfulContribution: Money;
  maxDestinationsPerContribution: number;
}>;

export type ContributionPolicyApplicationInput = Readonly<{
  plan: ContributionPlan;
  policy: ContributionPolicy;
}>;

type EligibleContributionBucket = Readonly<{
  allocation: ContributionAllocation;
  needMinorUnits: bigint;
}>;

function compareByNeed(
  left: EligibleContributionBucket,
  right: EligibleContributionBucket,
): number {
  if (left.needMinorUnits > right.needMinorUnits) return -1;
  if (left.needMinorUnits < right.needMinorUnits) return 1;

  if (left.allocation.assetClass.code < right.allocation.assetClass.code) return -1;
  if (left.allocation.assetClass.code > right.allocation.assetClass.code) return 1;
  return 0;
}

function validatePolicy(plan: ContributionPlan, policy: ContributionPolicy): void {
  if (policy.minimumMeaningfulContribution.isNegative()) {
    throw new NegativeAllocationValueError(
      "minimumMeaningfulContribution",
      policy.minimumMeaningfulContribution.toDecimalString(),
      policy.minimumMeaningfulContribution.currency.code,
    );
  }

  if (!policy.minimumMeaningfulContribution.currency.equals(plan.contribution.currency)) {
    throw new CurrencyMismatchError(
      plan.contribution.currency.code,
      policy.minimumMeaningfulContribution.currency.code,
    );
  }

  if (
    !Number.isSafeInteger(policy.maxDestinationsPerContribution) ||
    policy.maxDestinationsPerContribution <= 0
  ) {
    throw new InvalidMaxDestinationsPerContributionError(policy.maxDestinationsPerContribution);
  }
}

function apportionSelectedBuckets(
  contribution: Money,
  buckets: readonly EligibleContributionBucket[],
): ReadonlyMap<AssetClassCode, bigint> {
  if (buckets.length === 0) {
    return new Map<AssetClassCode, bigint>();
  }

  const totalNeedMinorUnits = buckets.reduce((sum, bucket) => sum + bucket.needMinorUnits, 0n);
  const allocatableMinorUnits =
    contribution.minorUnits < totalNeedMinorUnits ? contribution.minorUnits : totalNeedMinorUnits;

  return apportionMinorUnitsByAssetClass(
    allocatableMinorUnits,
    buckets.map((bucket) => ({
      assetClass: bucket.allocation.assetClass,
      weightUnits: bucket.needMinorUnits,
    })),
  );
}

export function applyContributionPolicy(
  input: ContributionPolicyApplicationInput,
): ContributionPlan {
  validatePolicy(input.plan, input.policy);

  const minimumMinorUnits = input.policy.minimumMeaningfulContribution.minorUnits;
  let selectedBuckets = input.plan.allocations
    .filter((allocation) => allocation.postContributionNeed.minorUnits > 0n)
    .map<EligibleContributionBucket>((allocation) => ({
      allocation,
      needMinorUnits: allocation.postContributionNeed.minorUnits,
    }))
    .sort(compareByNeed)
    .slice(0, input.policy.maxDestinationsPerContribution);
  let allocatedByClass = new Map<AssetClassCode, bigint>();

  while (selectedBuckets.length > 0) {
    allocatedByClass = new Map(apportionSelectedBuckets(input.plan.contribution, selectedBuckets));

    if (minimumMinorUnits === 0n) break;

    const meaningfulBuckets = selectedBuckets.filter(
      (bucket) =>
        (allocatedByClass.get(bucket.allocation.assetClass.code) ?? 0n) >= minimumMinorUnits,
    );

    if (meaningfulBuckets.length === selectedBuckets.length) break;

    selectedBuckets = meaningfulBuckets;
    allocatedByClass = new Map<AssetClassCode, bigint>();
  }

  const allocations = input.plan.allocations.map<ContributionAllocation>((allocation) =>
    Object.freeze({
      ...allocation,
      allocatedAmount: Money.fromMinorUnits(
        allocatedByClass.get(allocation.assetClass.code) ?? 0n,
        input.plan.contribution.currency,
      ),
    }),
  );
  const allocatedMinorUnits = allocations.reduce(
    (sum, allocation) => sum + allocation.allocatedAmount.minorUnits,
    0n,
  );

  return Object.freeze({
    ...input.plan,
    allocations: Object.freeze(allocations),
    unallocatedContribution: Money.fromMinorUnits(
      input.plan.contribution.minorUnits - allocatedMinorUnits,
      input.plan.contribution.currency,
    ),
  });
}
