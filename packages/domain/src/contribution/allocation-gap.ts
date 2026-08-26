import { AssetClass, type AssetClassCode } from "../asset";
import { AllocationWeight, Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import {
  apportionTargetValues,
  normalizeCurrentValues,
  type CurrentAllocationBucketInput,
} from "./allocation-state";
import { AllocationGapPortfolioMismatchError, NegativeAllocationValueError } from "./errors";

export type { CurrentAllocationBucketInput } from "./allocation-state";

const ZERO_WEIGHT = AllocationWeight.zero();

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

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
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
  const classCodes = new Set<AssetClassCode>([...targetByClass.keys(), ...currentByClass.keys()]);

  const gaps = [...classCodes].sort().map<AllocationGap>((assetClassCode) => {
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
