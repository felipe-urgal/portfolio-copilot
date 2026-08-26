import { describe, expect, it } from "vitest";

import { CurrencyMismatchError, Money } from "../financial";
import { TargetAllocation } from "../portfolio";
import {
  AllocationGapPortfolioMismatchError,
  AllocationTotalMismatchError,
  calculateAllocationGaps,
  DuplicateCurrentAllocationBucketError,
  NegativeAllocationValueError,
  type AllocationGap,
} from "./index";

const FIRST_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const SECOND_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440011";

function gapFor(gaps: readonly AllocationGap[], assetClass: string): AllocationGap {
  const gap = gaps.find((candidate) => candidate.assetClass.toString() === assetClass);

  if (gap === undefined) {
    throw new Error(`Missing gap for ${assetClass}`);
  }

  return gap;
}

describe("calculateAllocationGaps", () => {
  it("returns zero gap when a single bucket is exactly on target", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    const gaps = calculateAllocationGaps({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
    });

    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.portfolioId.toString()).toBe(FIRST_PORTFOLIO_ID);
    expect(gaps[0]?.targetValue.toDecimalString()).toBe("100.00");
    expect(gaps[0]?.currentValue.toDecimalString()).toBe("100.00");
    expect(gaps[0]?.gap.toDecimalString()).toBe("0.00");
  });

  it("calculates positive gaps and clamps over-target buckets to zero", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "60" },
        { assetClass: "EQUITY", targetWeight: "40" },
      ],
    });

    const gaps = calculateAllocationGaps({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("70.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("30.00", "BRL") },
      ],
    });

    expect(gapFor(gaps, "FIXED_INCOME").targetValue.toDecimalString()).toBe("60.00");
    expect(gapFor(gaps, "FIXED_INCOME").gap.toDecimalString()).toBe("30.00");
    expect(gapFor(gaps, "EQUITY").targetValue.toDecimalString()).toBe("40.00");
    expect(gapFor(gaps, "EQUITY").gap.toDecimalString()).toBe("0.00");
  });

  it("treats a target class missing from current values as zero current value", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "60" },
        { assetClass: "EQUITY", targetWeight: "40" },
      ],
    });

    const gaps = calculateAllocationGaps({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
    });

    expect(gapFor(gaps, "FIXED_INCOME").currentValue.toDecimalString()).toBe("0.00");
    expect(gapFor(gaps, "FIXED_INCOME").gap.toDecimalString()).toBe("60.00");
  });

  it("keeps a current class without target weight with zero target and zero gap", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    const gaps = calculateAllocationGaps({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "CASH", currentValue: Money.fromDecimal("10.00", "BRL") },
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("90.00", "BRL") },
      ],
    });

    expect(gapFor(gaps, "CASH").targetWeight.toPercentString()).toBe("0.0000");
    expect(gapFor(gaps, "CASH").targetValue.toDecimalString()).toBe("0.00");
    expect(gapFor(gaps, "CASH").gap.toDecimalString()).toBe("0.00");
    expect(gapFor(gaps, "EQUITY").gap.toDecimalString()).toBe("10.00");
  });

  it("rejects current values in a different currency", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      calculateAllocationGaps({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [
          { assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "USD") },
        ],
      }),
    ).toThrowError(CurrencyMismatchError);
  });

  it("rejects duplicate current buckets after asset-class normalization", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      calculateAllocationGaps({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [
          { assetClass: "equity", currentValue: Money.fromDecimal("40.00", "BRL") },
          { assetClass: "EQUITY", currentValue: Money.fromDecimal("60.00", "BRL") },
        ],
      }),
    ).toThrowError(DuplicateCurrentAllocationBucketError);
  });

  it("rejects a declared total that does not reconcile with current buckets", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      calculateAllocationGaps({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("99.99", "BRL") }],
      }),
    ).toThrowError(AllocationTotalMismatchError);
  });

  it("apportions monetary rounding by largest remainder and deterministic class tie-break", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "50" },
        { assetClass: "EQUITY", targetWeight: "50" },
      ],
    });

    const gaps = calculateAllocationGaps({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("0.01", "BRL"),
      currentValues: [{ assetClass: "CASH", currentValue: Money.fromDecimal("0.01", "BRL") }],
    });

    expect(gaps.map((gap) => gap.assetClass.toString())).toEqual([
      "CASH",
      "EQUITY",
      "FIXED_INCOME",
    ]);
    expect(gapFor(gaps, "EQUITY").targetValue.toDecimalString()).toBe("0.01");
    expect(gapFor(gaps, "FIXED_INCOME").targetValue.toDecimalString()).toBe("0.00");
    expect(
      gapFor(gaps, "EQUITY")
        .targetValue.add(gapFor(gaps, "FIXED_INCOME").targetValue)
        .toDecimalString(),
    ).toBe("0.01");
  });

  it("rejects combining current values with a target allocation from another portfolio", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      calculateAllocationGaps({
        portfolioId: SECOND_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
      }),
    ).toThrowError(AllocationGapPortfolioMismatchError);
  });

  it("rejects negative total or current allocation values", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      calculateAllocationGaps({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("-1.00", "BRL"),
        currentValues: [],
      }),
    ).toThrowError(NegativeAllocationValueError);

    expect(() =>
      calculateAllocationGaps({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        totalValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [
          { assetClass: "EQUITY", currentValue: Money.fromDecimal("-1.00", "BRL") },
          { assetClass: "CASH", currentValue: Money.fromDecimal("101.00", "BRL") },
        ],
      }),
    ).toThrowError(NegativeAllocationValueError);
  });

  it("produces the same ordered result for repeated equivalent input", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "REAL_ESTATE", targetWeight: "10" },
        { assetClass: "FIXED_INCOME", targetWeight: "45" },
        { assetClass: "EQUITY", targetWeight: "45" },
      ],
    });
    const input = {
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      totalValue: Money.fromDecimal("1000.00", "BRL"),
      currentValues: [
        { assetClass: "REAL_ESTATE", currentValue: Money.fromDecimal("200.00", "BRL") },
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("500.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("300.00", "BRL") },
      ],
    } as const;

    const first = calculateAllocationGaps(input);
    const second = calculateAllocationGaps(input);
    const project = (gaps: readonly AllocationGap[]) =>
      gaps.map((gap) => ({
        assetClass: gap.assetClass.toString(),
        targetValue: gap.targetValue.toDecimalString(),
        currentValue: gap.currentValue.toDecimalString(),
        gap: gap.gap.toDecimalString(),
      }));

    expect(project(first)).toEqual(project(second));
    expect(first.map((gap) => gap.assetClass.toString())).toEqual([
      "EQUITY",
      "FIXED_INCOME",
      "REAL_ESTATE",
    ]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.every((gap) => Object.isFrozen(gap))).toBe(true);
  });
});
