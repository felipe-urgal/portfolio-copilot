import { AssetClass, type AssetClassCode } from "../asset";
import { AllocationWeight, CurrencyMismatchError, Money } from "../financial";
import { type PortfolioId, type TargetAllocation } from "../portfolio";
import {
  AllocationTotalMismatchError,
  DuplicateCurrentAllocationBucketError,
  NegativeAllocationValueError,
} from "./errors";

export type CurrentAllocationBucketInput = Readonly<{
  assetClass: AssetClass | string;
  currentValue: Money;
}>;

export type NormalizedCurrentBucket = Readonly<{
  assetClass: AssetClass;
  currentValue: Money;
}>;

export type TargetValueBucket = Readonly<{
  assetClass: AssetClass;
  targetWeight: AllocationWeight;
  minorUnits: bigint;
}>;

type WeightedMinorUnitBucket = {
  assetClass: AssetClass;
  minorUnits: bigint;
  remainder: bigint;
};

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function compareAssetClasses(left: AssetClass, right: AssetClass): number {
  if (left.code < right.code) return -1;
  if (left.code > right.code) return 1;
  return 0;
}

function compareRemainders(left: WeightedMinorUnitBucket, right: WeightedMinorUnitBucket): number {
  if (left.remainder > right.remainder) return -1;
  if (left.remainder < right.remainder) return 1;
  return compareAssetClasses(left.assetClass, right.assetClass);
}

export function normalizeCurrentValues(
  portfolioId: PortfolioId,
  totalValue: Money,
  inputs: readonly CurrentAllocationBucketInput[],
): ReadonlyMap<AssetClassCode, NormalizedCurrentBucket> {
  const buckets = new Map<AssetClassCode, NormalizedCurrentBucket>();
  let bucketTotalMinorUnits = 0n;

  for (const input of inputs) {
    const assetClass = toAssetClass(input.assetClass);

    if (buckets.has(assetClass.code)) {
      throw new DuplicateCurrentAllocationBucketError(assetClass.code);
    }

    if (!input.currentValue.currency.equals(totalValue.currency)) {
      throw new CurrencyMismatchError(totalValue.currency.code, input.currentValue.currency.code);
    }

    if (input.currentValue.isNegative()) {
      throw new NegativeAllocationValueError(
        `currentValues.${assetClass.code}`,
        input.currentValue.toDecimalString(),
        input.currentValue.currency.code,
      );
    }

    buckets.set(assetClass.code, Object.freeze({ assetClass, currentValue: input.currentValue }));
    bucketTotalMinorUnits += input.currentValue.minorUnits;
  }

  if (bucketTotalMinorUnits !== totalValue.minorUnits) {
    const bucketTotal = Money.fromMinorUnits(bucketTotalMinorUnits, totalValue.currency);
    throw new AllocationTotalMismatchError(
      portfolioId.toString(),
      totalValue.toDecimalString(),
      bucketTotal.toDecimalString(),
      totalValue.currency.code,
    );
  }

  return buckets;
}

export function apportionMinorUnitsByAssetClass(
  totalMinorUnits: bigint,
  weights: readonly Readonly<{ assetClass: AssetClass; weightUnits: bigint }>[],
): ReadonlyMap<AssetClassCode, bigint> {
  if (totalMinorUnits < 0n) {
    throw new RangeError("Cannot apportion negative minor units");
  }

  if (weights.some((bucket) => bucket.weightUnits < 0n)) {
    throw new RangeError("Cannot apportion negative weight units");
  }

  const seenAssetClasses = new Set<AssetClassCode>();
  for (const bucket of weights) {
    if (seenAssetClasses.has(bucket.assetClass.code)) {
      throw new RangeError(`Cannot apportion duplicate asset class ${bucket.assetClass.code}`);
    }
    seenAssetClasses.add(bucket.assetClass.code);
  }

  const positiveWeights = weights.filter((bucket) => bucket.weightUnits > 0n);

  if (totalMinorUnits === 0n || positiveWeights.length === 0) {
    return new Map<AssetClassCode, bigint>();
  }

  const totalWeightUnits = positiveWeights.reduce((sum, bucket) => sum + bucket.weightUnits, 0n);
  const apportioned = positiveWeights.map<WeightedMinorUnitBucket>((bucket) => {
    const numerator = totalMinorUnits * bucket.weightUnits;

    return {
      assetClass: bucket.assetClass,
      minorUnits: numerator / totalWeightUnits,
      remainder: numerator % totalWeightUnits,
    };
  });

  const assignedMinorUnits = apportioned.reduce((sum, bucket) => sum + bucket.minorUnits, 0n);
  let residualMinorUnits = totalMinorUnits - assignedMinorUnits;

  for (const bucket of [...apportioned].sort(compareRemainders)) {
    if (residualMinorUnits === 0n) break;

    bucket.minorUnits += 1n;
    residualMinorUnits -= 1n;
  }

  if (residualMinorUnits !== 0n) {
    throw new RangeError("Largest-remainder apportionment did not reconcile");
  }

  return new Map<AssetClassCode, bigint>(
    apportioned.map((bucket) => [bucket.assetClass.code, bucket.minorUnits] as const),
  );
}

export function apportionTargetValues(
  targetAllocation: TargetAllocation,
  totalValue: Money,
): ReadonlyMap<AssetClassCode, TargetValueBucket> {
  const apportionedMinorUnits = apportionMinorUnitsByAssetClass(
    totalValue.minorUnits,
    targetAllocation.buckets.map((bucket) => ({
      assetClass: bucket.assetClass,
      weightUnits: bucket.targetWeight.percentage.scaledUnits,
    })),
  );

  return new Map<AssetClassCode, TargetValueBucket>(
    targetAllocation.buckets.map(
      (bucket) =>
        [
          bucket.assetClass.code,
          Object.freeze({
            assetClass: bucket.assetClass,
            targetWeight: bucket.targetWeight,
            minorUnits: apportionedMinorUnits.get(bucket.assetClass.code) ?? 0n,
          }),
        ] as const,
    ),
  );
}
