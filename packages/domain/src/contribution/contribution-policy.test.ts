import { describe, expect, it } from "vitest";

import { CurrencyMismatchError, Money } from "../financial";
import { TargetAllocation } from "../portfolio";
import {
  allocateContribution,
  applyContributionPolicy,
  InvalidMaxDestinationsPerContributionError,
  NegativeAllocationValueError,
  type ContributionAllocation,
  type ContributionPlan,
} from "./index";

const PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";

function allocationFor(plan: ContributionPlan, assetClass: string): ContributionAllocation {
  const allocation = plan.allocations.find(
    (candidate) => candidate.assetClass.toString() === assetClass,
  );

  if (allocation === undefined) {
    throw new Error(`Missing contribution allocation for ${assetClass}`);
  }

  return allocation;
}

function createBaselinePlan(): ContributionPlan {
  const targetAllocation = TargetAllocation.create({
    portfolioId: PORTFOLIO_ID,
    buckets: [
      { assetClass: "EQUITY", targetWeight: "50" },
      { assetClass: "FIXED_INCOME", targetWeight: "30" },
      { assetClass: "REAL_ESTATE", targetWeight: "20" },
    ],
  });

  return allocateContribution({
    portfolioId: PORTFOLIO_ID,
    targetAllocation,
    portfolioValue: Money.fromDecimal("100.00", "BRL"),
    currentValues: [
      { assetClass: "EQUITY", currentValue: Money.fromDecimal("40.00", "BRL") },
      { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("40.00", "BRL") },
      { assetClass: "REAL_ESTATE", currentValue: Money.fromDecimal("20.00", "BRL") },
    ],
    contribution: Money.fromDecimal("10.00", "BRL"),
  });
}

function projectAllocations(plan: ContributionPlan) {
  return plan.allocations.map((allocation) => ({
    assetClass: allocation.assetClass.toString(),
    allocatedAmount: allocation.allocatedAmount.toDecimalString(),
  }));
}

