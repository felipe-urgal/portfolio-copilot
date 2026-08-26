import { describe, expect, it } from "vitest";

import { AssetClass } from "../asset";
import { AllocationWeight, Money } from "../financial";
import { PortfolioId } from "../portfolio";
import {
  applyAssetClassConcentrationLimits,
  type AssetClassConcentrationLimitInput,
  type ContributionConcentrationAllocation,
  type ContributionConcentrationPlan,
} from "./asset-class-concentration-limits";
import { type ContributionAllocation, type ContributionPlan } from "./contribution-allocator";
import {
  DuplicateAssetClassConcentrationLimitError,
  InvalidAssetClassConcentrationRangeError,
  InvalidAssetClassConcentrationWeightError,
} from "./errors";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440030");
const CURRENCY = "BRL";

type AllocationInput = Readonly<{
  assetClass: string;
  currentValue: string;
  allocatedAmount: string;
}>;

function createPlan(
  allocationsInput: readonly AllocationInput[],
  contribution = "10.00",
  upstreamUnallocated = "0.00",
): ContributionPlan {
  const allocations = allocationsInput.map<ContributionAllocation>((input) => {
    const currentValue = Money.fromDecimal(input.currentValue, CURRENCY);
    const allocatedAmount = Money.fromDecimal(input.allocatedAmount, CURRENCY);

    return Object.freeze({
      portfolioId: PORTFOLIO_ID,
      assetClass: AssetClass.from(input.assetClass),
      currentValue,
      postContributionTargetValue: currentValue.add(allocatedAmount),
      postContributionNeed: allocatedAmount,
      allocatedAmount,
    });
  });
  const portfolioValueMinorUnits = allocations.reduce(
    (sum, allocation) => sum + allocation.currentValue.minorUnits,
    0n,
  );
  const portfolioValue = Money.fromMinorUnits(portfolioValueMinorUnits, CURRENCY);
  const contributionValue = Money.fromDecimal(contribution, CURRENCY);

  return Object.freeze({
    portfolioId: PORTFOLIO_ID,
    portfolioValue,
    contribution: contributionValue,
    postContributionValue: portfolioValue.add(contributionValue),
    allocations: Object.freeze(allocations),
    unallocatedContribution: Money.fromDecimal(upstreamUnallocated, CURRENCY),
  });
}

function limit(
  assetClass: string,
  softMaxWeight = "50",
  hardMaxWeight = "60",
): AssetClassConcentrationLimitInput {
  return {
    assetClass,
    softMaxWeight,
    hardMaxWeight,
  };
}

function allocationByClass(
  plan: ContributionConcentrationPlan,
  assetClass: string,
): ContributionConcentrationAllocation {
  const allocation = plan.allocations.find(
    (candidate) => candidate.assetClass.code === assetClass,
  );

  if (allocation === undefined) {
    throw new Error(`Missing allocation for ${assetClass}`);
  }

  return allocation;
}

