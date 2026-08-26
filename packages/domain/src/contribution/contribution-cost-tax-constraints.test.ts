import { describe, expect, it } from "vitest";

import { AssetClass, AssetId, AssetQuantity } from "../asset";
import { CurrencyMismatchError, Money } from "../financial";
import { PortfolioId } from "../portfolio";
import {
  applyContributionCostTaxConstraints,
  type ContributionCostAdjustedPlan,
  type ContributionCostTaxConstraintInput,
} from "./contribution-cost-tax-constraints";
import {
  applyContributionExecutionConstraints,
  type ContributionExecutionDestination,
  type ContributionExecutionPlan,
} from "./contribution-execution-constraints";
import { type ContributionAllocation, type ContributionPlan } from "./contribution-allocator";
import {
  DuplicateContributionCostConstraintError,
  NegativeAllocationValueError,
  UnknownContributionCostConstraintDestinationError,
} from "./errors";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440030");
const EQUITY_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440031");
const FIXED_INCOME_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440032");
const UNKNOWN_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440033");
const CURRENCY = "BRL";

function executionDestination(
  assetId: AssetId,
  assetClass: string,
  allocatedAmount: string,
): ContributionExecutionDestination {
  return Object.freeze({
    portfolioId: PORTFOLIO_ID,
    assetId,
    assetClass: AssetClass.from(assetClass),
    allocatedAmount: Money.fromDecimal(allocatedAmount, CURRENCY),
    minimumTradableQuantity: AssetQuantity.fromDecimal("1"),
  });
}

function createExecutionPlan(
  destinations: readonly ContributionExecutionDestination[],
  contribution = "100.00",
): ContributionExecutionPlan {
  const contributionMoney = Money.fromDecimal(contribution, CURRENCY);
  const allocatedMinorUnits = destinations.reduce(
    (sum, destination) => sum + destination.allocatedAmount.minorUnits,
    0n,
  );

  return Object.freeze({
    portfolioId: PORTFOLIO_ID,
    contribution: contributionMoney,
    destinations: Object.freeze([...destinations]),
    unallocatedContribution: Money.fromMinorUnits(
      contributionMoney.minorUnits - allocatedMinorUnits,
      CURRENCY,
    ),
  });
}

function constraint(
  assetId: AssetId,
  transactionCost = "0.00",
  estimatedTaxImpact = "0.00",
  currency = CURRENCY,
): ContributionCostTaxConstraintInput {
  return {
    assetId,
    transactionCost: Money.fromDecimal(transactionCost, currency),
    estimatedTaxImpact: Money.fromDecimal(estimatedTaxImpact, currency),
  };
}

function destinationById(plan: ContributionCostAdjustedPlan, assetId: AssetId) {
  const destination = plan.destinations.find((candidate) => candidate.assetId.equals(assetId));

  if (destination === undefined) {
    throw new Error(`Missing destination ${assetId.toString()}`);
  }

  return destination;
}