describe("applyContributionPolicy", () => {
  it("preserves the baseline when the minimum is zero and the destination limit is not restrictive", () => {
    const baseline = createBaselinePlan();

    const result = applyContributionPolicy({
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.zero("BRL"),
        maxDestinationsPerContribution: 10,
      },
    });

    expect(projectAllocations(result)).toEqual(projectAllocations(baseline));
    expect(result.unallocatedContribution.equals(baseline.unallocatedContribution)).toBe(true);
  });

  it("limits the contribution to the class with the greatest post-contribution need", () => {
    const result = applyContributionPolicy({
      plan: createBaselinePlan(),
      policy: {
        minimumMeaningfulContribution: Money.zero("BRL"),
        maxDestinationsPerContribution: 1,
      },
    });

    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("10.00");
    expect(allocationFor(result, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(allocationFor(result, "REAL_ESTATE").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(result.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("uses lexical AssetClass order to break equal-need ties", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: PORTFOLIO_ID,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeight: "50" },
        { assetClass: "EQUITY", targetWeight: "50" },
      ],
    });
    const baseline = allocateContribution({
      portfolioId: PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "CASH", currentValue: Money.fromDecimal("100.00", "BRL") }],
      contribution: Money.fromDecimal("10.00", "BRL"),
    });

    const result = applyContributionPolicy({
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.zero("BRL"),
        maxDestinationsPerContribution: 1,
      },
    });

    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("10.00");
    expect(allocationFor(result, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe("0.00");
  });

  it("keeps the full contribution unallocated when every destination would receive less than the minimum", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeight: "50" },
        { assetClass: "FIXED_INCOME", targetWeight: "50" },
      ],
    });
    const baseline = allocateContribution({
      portfolioId: PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "CASH", currentValue: Money.fromDecimal("100.00", "BRL") }],
      contribution: Money.fromDecimal("5.00", "BRL"),
    });

    const result = applyContributionPolicy({
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("3.00", "BRL"),
        maxDestinationsPerContribution: 2,
      },
    });

    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(allocationFor(result, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(result.unallocatedContribution.toDecimalString()).toBe("5.00");
  });

  it("removes a microallocation and redistributes its share to the remaining destination", () => {
    const result = applyContributionPolicy({
      plan: createBaselinePlan(),
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("2.00", "BRL"),
        maxDestinationsPerContribution: 3,
      },
    });

    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("10.00");
    expect(allocationFor(result, "REAL_ESTATE").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(result.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("never redistributes more than the remaining bucket need", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeight: "30" },
        { assetClass: "FIXED_INCOME", targetWeight: "70" },
      ],
    });
    const baseline = allocateContribution({
      portfolioId: PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("30.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("70.00", "BRL") },
      ],
      contribution: Money.fromDecimal("10.00", "BRL"),
    });

    const result = applyContributionPolicy({
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("4.00", "BRL"),
        maxDestinationsPerContribution: 2,
      },
    });

    expect(allocationFor(result, "EQUITY").postContributionNeed.toDecimalString()).toBe("3.00");
    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(allocationFor(result, "FIXED_INCOME").postContributionNeed.toDecimalString()).toBe(
      "7.00",
    );
    expect(allocationFor(result, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe("7.00");
    expect(result.unallocatedContribution.toDecimalString()).toBe("3.00");
  });

  it("combines minimum contribution and destination limit deterministically", () => {
    const targetAllocation = TargetAllocation.create({
      portfolioId: PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeight: "50" },
        { assetClass: "FIXED_INCOME", targetWeight: "30" },
        { assetClass: "REAL_ESTATE", targetWeight: "20" },
      ],
    });
    const baseline = allocateContribution({
      portfolioId: PORTFOLIO_ID,
      targetAllocation,
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [{ assetClass: "CASH", currentValue: Money.fromDecimal("100.00", "BRL") }],
      contribution: Money.fromDecimal("30.00", "BRL"),
    });

    const result = applyContributionPolicy({
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("10.00", "BRL"),
        maxDestinationsPerContribution: 2,
      },
    });

    expect(allocationFor(result, "EQUITY").allocatedAmount.toDecimalString()).toBe("18.75");
    expect(allocationFor(result, "FIXED_INCOME").allocatedAmount.toDecimalString()).toBe("11.25");
    expect(allocationFor(result, "REAL_ESTATE").allocatedAmount.toDecimalString()).toBe("0.00");
    expect(result.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("rejects a minimum contribution in a different currency", () => {
    expect(() =>
      applyContributionPolicy({
        plan: createBaselinePlan(),
        policy: {
          minimumMeaningfulContribution: Money.fromDecimal("1.00", "USD"),
          maxDestinationsPerContribution: 2,
        },
      }),
    ).toThrowError(CurrencyMismatchError);
  });

  it("rejects a negative minimum contribution", () => {
    expect(() =>
      applyContributionPolicy({
        plan: createBaselinePlan(),
        policy: {
          minimumMeaningfulContribution: Money.fromDecimal("-0.01", "BRL"),
          maxDestinationsPerContribution: 2,
        },
      }),
    ).toThrowError(NegativeAllocationValueError);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "rejects invalid maxDestinationsPerContribution: %s",
    (maxDestinationsPerContribution) => {
      expect(() =>
        applyContributionPolicy({
          plan: createBaselinePlan(),
          policy: {
            minimumMeaningfulContribution: Money.zero("BRL"),
            maxDestinationsPerContribution,
          },
        }),
      ).toThrowError(InvalidMaxDestinationsPerContributionError);
    },
  );

  it("returns an ordered, frozen and reproducible policy result", () => {
    const baseline = createBaselinePlan();
    const input = {
      plan: baseline,
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("2.00", "BRL"),
        maxDestinationsPerContribution: 2,
      },
    } as const;

    const first = applyContributionPolicy(input);
    const second = applyContributionPolicy(input);

    expect(projectAllocations(first)).toEqual(projectAllocations(second));
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