describe("applyAssetClassConcentrationLimits", () => {
  it("preserves classes without an explicit concentration limit", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "40.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "50.00", allocatedAmount: "5.00" },
      ]),
      limits: [],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("5.00");
    expect(equity.blockedAmount.toDecimalString()).toBe("0.00");
    expect(equity.softMaxWeight).toBeNull();
    expect(equity.hardMaxWeight).toBeNull();
    expect(equity.softLimitExceeded).toBe(false);
    expect(equity.hardLimitApplied).toBe(false);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("keeps an allocation below the soft limit without an alert", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "40.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "50.00", allocatedAmount: "5.00" },
      ]),
      limits: [limit("EQUITY", "50", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("5.00");
    expect(equity.softLimitExceeded).toBe(false);
    expect(equity.hardLimitApplied).toBe(false);
  });

  it("signals a projected soft-limit breach without blocking below the hard limit", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "50.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "40.00", allocatedAmount: "5.00" },
      ]),
      limits: [limit("EQUITY", "50", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("5.00");
    expect(equity.softLimitExceeded).toBe(true);
    expect(equity.hardLimitApplied).toBe(false);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("caps only the part of an allocation that would exceed the hard limit", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan(
        [
          { assetClass: "EQUITY", currentValue: "59.00", allocatedAmount: "3.00" },
          { assetClass: "FIXED_INCOME", currentValue: "38.00", allocatedAmount: "0.00" },
        ],
        "3.00",
      ),
      limits: [limit("EQUITY", "55", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("1.00");
    expect(equity.blockedAmount.toDecimalString()).toBe("2.00");
    expect(equity.softLimitExceeded).toBe(true);
    expect(equity.hardLimitApplied).toBe(true);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("2.00");
  });

  it("allows an allocation that reaches the hard limit exactly", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan(
        [
          { assetClass: "EQUITY", currentValue: "59.00", allocatedAmount: "1.00" },
          { assetClass: "FIXED_INCOME", currentValue: "40.00", allocatedAmount: "0.00" },
        ],
        "1.00",
      ),
      limits: [limit("EQUITY", "55", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("1.00");
    expect(equity.blockedAmount.toDecimalString()).toBe("0.00");
    expect(equity.hardLimitApplied).toBe(false);
  });

  it("supports equal soft and hard limits", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan(
        [
          { assetClass: "EQUITY", currentValue: "59.00", allocatedAmount: "2.00" },
          { assetClass: "FIXED_INCOME", currentValue: "39.00", allocatedAmount: "0.00" },
        ],
        "2.00",
      ),
      limits: [limit("EQUITY", "60", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("1.00");
    expect(equity.softLimitExceeded).toBe(false);
    expect(equity.hardLimitApplied).toBe(true);
  });

  it("rejects soft limits above the hard limit", () => {
    expect(() =>
      applyAssetClassConcentrationLimits({
        plan: createPlan([
          { assetClass: "EQUITY", currentValue: "90.00", allocatedAmount: "10.00" },
        ]),
        limits: [limit("EQUITY", "61", "60")],
      }),
    ).toThrow(InvalidAssetClassConcentrationRangeError);
  });

  it("rejects duplicate normalized AssetClass limits", () => {
    expect(() =>
      applyAssetClassConcentrationLimits({
        plan: createPlan([
          { assetClass: "EQUITY", currentValue: "90.00", allocatedAmount: "10.00" },
        ]),
        limits: [limit("EQUITY"), limit(" equity ")],
      }),
    ).toThrow(DuplicateAssetClassConcentrationLimitError);
  });

  it("rejects invalid concentration weight values with a contribution-domain error", () => {
    expect(() =>
      applyAssetClassConcentrationLimits({
        plan: createPlan([
          { assetClass: "EQUITY", currentValue: "90.00", allocatedAmount: "10.00" },
        ]),
        limits: [limit("EQUITY", "101", "100")],
      }),
    ).toThrow(InvalidAssetClassConcentrationWeightError);

    expect(() =>
      applyAssetClassConcentrationLimits({
        plan: createPlan([
          { assetClass: "EQUITY", currentValue: "90.00", allocatedAmount: "10.00" },
        ]),
        limits: [
          {
            assetClass: "EQUITY",
            softMaxWeight: {} as unknown as string,
            hardMaxWeight: "100",
          },
        ],
      }),
    ).toThrow(InvalidAssetClassConcentrationWeightError);
  });

  it("applies distinct limits independently across multiple classes", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "45.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "45.00", allocatedAmount: "5.00" },
      ]),
      limits: [limit("EQUITY", "40", "50"), limit("FIXED_INCOME", "46", "47")],
    });

    const equity = allocationByClass(plan, "EQUITY");
    const fixedIncome = allocationByClass(plan, "FIXED_INCOME");

    expect(equity.allocatedAmount.toDecimalString()).toBe("5.00");
    expect(equity.softLimitExceeded).toBe(true);
    expect(equity.hardLimitApplied).toBe(false);
    expect(fixedIncome.allocatedAmount.toDecimalString()).toBe("2.00");
    expect(fixedIncome.blockedAmount.toDecimalString()).toBe("3.00");
    expect(fixedIncome.softLimitExceeded).toBe(true);
    expect(fixedIncome.hardLimitApplied).toBe(true);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("3.00");
  });

  it("preserves upstream unallocated contribution and adds only newly blocked value", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan(
        [
          { assetClass: "EQUITY", currentValue: "49.00", allocatedAmount: "8.00" },
          { assetClass: "FIXED_INCOME", currentValue: "41.00", allocatedAmount: "0.00" },
        ],
        "10.00",
        "2.00",
      ),
      limits: [limit("EQUITY", "45", "50")],
    });

    expect(allocationByClass(plan, "EQUITY").blockedAmount.toDecimalString()).toBe("7.00");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("9.00");
  });

  it("uses exact cent arithmetic at the hard-limit boundary", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan(
        [
          { assetClass: "EQUITY", currentValue: "49.99", allocatedAmount: "1.00" },
          { assetClass: "FIXED_INCOME", currentValue: "49.01", allocatedAmount: "0.00" },
        ],
        "1.00",
      ),
      limits: [limit("EQUITY", "45", "50")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("0.01");
    expect(equity.blockedAmount.toDecimalString()).toBe("0.99");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.99");
  });

  it("blocks new allocation when the class is already above the hard limit", () => {
    const plan = applyAssetClassConcentrationLimits({
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "61.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "29.00", allocatedAmount: "5.00" },
      ]),
      limits: [limit("EQUITY", "55", "60")],
    });

    const equity = allocationByClass(plan, "EQUITY");

    expect(equity.allocatedAmount.toDecimalString()).toBe("0.00");
    expect(equity.blockedAmount.toDecimalString()).toBe("5.00");
    expect(equity.softLimitExceeded).toBe(true);
    expect(equity.hardLimitApplied).toBe(true);
  });

  it("accepts AllocationWeight value objects and returns frozen deterministic output", () => {
    const input = {
      plan: createPlan([
        { assetClass: "EQUITY", currentValue: "45.00", allocatedAmount: "5.00" },
        { assetClass: "FIXED_INCOME", currentValue: "45.00", allocatedAmount: "5.00" },
      ]),
      limits: [
        {
          assetClass: AssetClass.from("EQUITY"),
          softMaxWeight: AllocationWeight.fromPercent("40"),
          hardMaxWeight: AllocationWeight.fromPercent("50"),
        },
      ],
    } as const;

    const first = applyAssetClassConcentrationLimits(input);
    const second = applyAssetClassConcentrationLimits(input);

    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.allocations)).toBe(true);
    expect(first.allocations.every((allocation) => Object.isFrozen(allocation))).toBe(true);
    expect(first.allocations.map((allocation) => allocation.assetClass.code)).toEqual([
      "EQUITY",
      "FIXED_INCOME",
    ]);
  });
});
