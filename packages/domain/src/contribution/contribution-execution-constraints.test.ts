import { describe, expect, it } from "vitest";

import { AssetQuantity } from "../asset";
import { Money } from "../financial";
import { TargetAllocation } from "../portfolio";
import {
  allocateContribution,
  applyContributionExecutionConstraints,
  applyContributionPolicy,
  DuplicateContributionExecutionDestinationError,
  InvalidContributionDestinationEligibilityError,
  InvalidMinimumTradableQuantityError,
  MissingContributionExecutionDestinationError,
  type ContributionExecutionDestinationInput,
  type ContributionExecutionPlan,
  type ContributionPlan,
} from "./index";

const PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const EQUITY_ASSET_ID = "550e8400-e29b-41d4-a716-446655440101";
const FIXED_INCOME_ASSET_ID = "550e8400-e29b-41d4-a716-446655440102";
const OTHER_ASSET_ID = "550e8400-e29b-41d4-a716-446655440103";

function createBaselinePlan(contribution = "20.00"): ContributionPlan {
  const targetAllocation = TargetAllocation.create({
    portfolioId: PORTFOLIO_ID,
    buckets: [
      { assetClass: "FIXED_INCOME", targetWeight: "50" },
      { assetClass: "EQUITY", targetWeight: "50" },
    ],
  });

  return allocateContribution({
    portfolioId: PORTFOLIO_ID,
    targetAllocation,
    portfolioValue: Money.fromDecimal("100.00", "BRL"),
    currentValues: [
      { assetClass: "EQUITY", currentValue: Money.fromDecimal("40.00", "BRL") },
      { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("40.00", "BRL") },
      { assetClass: "CASH", currentValue: Money.fromDecimal("20.00", "BRL") },
    ],
    contribution: Money.fromDecimal(contribution, "BRL"),
  });
}

function destination(
  assetId: string,
  assetClass: string,
  isEligible = true,
  minimumTradableQuantity = "1",
): ContributionExecutionDestinationInput {
  return {
    assetId,
    assetClass,
    isEligible,
    minimumTradableQuantity,
  };
}

function destinationAmount(plan: ContributionExecutionPlan, assetClass: string): string | undefined {
  return plan.destinations
    .find((candidate) => candidate.assetClass.toString() === assetClass)
    ?.allocatedAmount.toDecimalString();
}

