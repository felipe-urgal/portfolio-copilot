import { AssetClass, type AssetClassCode } from "../asset";
import { AllocationWeight, CurrencyMismatchError, Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import {
  AllocationGapPortfolioMismatchError,
  AllocationTotalMismatchError,
  DuplicateCurrentAllocationBucketError,
  NegativeAllocationValueError,
} from "./errors";

const ZERO_WEIGHT = AllocationWeight.zero();
const FULL_WEIGHT_SCALED_UNITS = AllocationWeight.full().percentage.scaledUnits;

export type CurrentAllocationBucketInput = Readonly<{
  assetClass: AssetClass | string;
  currentValue: Money;
}>;

export type AllocationGapCalculationInput = Readonly<{
  portfolioId: PortfolioId | string;
  targetAllocation: TargetAllocation;
  totalValue: Money;
  currentValues: readonly CurrentAllocationBucketInput[];
}>;

export type AllocationGap = Readonly<{
  portfolioId: PortfolioId;
  assetClass: AssetClass;
  targetWeight: AllocationWeight;
  currentValue: Money;
  targetValue: Money;
  gap: Money;
}>;

type NormalizedCurrentBucket = Readonly<{
  currentValue: Money;
}>;

type MutableTargetApportionment = {
  assetClass: AssetClass;
  targetWeight: AllocationWeight;
  minorUnits: bigint;
  remainder: bigint;
};

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function compareAssetClasses(left: AssetClass, right: AssetClass): number {
  if (left.code < right.code) return -1;
  if (left.code > right.code) return 1;
  return 0;
}

function compareRemainders(
  left: MutableTargetApportionment,
  right: MutableTargetApportionment,
): number {
  if (left.remainder > right.remainder) return -1;
  if (left.remainder < right.remainder) return 1;
  return compareAssetClasses(left.assetClass, right.assetClass);
}

function normalizeCurrentValues(
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

    buckets.set(assetClass.code, Object.freeze({ currentValue: input.currentValue }));
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

function apportionTargetValues(
  targetAllocation: TargetAllocation,
  totalValue: Money,
): ReadonlyMap<AssetClassCode, MutableTargetApportionment> {
  const apportioned = targetAllocation.buckets.map<MutableTargetApportionment>((bucket) => {
    const numerator = totalValue.minorUnits * bucket.targetWeight.percentage.scaledUnits;

    return {
      assetClass: bucket.assetClass,
      targetWeight: bucket.targetWeight,
      minorUnits: numerator / FULL_WEIGHT_SCALED_UNITS,
      remainder: numerator % FULL_WEIGHT_SCALED_UNITS,
    };
  });

  const assignedMinorUnits = apportioned.reduce((sum, bucket) => sum + bucket.minorUnits, 0n);
  let residualMinorUnits = totalValue.minorUnits - assignedMinorUnits;

  for (const bucket of [...apportioned].sort(compareRemainders)) {
    if (residualMinorUnits === 0n) break;

    bucket.minorUnits += 1n;
    residualMinorUnits -= 1n;
  }

  return new Map<AssetClassCode, MutableTargetApportionment>(
    apportioned.map((bucket) => [bucket.assetClass.code, bucket] as const),
  );
}

export function calculateAllocationGaps(
  input: AllocationGapCalculationInput,
): readonly AllocationGap[] {
  const portfolioId = toPortfolioId(input.portfolioId);

  if (!portfolioId.equals(input.targetAllocation.portfolioId)) {
    throw new AllocationGapPortfolioMismatchError(
      input.targetAllocation.portfolioId.toString(),
      portfolioId.toString(),
    );
  }

  if (input.totalValue.isNegative()) {
    throw new NegativeAllocationValueError(
      "totalValue",
      input.totalValue.toDecimalString(),
      input.totalValue.currency.code,
    );
  }

  const currentByClass = normalizeCurrentValues(portfolioId, input.totalValue, input.currentValues);
  const targetByClass = apportionTargetValues(input.targetAllocation, input.totalValue);
  const classCodes = new Set<AssetClassCode>([
    ...targetByClass.keys(),
    ...currentByClass.keys(),
  ]);

  const gaps = [...classCodes]
    .sort()
    .map<AllocationGap>((assetClassCode) => {
      const currentBucket = currentByClass.get(assetClassCode);
      const targetBucket = targetByClass.get(assetClassCode);
      const assetClass = AssetClass.from(assetClassCode);
      const currentValue = currentBucket?.currentValue ?? Money.zero(input.totalValue.currency);
      const targetValue = Money.fromMinorUnits(
        targetBucket?.minorUnits ?? 0n,
        input.totalValue.currency,
      );
      const gap =
        targetValue.compare(currentValue) > 0
          ? targetValue.subtract(currentValue)
          : Money.zero(input.totalValue.currency);

      return Object.freeze({
        portfolioId,
        assetClass,
        targetWeight: targetBucket?.targetWeight ?? ZERO_WEIGHT,
        currentValue,
        targetValue,
        gap,
      });
    });

  return Object.freeze(gaps);
}
