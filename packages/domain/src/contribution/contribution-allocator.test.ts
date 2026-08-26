import { describe, expect, it } from "vitest";

import { CurrencyMismatchError, Money } from "../financial";
import { TargetAllocation } from "../portfolio";
import {
  AllocationTotalMismatchError,
  allocateContribution,
  ContributionAllocatorPortfolioMismatchError,
  DuplicateCurrentAllocationBucketError,
  NegativeAllocationValueError,
  type ContributionAllocation,
} from "./index";

const FIRST_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const SECOND_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440011";

function allocationFor(
  allocations: readonly ContributionAllocation[],
  assetClass: string,
): ContributionAllocation {
  const allocation = allocations.find(
    (candidate) => candidate.assetClass.toString() === assetClass,
  );

  if (allocation === undefined) {
    throw new Error(`Missing contribution allocation for ${assetClass}`);
  }

  return allocation;
}

describe("allocateContribution", () => {
  it("returns a deterministic zero plan for a zero contribution", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
      contribution: Money.zero("BRL"),
    });

    expect(plan.postContributionValue.toDecimalString()).toBe("100.00");
    expect(allocationFor(plan.allocations, "EQUITY").postContributionNeed.toDecimalString()).toBe(
      "0.00",
    );
    expect(allocationFor(plan.allocations, "EQUITY").allocatedAmount.toDecimalString()).toBe(
      "0.00",
    );
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("uses portfolio value plus contribution as the target base", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "50" },
        { assetClass: "EQUITY", targetWeight: "50" },
      ],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("50.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("50.00", "BRL") },
      ],
      contribution: Money.fromDecimal("10.00", "BRL"),
    });

    expect(plan.postContributionValue.toDecimalString()).toBe("110.00");
    expect(
      allocationFor(plan.allocations, "EQUITY").postContributionTargetValue.toDecimalString(),
    ).toBe("55.00");
    expect(allocationFor(plan.allocations, "EQUITY").allocatedAmount.toDecimalString()).toBe(
      "5.00",
    );
    expect(allocationFor(plan.allocations, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe(
      "5.00",
    );
  });

  it("directs the contribution only to a positive post-contribution need", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "60" },
        { assetClass: "EQUITY", targetWeight: "40" },
      ],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("70.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("30.00", "BRL") },
      ],
      contribution: Money.fromDecimal("20.00", "BRL"),
    });

    expect(allocationFor(plan.allocations, "EQUITY").postContributionNeed.toDecimalString()).toBe(
      "0.00",
    );
    expect(allocationFor(plan.allocations, "EQUITY").allocatedAmount.toDecimalString()).toBe(
      "0.00",
    );
    expect(
      allocationFor(plan.allocations, "FIXED_INCOME").postContributionNeed.toDecimalString(),
    ).toBe("42.00");
    expect(allocationFor(plan.allocations, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe(
      "20.00",
    );
  });

  it("distributes proportionally across multiple positive needs", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeight: "50" },
        { assetClass: "FIXED_INCOME", targetWeight: "30" },
        { assetClass: "REAL_ESTATE", targetWeight: "20" },
      ],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("40.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("40.00", "BRL") },
        { assetClass: "REAL_ESTATE", currentValue: Money.fromDecimal("20.00", "BRL") },
      ],
      contribution: Money.fromDecimal("10.00", "BRL"),
    });

    expect(allocationFor(plan.allocations, "EQUITY").postContributionNeed.toDecimalString()).toBe(
      "15.00",
    );
    expect(
      allocationFor(plan.allocations, "REAL_ESTATE").postContributionNeed.toDecimalString(),
    ).toBe("2.00");
    expect(allocationFor(plan.allocations, "EQUITY").allocatedAmount.toDecimalString()).toBe(
      "8.82",
    );
    expect(allocationFor(plan.allocations, "REAL_ESTATE").allocatedAmount.toDecimalString()).toBe(
      "1.18",
    );
    expect(allocationFor(plan.allocations, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe(
      "0.00",
    );
  });

  it("reconciles one-cent allocation by largest remainder and lexical tie-break", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "50" },
        { assetClass: "EQUITY", targetWeight: "50" },
      ],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("0.01", "BRL"),
      currentValues: [{ assetClass: "CASH", currentValue: Money.fromDecimal("0.01", "BRL") }],
      contribution: Money.fromDecimal("0.01", "BRL"),
    });

    expect(plan.allocations.map((allocation) => allocation.assetClass.toString())).toEqual([
      "CASH",
      "EQUITY",
      "FIXED_INCOME",
    ]);
    expect(allocationFor(plan.allocations, "EQUITY").allocatedAmount.toDecimalString()).toBe(
      "0.01",
    );
    expect(allocationFor(plan.allocations, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe(
      "0.00",
    );
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("keeps every allocation within the contribution and its bucket need", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeight: "70" },
        { assetClass: "FIXED_INCOME", targetWeight: "30" },
      ],
    });

    const plan = allocateContribution({
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("50.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("50.00", "BRL") },
      ],
      contribution: Money.fromDecimal("25.00", "BRL"),
    });

    const allocatedMinorUnits = plan.allocations.reduce(
      (sum, allocation) => sum + allocation.allocatedAmount.minorUnits,
      0n,
    );

    expect(allocatedMinorUnits).toBeLessThanOrEqual(plan.contribution.minorUnits);
    expect(
      plan.allocations.every(
        (allocation) =>
          allocation.allocatedAmount.minorUnits <= allocation.postContributionNeed.minorUnits,
      ),
    ).toBe(true);
  });

  it("rejects a contribution in a different currency", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
        contribution: Money.fromDecimal("10.00", "USD"),
      }),
    ).toThrowError(CurrencyMismatchError);
  });

  it("rejects current values in a different currency", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "USD") }],
        contribution: Money.fromDecimal("10.00", "BRL"),
      }),
    ).toThrowError(CurrencyMismatchError);
  });

  it("rejects a target allocation from another portfolio", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      allocateContribution({
        portfolioId: SECOND_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("100.00", "BRL") }],
        contribution: Money.fromDecimal("10.00", "BRL"),
      }),
    ).toThrowError(ContributionAllocatorPortfolioMismatchError);
  });

  it("rejects duplicate or unreconciled current state", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [
          { assetClass: "equity", currentValue: Money.fromDecimal("40.00", "BRL") },
          { assetClass: "EQUITY", currentValue: Money.fromDecimal("60.00", "BRL") },
        ],
        contribution: Money.fromDecimal("10.00", "BRL"),
      }),
    ).toThrowError(DuplicateCurrentAllocationBucketError);

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("100.00", "BRL"),
        currentValues: [{ assetClass: "EQUITY", currentValue: Money.fromDecimal("99.99", "BRL") }],
        contribution: Money.fromDecimal("10.00", "BRL"),
      }),
    ).toThrowError(AllocationTotalMismatchError);
  });

  it("rejects negative portfolio value or contribution", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.fromDecimal("-1.00", "BRL"),
        currentValues: [],
        contribution: Money.zero("BRL"),
      }),
    ).toThrowError(NegativeAllocationValueError);

    expect(() =>
      allocateContribution({
        portfolioId: FIRST_PORTFOLIO_ID,
        targetAllocation,
        portfolioValue: Money.zero("BRL"),
        currentValues: [],
        contribution: Money.fromDecimal("-0.01", "BRL"),
      }),
    ).toThrowError(NegativeAllocationValueError);
  });

  it("returns an ordered and frozen result for repeated equivalent input", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "REAL_ESTATE", targetWeight: "20" },
        { assetClass: "FIXED_INCOME", targetWeight: "30" },
        { assetClass: "EQUITY", targetWeight: "50" },
      ],
    });
    const input = {
      portfolioId: FIRST_PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "REAL_ESTATE", currentValue: Money.fromDecimal("20.00", "BRL") },
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("40.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("40.00", "BRL") },
      ],
      contribution: Money.fromDecimal("10.00", "BRL"),
    } as const;

    const first = allocateContribution(input);
    const second = allocateContribution(input);
    const project = (plan: typeof first) =>
      plan.allocations.map((allocation) => ({
        assetClass: allocation.assetClass.toString(),
        need: allocation.postContributionNeed.toDecimalString(),
        amount: allocation.allocatedAmount.toDecimalString(),
      }));

    expect(project(first)).toEqual(project(second));
    expect(first.allocations.map((allocation) => allocation.assetClass.toString())).toEqual([
      "EQUITY",
      "FIXED_INCOME",
      "REAL_ESTATE",
    ]);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.allocations)).toBe(true);
    expect(first.allocations.every((allocation) => Object.isFrozen(allocation))).toBe(true);
  });
});
