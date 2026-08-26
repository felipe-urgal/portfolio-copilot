import { AssetClass, type AssetClassCode } from "../asset";
import { AllocationWeight, Percentage } from "../financial";
import {
  DuplicateTargetAllocationBucketError,
  InvalidTargetAllocationTotalWeightError,
  ZeroTargetAllocationWeightError,
} from "./errors";
import { PortfolioId } from "./portfolio-id";

const ZERO_WEIGHT = AllocationWeight.zero();
const FULL_WEIGHT = AllocationWeight.full();

export type TargetAllocationBucketInput = Readonly<{
  assetClass: AssetClass | string;
  targetWeight: AllocationWeight | string;
}>;

export type TargetAllocationCreationInput = Readonly<{
  portfolioId: PortfolioId | string;
  buckets: readonly TargetAllocationBucketInput[];
}>;

export type TargetAllocationBucket = Readonly<{
  assetClass: AssetClass;
  targetWeight: AllocationWeight;
}>;

export type TargetAllocationBucketSnapshot = Readonly<{
  assetClass: string;
  targetWeightPercent: string;
}>;

export type TargetAllocationSnapshot = Readonly<{
  portfolioId: string;
  buckets: readonly TargetAllocationBucketSnapshot[];
}>;

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function toAllocationWeight(value: AllocationWeight | string): AllocationWeight {
  return typeof value === "string" ? AllocationWeight.fromPercent(value) : value;
}

function compareBuckets(left: TargetAllocationBucket, right: TargetAllocationBucket): number {
  if (left.assetClass.code < right.assetClass.code) return -1;
  if (left.assetClass.code > right.assetClass.code) return 1;
  return 0;
}

function normalizeBuckets(
  inputs: readonly TargetAllocationBucketInput[],
): readonly TargetAllocationBucket[] {
  const seen = new Set<AssetClassCode>();
  let total = Percentage.zero();

  const buckets = inputs.map((input) => {
    const assetClass = toAssetClass(input.assetClass);
    const targetWeight = toAllocationWeight(input.targetWeight);

    if (seen.has(assetClass.code)) {
      throw new DuplicateTargetAllocationBucketError(assetClass.code);
    }

    if (targetWeight.equals(ZERO_WEIGHT)) {
      throw new ZeroTargetAllocationWeightError(assetClass.code);
    }

    seen.add(assetClass.code);
    total = total.add(targetWeight.percentage);

    return Object.freeze({ assetClass, targetWeight });
  });

  if (!total.equals(FULL_WEIGHT.percentage)) {
    throw new InvalidTargetAllocationTotalWeightError(total.toPercentString());
  }

  return Object.freeze([...buckets].sort(compareBuckets));
}

export class TargetAllocation {
  private constructor(
    public readonly portfolioId: PortfolioId,
    public readonly buckets: readonly TargetAllocationBucket[],
  ) {}

  public static create(input: TargetAllocationCreationInput): TargetAllocation {
    return new TargetAllocation(toPortfolioId(input.portfolioId), normalizeBuckets(input.buckets));
  }

  public static fromSnapshot(snapshot: TargetAllocationSnapshot): TargetAllocation {
    return TargetAllocation.create({
      portfolioId: snapshot.portfolioId,
      buckets: snapshot.buckets.map((bucket) => ({
        assetClass: bucket.assetClass,
        targetWeight: bucket.targetWeightPercent,
      })),
    });
  }

  public targetWeightFor(assetClass: AssetClass | string): AllocationWeight {
    const normalizedClass = toAssetClass(assetClass);
    const bucket = this.buckets.find((candidate) => candidate.assetClass.equals(normalizedClass));

    return bucket?.targetWeight ?? ZERO_WEIGHT;
  }

  public toSnapshot(): TargetAllocationSnapshot {
    return {
      portfolioId: this.portfolioId.toString(),
      buckets: this.buckets.map((bucket) => ({
        assetClass: bucket.assetClass.toString(),
        targetWeightPercent: bucket.targetWeight.toPercentString(),
      })),
    };
  }
}
