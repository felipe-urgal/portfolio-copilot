import { isDecimalZero, parseDecimalParts } from "./decimal";
import { AllocationWeightOutOfRangeError } from "./errors";
import { Percentage } from "./percentage";

const MAX_PERCENT = 100n;

function assertRawPercentWithinAllocationRange(value: string): void {
  const parts = parseDecimalParts(value);

  if (parts.negative && !isDecimalZero(parts)) {
    throw new AllocationWeightOutOfRangeError(value);
  }

  const whole = BigInt(parts.whole);

  if (whole > MAX_PERCENT) {
    throw new AllocationWeightOutOfRangeError(value);
  }

  if (whole === MAX_PERCENT && /[1-9]/.test(parts.fraction)) {
    throw new AllocationWeightOutOfRangeError(value);
  }
}

export class AllocationWeight {
  private constructor(public readonly percentage: Percentage) {}

  public static fromPercent(percent: string): AllocationWeight {
    assertRawPercentWithinAllocationRange(percent);
    return new AllocationWeight(Percentage.fromPercent(percent));
  }

  public static fromPercentage(percentage: Percentage): AllocationWeight {
    return AllocationWeight.fromPercent(percentage.toPercentString());
  }

  public static zero(): AllocationWeight {
    return AllocationWeight.fromPercent("0");
  }

  public static full(): AllocationWeight {
    return AllocationWeight.fromPercent("100");
  }

  public compare(other: AllocationWeight): -1 | 0 | 1 {
    return this.percentage.compare(other.percentage);
  }

  public equals(other: AllocationWeight): boolean {
    return this.percentage.equals(other.percentage);
  }

  public toPercentString(): string {
    return this.percentage.toPercentString();
  }
}