describe("applyContributionExecutionConstraints", () => {
  it("keeps an eligible selected destination and its exact minimum tradable quantity", () => {
    const policyPlan = applyContributionPolicy({
      plan: createBaselinePlan(),
      policy: {
        minimumMeaningfulContribution: Money.zero("BRL"),
        maxDestinationsPerContribution: 1,
      },
    });

    const plan = applyContributionExecutionConstraints({
      plan: policyPlan,
      destinations: [destination(EQUITY_ASSET_ID, "EQUITY", true, "0.001")],
    });

    expect(plan.destinations).toHaveLength(1);
    expect(plan.destinations[0]?.assetId.toString()).toBe(EQUITY_ASSET_ID);
    expect(plan.destinations[0]?.assetClass.toString()).toBe("EQUITY");
    expect(plan.destinations[0]?.allocatedAmount.toDecimalString()).toBe("20.00");
    expect(plan.destinations[0]?.minimumTradableQuantity.toDecimalString()).toBe(
      "0.001000000000",
    );
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("moves an ineligible destination amount to explicit unallocated contribution", () => {
    const plan = applyContributionExecutionConstraints({
      plan: createBaselinePlan(),
      destinations: [
        destination(EQUITY_ASSET_ID, "EQUITY", true),
        destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME", false),
      ],
    });

    expect(destinationAmount(plan, "EQUITY")).toBe("10.00");
    expect(destinationAmount(plan, "FIXED_INCOME")).toBeUndefined();
    expect(plan.unallocatedContribution.toDecimalString()).toBe("10.00");
  });

  it("does not redistribute money blocked by execution eligibility", () => {
    const plan = applyContributionExecutionConstraints({
      plan: createBaselinePlan(),
      destinations: [
        destination(EQUITY_ASSET_ID, "EQUITY", true),
        destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME", false),
      ],
    });

    expect(destinationAmount(plan, "EQUITY")).toBe("10.00");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("10.00");
  });

  it("keeps the whole contribution unallocated when no selected destination is eligible", () => {
    const plan = applyContributionExecutionConstraints({
      plan: createBaselinePlan(),
      destinations: [
        destination(EQUITY_ASSET_ID, "EQUITY", false),
        destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME", false),
      ],
    });

    expect(plan.destinations).toEqual([]);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("20.00");
  });

  it("requires a destination for every positive allocation", () => {
    expect(() =>
      applyContributionExecutionConstraints({
        plan: createBaselinePlan(),
        destinations: [destination(EQUITY_ASSET_ID, "EQUITY")],
      }),
    ).toThrowError(MissingContributionExecutionDestinationError);
  });

  it("rejects zero, negative and malformed minimum tradable quantities", () => {
    for (const minimumTradableQuantity of ["0", "-0.01", "not-a-quantity"]) {
      expect(() =>
        applyContributionExecutionConstraints({
          plan: createBaselinePlan(),
          destinations: [
            destination(
              EQUITY_ASSET_ID,
              "EQUITY",
              true,
              minimumTradableQuantity,
            ),
            destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME"),
          ],
        }),
      ).toThrowError(InvalidMinimumTradableQuantityError);
    }

    expect(() =>
      applyContributionExecutionConstraints({
        plan: createBaselinePlan(),
        destinations: [
          {
            assetId: EQUITY_ASSET_ID,
            assetClass: "EQUITY",
            isEligible: true,
            minimumTradableQuantity: AssetQuantity.zero(),
          },
          destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME"),
        ],
      }),
    ).toThrowError(InvalidMinimumTradableQuantityError);
  });

  it("rejects duplicate destination asset classes or asset ids", () => {
    expect(() =>
      applyContributionExecutionConstraints({
        plan: createBaselinePlan(),
        destinations: [
          destination(EQUITY_ASSET_ID, "equity"),
          destination(OTHER_ASSET_ID, "EQUITY"),
        ],
      }),
    ).toThrowError(DuplicateContributionExecutionDestinationError);

    expect(() =>
      applyContributionExecutionConstraints({
        plan: createBaselinePlan(),
        destinations: [
          destination(EQUITY_ASSET_ID, "EQUITY"),
          destination(EQUITY_ASSET_ID, "FIXED_INCOME"),
        ],
      }),
    ).toThrowError(DuplicateContributionExecutionDestinationError);
  });

  it("rejects a non-boolean eligibility shape", () => {
    expect(() =>
      applyContributionExecutionConstraints({
        plan: createBaselinePlan(),
        destinations: [
          {
            ...destination(EQUITY_ASSET_ID, "EQUITY"),
            isEligible: "yes" as unknown as boolean,
          },
          destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME"),
        ],
      }),
    ).toThrowError(InvalidContributionDestinationEligibilityError);
  });

  it("keeps distinct assets separated by AssetId without ticker identity", () => {
    const plan = applyContributionExecutionConstraints({
      plan: createBaselinePlan(),
      destinations: [
        destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME"),
        destination(EQUITY_ASSET_ID, "EQUITY"),
      ],
    });

    expect(plan.destinations.map((candidate) => candidate.assetId.toString())).toEqual([
      EQUITY_ASSET_ID,
      FIXED_INCOME_ASSET_ID,
    ]);
    expect(new Set(plan.destinations.map((candidate) => candidate.assetId.toString())).size).toBe(
      2,
    );
  });

  it("preserves an existing micro-contribution policy result", () => {
    const policyPlan = applyContributionPolicy({
      plan: createBaselinePlan(),
      policy: {
        minimumMeaningfulContribution: Money.fromDecimal("5.00", "BRL"),
        maxDestinationsPerContribution: 1,
      },
    });

    const plan = applyContributionExecutionConstraints({
      plan: policyPlan,
      destinations: [destination(EQUITY_ASSET_ID, "EQUITY")],
    });

    expect(plan.destinations).toHaveLength(1);
    expect(destinationAmount(plan, "EQUITY")).toBe("20.00");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("needs no destination for a zero-contribution plan", () => {
    const plan = applyContributionExecutionConstraints({
      plan: createBaselinePlan("0.00"),
      destinations: [],
    });

    expect(plan.destinations).toEqual([]);
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("returns a frozen and reproducible execution plan", () => {
    const input = {
      plan: createBaselinePlan(),
      destinations: [
        destination(FIXED_INCOME_ASSET_ID, "FIXED_INCOME"),
        destination(EQUITY_ASSET_ID, "EQUITY"),
      ],
    } as const;

    const first = applyContributionExecutionConstraints(input);
    const second = applyContributionExecutionConstraints(input);
    const project = (plan: ContributionExecutionPlan) =>
      plan.destinations.map((candidate) => ({
        assetId: candidate.assetId.toString(),
        assetClass: candidate.assetClass.toString(),
        amount: candidate.allocatedAmount.toDecimalString(),
        minimumTradableQuantity: candidate.minimumTradableQuantity.toDecimalString(),
      }));

    expect(project(first)).toEqual(project(second));
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.destinations)).toBe(true);
    expect(first.destinations.every((candidate) => Object.isFrozen(candidate))).toBe(true);
  });
});
