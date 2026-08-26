import { AssetClass, type AssetClassCode } from "../asset";
import { Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import {
  apportionMinorUnitsByAssetClass,
  apportionTargetValues,
  normalizeCurrentValues,
  type CurrentAllocationBucketInput,
} from "./allocation-state";
import {
  ContributionAllocatorPortfolioMismatchError,
  NegativeAllocationValueError,
} from "./errors";

export type ContributionAllocatorInput = Readonly<{
  portfolioId: PortfolioId | string;
  targetAllocation: TargetAllocation;
  portfolioValue: Money;
  currentValues: readonly CurrentAllocationBucketInput[];
  contribution: Money;
}>;

export type ContributionAllocation = Readonly<{
  portfolioId: PortfolioId;
  assetClass: AssetClass;
  currentValue: Money;
  postContributionTargetValue: Money;
  postContributionNeed: Money;
  allocatedAmount: Money;
}>;

export type ContributionPlan = Readonly<{
  portfolioId: PortfolioId;
  portfolioValue: Money;
  contribution: Money;
  postContributionValue: Money;
  allocations: readonly ContributionAllocation[];
  unallocatedContribution: Money;
}>;

type NeedBucket = Readonly<{
  assetClass: AssetClass;
  currentValue: Money;
  postContributionTargetValue: Money;
  needMinorUnits: bigint;
}>;

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function nonNegativeDifference(left: Money, right: Money): bigint {
  return left.compare(right) > 0 ? left.minorUnits - right.minorUnits : 0n;
}

export function allocateContribution(input: ContributionAllocatorInput): ContributionPlan {
  const portfolioId = toPortfolioId(input.portfolioId);

  if (!portfolioId.equals(input.targetAllocation.portfolioId)) {
    throw new ContributionAllocatorPortfolioMismatchError(
      input.targetAllocation.portfolioId.toString(),
      portfolioId.toString(),
    );
  }

  if (input.portfolioValue.isNegative()) {
    throw new NegativeAllocationValueError(
      "portfolioValue",
      input.portfolioValue.toDecimalString(),
      input.portfolioValue.currency.code,
    );
  }

  if (input.contribution.isNegative()) {
    throw new NegativeAllocationValueError(
      "contribution",
      input.contribution.toDecimalString(),
      input.contribution.currency.code,
    );
  }

  const postContributionValue = input.portfolioValue.add(input.contribution);
  const currentByClass = normalizeCurrentValues(
    portfolioId,
    input.portfolioValue,
    input.currentValues,
  );
  const targetByClass = apportionTargetValues(input.targetAllocation, postContributionValue);
  const classCodes = new Set<AssetClassCode>([...targetByClass.keys(), ...currentByClass.keys()]);
  const needs = [...classCodes].sort().map<NeedBucket>((assetClassCode) => {
    const assetClass = AssetClass.from(assetClassCode);
    const currentValue =
      currentByClass.get(assetClassCode)?.currentValue ?? Money.zero(input.portfolioValue.currency);
    const postContributionTargetValue = Money.fromMinorUnits(
      targetByClass.get(assetClassCode)?.minorUnits ?? 0n,
      input.portfolioValue.currency,
    );

    return Object.freeze({
      assetClass,
      currentValue,
      postContributionTargetValue,
      needMinorUnits: nonNegativeDifference(postContributionTargetValue, currentValue),
    });
  });
  const totalNeedMinorUnits = needs.reduce((sum, bucket) => sum + bucket.needMinorUnits, 0n);
  const allocatableMinorUnits =
    input.contribution.minorUnits < totalNeedMinorUnits
      ? input.contribution.minorUnits
      : totalNeedMinorUnits;
  const allocatedByClass = apportionMinorUnitsByAssetClass(
    allocatableMinorUnits,
    needs.map((bucket) => ({
      assetClass: bucket.assetClass,
      weightUnits: bucket.needMinorUnits,
    })),
  );
  const allocations = needs.map<ContributionAllocation>((bucket) =>
    Object.freeze({
      portfolioId,
      assetClass: bucket.assetClass,
      currentValue: bucket.currentValue,
      postContributionTargetValue: bucket.postContributionTargetValue,
      postContributionNeed: Money.fromMinorUnits(
        bucket.needMinorUnits,
        input.portfolioValue.currency,
      ),
      allocatedAmount: Money.fromMinorUnits(
        allocatedByClass.get(bucket.assetClass.code) ?? 0n,
        input.portfolioValue.currency,
      ),
    }),
  );

  return Object.freeze({
    portfolioId,
    portfolioValue: input.portfolioValue,
    contribution: input.contribution,
    postContributionValue,
    allocations: Object.freeze(allocations),
    unallocatedContribution: Money.fromMinorUnits(
      input.contribution.minorUnits - allocatableMinorUnits,
      input.portfolioValue.currency,
    ),
  });
}