describe("applyContributionCostTaxConstraints", () => {
  it("treats destinations without an explicit cost constraint as zero-cost", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
      constraints: [],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.allocatedAmount.toDecimalString()).toBe("100.00");
    expect(destination.transactionCost.toDecimalString()).toBe("0.00");
    expect(destination.estimatedTaxImpact.toDecimalString()).toBe("0.00");
    expect(destination.totalKnownCost.toDecimalString()).toBe("0.00");
    expect(destination.investableAmount.toDecimalString()).toBe("100.00");
    expect(destination.status).toBe("EXECUTABLE");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("subtracts a known transaction cost explicitly from the investable amount", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
      constraints: [constraint(EQUITY_ID, "1.25")],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.allocatedAmount.toDecimalString()).toBe("100.00");
    expect(destination.transactionCost.toDecimalString()).toBe("1.25");
    expect(destination.investableAmount.toDecimalString()).toBe("98.75");
    expect(destination.status).toBe("EXECUTABLE");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("represents provided tax impact separately from transaction cost", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
      constraints: [constraint(EQUITY_ID, "0.00", "2.40")],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.transactionCost.toDecimalString()).toBe("0.00");
    expect(destination.estimatedTaxImpact.toDecimalString()).toBe("2.40");
    expect(destination.totalKnownCost.toDecimalString()).toBe("2.40");
    expect(destination.investableAmount.toDecimalString()).toBe("97.60");
  });

  it("combines transaction cost and tax impact without hiding either component", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
      constraints: [constraint(EQUITY_ID, "1.10", "2.20")],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.totalKnownCost.toDecimalString()).toBe("3.30");
    expect(destination.investableAmount.toDecimalString()).toBe("96.70");
    expect(destination.investableAmount.minorUnits + destination.totalKnownCost.minorUnits).toBe(
      destination.allocatedAmount.minorUnits,
    );
  });

  it("blocks a destination when known costs equal the allocated amount", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "10.00")], "10.00"),
      constraints: [constraint(EQUITY_ID, "7.00", "3.00")],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.investableAmount.toDecimalString()).toBe("0.00");
    expect(destination.status).toBe("BLOCKED_KNOWN_COSTS");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("10.00");
  });

  it("blocks a destination when known costs exceed the allocated amount", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "10.00")], "10.00"),
      constraints: [constraint(EQUITY_ID, "10.01")],
    });

    expect(destinationById(plan, EQUITY_ID).status).toBe("BLOCKED_KNOWN_COSTS");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("10.00");
  });

  it("rejects transaction costs in a currency different from the contribution", () => {
    expect(() =>
      applyContributionCostTaxConstraints({
        plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
        constraints: [constraint(EQUITY_ID, "1.00", "0.00", "USD")],
      }),
    ).toThrow(CurrencyMismatchError);
  });

  it("rejects tax impacts in a currency different from the contribution", () => {
    expect(() =>
      applyContributionCostTaxConstraints({
        plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
        constraints: [
          {
            assetId: EQUITY_ID,
            transactionCost: Money.zero(CURRENCY),
            estimatedTaxImpact: Money.fromDecimal("1.00", "USD"),
          },
        ],
      }),
    ).toThrow(CurrencyMismatchError);
  });

  it.each([
    ["transactionCost", Money.fromDecimal("-0.01", CURRENCY), Money.zero(CURRENCY)],
    ["estimatedTaxImpact", Money.zero(CURRENCY), Money.fromDecimal("-0.01", CURRENCY)],
  ])("rejects negative %s", (_field, transactionCost, estimatedTaxImpact) => {
    expect(() =>
      applyContributionCostTaxConstraints({
        plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
        constraints: [{ assetId: EQUITY_ID, transactionCost, estimatedTaxImpact }],
      }),
    ).toThrow(NegativeAllocationValueError);
  });

  it("rejects duplicate normalized AssetId cost constraints", () => {
    expect(() =>
      applyContributionCostTaxConstraints({
        plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
        constraints: [
          constraint(EQUITY_ID, "1.00"),
          constraint(AssetId.from(EQUITY_ID.toString().toUpperCase()), "2.00"),
        ],
      }),
    ).toThrow(DuplicateContributionCostConstraintError);
  });

  it("rejects a cost constraint for an asset that is not a destination in the plan", () => {
    expect(() =>
      applyContributionCostTaxConstraints({
        plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
        constraints: [constraint(UNKNOWN_ID, "1.00")],
      }),
    ).toThrow(UnknownContributionCostConstraintDestinationError);
  });

  it("applies costs independently across multiple destinations and preserves upstream cash", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan(
        [
          executionDestination(EQUITY_ID, "EQUITY", "40.00"),
          executionDestination(FIXED_INCOME_ID, "FIXED_INCOME", "50.00"),
        ],
        "100.00",
      ),
      constraints: [constraint(EQUITY_ID, "2.00"), constraint(FIXED_INCOME_ID, "50.00")],
    });

    expect(destinationById(plan, EQUITY_ID).investableAmount.toDecimalString()).toBe("38.00");
    expect(destinationById(plan, FIXED_INCOME_ID).status).toBe("BLOCKED_KNOWN_COSTS");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("60.00");
    expect(plan.destinations.map((destination) => destination.assetId.toString())).toEqual([
      EQUITY_ID.toString(),
      FIXED_INCOME_ID.toString(),
    ]);
  });

  it("uses exact cent arithmetic for small allocations", () => {
    const plan = applyContributionCostTaxConstraints({
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "0.03")], "0.03"),
      constraints: [constraint(EQUITY_ID, "0.01", "0.01")],
    });
    const destination = destinationById(plan, EQUITY_ID);

    expect(destination.totalKnownCost.toDecimalString()).toBe("0.02");
    expect(destination.investableAmount.toDecimalString()).toBe("0.01");
    expect(plan.unallocatedContribution.toDecimalString()).toBe("0.00");
  });

  it("integrates after contribution execution constraints without recalculating destination choice", () => {
    const allocation: ContributionAllocation = Object.freeze({
      portfolioId: PORTFOLIO_ID,
      assetClass: AssetClass.from("EQUITY"),
      currentValue: Money.fromDecimal("90.00", CURRENCY),
      postContributionTargetValue: Money.fromDecimal("100.00", CURRENCY),
      postContributionNeed: Money.fromDecimal("10.00", CURRENCY),
      allocatedAmount: Money.fromDecimal("10.00", CURRENCY),
    });
    const contributionPlan: ContributionPlan = Object.freeze({
      portfolioId: PORTFOLIO_ID,
      portfolioValue: Money.fromDecimal("90.00", CURRENCY),
      contribution: Money.fromDecimal("10.00", CURRENCY),
      postContributionValue: Money.fromDecimal("100.00", CURRENCY),
      allocations: Object.freeze([allocation]),
      unallocatedContribution: Money.zero(CURRENCY),
    });
    const executionPlan = applyContributionExecutionConstraints({
      plan: contributionPlan,
      destinations: [
        {
          assetId: EQUITY_ID,
          assetClass: "EQUITY",
          isEligible: true,
          minimumTradableQuantity: "1",
        },
      ],
    });
    const result = applyContributionCostTaxConstraints({
      plan: executionPlan,
      constraints: [constraint(EQUITY_ID, "1.00")],
    });

    expect(result.destinations).toHaveLength(1);
    expect(result.destinations[0]?.assetId.equals(EQUITY_ID)).toBe(true);
    expect(result.destinations[0]?.allocatedAmount.toDecimalString()).toBe("10.00");
    expect(result.destinations[0]?.investableAmount.toDecimalString()).toBe("9.00");
  });

  it("returns frozen deterministic output for repeated calls", () => {
    const input = {
      plan: createExecutionPlan([executionDestination(EQUITY_ID, "EQUITY", "100.00")]),
      constraints: [constraint(EQUITY_ID, "1.23", "0.45")],
    } as const;

    const first = applyContributionCostTaxConstraints(input);
    const second = applyContributionCostTaxConstraints(input);

    expect(first.destinations[0]?.investableAmount.toDecimalString()).toBe(
      second.destinations[0]?.investableAmount.toDecimalString(),
    );
    expect(first.destinations[0]?.status).toBe(second.destinations[0]?.status);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.destinations)).toBe(true);
    expect(Object.isFrozen(first.destinations[0])).toBe(true);
  });
});
