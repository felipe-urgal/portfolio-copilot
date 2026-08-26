import { describe, expect, it } from "vitest";

import { AssetId } from "../asset";
import { Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import {
  buildContributionRecommendationSnapshot,
  type ContributionRecommendationPipelineInput,
} from "./contribution-recommendation-pipeline";
import {
  ContributionAllocatorPortfolioMismatchError,
  InvalidContributionMethodologyVersionError,
} from "./errors";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440040");
const OTHER_PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440041");
const EQUITY_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440042");
const FIXED_INCOME_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440043");

function target(portfolioId = PORTFOLIO_ID) {
  return TargetAllocation.create({
    portfolioId,
    buckets: [
      { assetClass: "EQUITY", targetWeight: "50" },
      { assetClass: "FIXED_INCOME", targetWeight: "50" },
    ],
  });
}

function baseInput(): ContributionRecommendationPipelineInput {
  return {
    methodologyVersion: "portfolio-engine/1",
    allocation: {
      portfolioId: PORTFOLIO_ID,
      targetAllocation: target(),
      portfolioValue: Money.fromDecimal("100.00", "BRL"),
      currentValues: [
        { assetClass: "EQUITY", currentValue: Money.fromDecimal("50.00", "BRL") },
        { assetClass: "FIXED_INCOME", currentValue: Money.fromDecimal("50.00", "BRL") },
      ],
      contribution: Money.fromDecimal("100.00", "BRL"),
    },
    policy: {
      minimumMeaningfulContribution: Money.zero("BRL"),
      maxDestinationsPerContribution: 2,
    },
    concentrationLimits: [],
    executionDestinations: [
      {
        assetId: EQUITY_ID,
        assetClass: "EQUITY",
        isEligible: true,
        minimumTradableQuantity: "1",
      },
      {
        assetId: FIXED_INCOME_ID,
        assetClass: "FIXED_INCOME",
        isEligible: true,
        minimumTradableQuantity: "0.01",
      },
    ],
    costTaxConstraints: [],
  };
}

function decision(snapshot: ReturnType<typeof buildContributionRecommendationSnapshot>, assetClass: string) {
  const found = snapshot.decisions.find((candidate) => candidate.assetClass === assetClass);
  if (found === undefined) throw new Error(`Missing decision for ${assetClass}`);
  return found;
}

describe("buildContributionRecommendationSnapshot", () => {
  it("orchestrates the neutral pipeline and reconciles the contribution", () => {
    const snapshot = buildContributionRecommendationSnapshot(baseInput());

    expect(snapshot.methodologyVersion).toBe("portfolio-engine/1");
    expect(snapshot.portfolioId).toBe(PORTFOLIO_ID.toString());
    expect(snapshot.currency).toBe("BRL");
    expect(snapshot.contribution).toBe("100.00");
    expect(snapshot.policy).toEqual({
      minimumMeaningfulContribution: "0.00",
      maxDestinationsPerContribution: 2,
    });
    expect(snapshot.cashRemainder).toEqual({
      afterAllocator: "0.00",
      afterPolicy: "0.00",
      afterConcentration: "0.00",
      afterExecution: "0.00",
      afterCosts: "0.00",
    });
    expect(snapshot.totalInvestableAmount).toBe("100.00");
    expect(snapshot.totalConsumedKnownCost).toBe("0.00");
    expect(snapshot.unallocatedContribution).toBe("0.00");
    expect(snapshot.decisions.map((item) => item.assetClass)).toEqual(["EQUITY", "FIXED_INCOME"]);
    expect(snapshot.decisions.every((item) => item.status === "EXECUTABLE")).toBe(true);

    const equity = decision(snapshot, "EQUITY");
    expect(equity.targetWeightPercent).toBe("50.0000");
    expect(equity.currentValue).toBe("50.00");
    expect(equity.postContributionTargetValue).toBe("100.00");
    expect(equity.postContributionNeed).toBe("50.00");
    expect(equity.executionEligible).toBe(true);
  });

  it("preserves a contribution policy adjustment and its cash remainder stage", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      policy: { ...input.policy, maxDestinationsPerContribution: 1 },
    });
    const fixedIncome = decision(snapshot, "FIXED_INCOME");

    expect(fixedIncome.baselineAllocatedAmount).toBe("50.00");
    expect(fixedIncome.policyAllocatedAmount).toBe("0.00");
    expect(fixedIncome.status).toBe("NOT_SELECTED_BY_POLICY");
    expect(fixedIncome.reasonCodes).toEqual(["CONTRIBUTION_POLICY_ADJUSTED"]);
    expect(snapshot.cashRemainder).toEqual({
      afterAllocator: "0.00",
      afterPolicy: "50.00",
      afterConcentration: "50.00",
      afterExecution: "50.00",
      afterCosts: "50.00",
    });
  });

  it("preserves soft and hard concentration provenance while keeping the allowed amount executable", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      concentrationLimits: [
        { assetClass: "EQUITY", softMaxWeight: "35", hardMaxWeight: "40" },
      ],
    });
    const equity = decision(snapshot, "EQUITY");

    expect(equity.concentrationAllocatedAmount).toBe("30.00");
    expect(equity.concentrationBlockedAmount).toBe("20.00");
    expect(equity.softMaxWeightPercent).toBe("35.0000");
    expect(equity.hardMaxWeightPercent).toBe("40.0000");
    expect(equity.investableAmount).toBe("30.00");
    expect(equity.status).toBe("EXECUTABLE");
    expect(equity.reasonCodes).toEqual([
      "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
      "HARD_CONCENTRATION_LIMIT_APPLIED",
    ]);
    expect(snapshot.cashRemainder.afterConcentration).toBe("20.00");
    expect(snapshot.unallocatedContribution).toBe("20.00");
  });

  it("keeps an ineligible destination and its prior concentration reasons auditable", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      concentrationLimits: [
        { assetClass: "EQUITY", softMaxWeight: "35", hardMaxWeight: "40" },
      ],
      executionDestinations: input.executionDestinations.map((destination) =>
        destination.assetClass === "EQUITY" ? { ...destination, isEligible: false } : destination,
      ),
    });
    const equity = decision(snapshot, "EQUITY");

    expect(equity.assetId).toBe(EQUITY_ID.toString());
    expect(equity.executionEligible).toBe(false);
    expect(equity.minimumTradableQuantity).toBe("1.000000000000");
    expect(equity.investableAmount).toBe("0.00");
    expect(equity.status).toBe("BLOCKED_INELIGIBLE");
    expect(equity.reasonCodes).toEqual([
      "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
      "HARD_CONCENTRATION_LIMIT_APPLIED",
      "EXECUTION_DESTINATION_INELIGIBLE",
    ]);
    expect(snapshot.cashRemainder.afterConcentration).toBe("20.00");
    expect(snapshot.cashRemainder.afterExecution).toBe("50.00");
    expect(snapshot.unallocatedContribution).toBe("50.00");
  });

  it("subtracts known costs inside the gross destination budget", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      costTaxConstraints: [
        {
          assetId: EQUITY_ID,
          transactionCost: Money.fromDecimal("3.00", "BRL"),
          estimatedTaxImpact: Money.fromDecimal("2.00", "BRL"),
        },
      ],
    });
    const equity = decision(snapshot, "EQUITY");

    expect(equity.transactionCost).toBe("3.00");
    expect(equity.estimatedTaxImpact).toBe("2.00");
    expect(equity.totalKnownCost).toBe("5.00");
    expect(equity.consumedKnownCost).toBe("5.00");
    expect(equity.investableAmount).toBe("45.00");
    expect(snapshot.totalInvestableAmount).toBe("95.00");
    expect(snapshot.totalConsumedKnownCost).toBe("5.00");
    expect(snapshot.unallocatedContribution).toBe("0.00");
  });

  it("keeps known blocked costs visible without counting them as consumed", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      costTaxConstraints: [
        {
          assetId: EQUITY_ID,
          transactionCost: Money.fromDecimal("40.00", "BRL"),
          estimatedTaxImpact: Money.fromDecimal("10.00", "BRL"),
        },
      ],
    });
    const equity = decision(snapshot, "EQUITY");

    expect(equity.totalKnownCost).toBe("50.00");
    expect(equity.consumedKnownCost).toBe("0.00");
    expect(equity.investableAmount).toBe("0.00");
    expect(equity.status).toBe("BLOCKED_KNOWN_COSTS");
    expect(equity.reasonCodes).toEqual(["KNOWN_COSTS_BLOCKED_DESTINATION"]);
    expect(snapshot.totalInvestableAmount).toBe("50.00");
    expect(snapshot.totalConsumedKnownCost).toBe("0.00");
    expect(snapshot.cashRemainder.afterExecution).toBe("0.00");
    expect(snapshot.cashRemainder.afterCosts).toBe("50.00");
    expect(snapshot.unallocatedContribution).toBe("50.00");
  });

  it("reconciles a combination of concentration and execution blocks", () => {
    const input = baseInput();
    const snapshot = buildContributionRecommendationSnapshot({
      ...input,
      concentrationLimits: [
        { assetClass: "EQUITY", softMaxWeight: "35", hardMaxWeight: "40" },
      ],
      executionDestinations: input.executionDestinations.map((destination) =>
        destination.assetClass === "EQUITY" ? { ...destination, isEligible: false } : destination,
      ),
    });

    expect(snapshot.totalInvestableAmount).toBe("50.00");
    expect(snapshot.totalConsumedKnownCost).toBe("0.00");
    expect(snapshot.unallocatedContribution).toBe("50.00");
    expect(snapshot.cashRemainder).toEqual({
      afterAllocator: "0.00",
      afterPolicy: "0.00",
      afterConcentration: "20.00",
      afterExecution: "50.00",
      afterCosts: "50.00",
    });
  });

  it("propagates typed errors from internal layers without generic wrapping", () => {
    const input = baseInput();

    expect(() =>
      buildContributionRecommendationSnapshot({
        ...input,
        allocation: { ...input.allocation, targetAllocation: target(OTHER_PORTFOLIO_ID) },
      }),
    ).toThrow(ContributionAllocatorPortfolioMismatchError);
  });

  it.each(["", " portfolio-engine/1", "portfolio-engine/1 "])(
    "rejects a non-canonical methodology version: %j",
    (methodologyVersion) => {
      expect(() =>
        buildContributionRecommendationSnapshot({ ...baseInput(), methodologyVersion }),
      ).toThrow(InvalidContributionMethodologyVersionError);
    },
  );

  it("returns deeply frozen, serializable and deterministic snapshot structures", () => {
    const input = baseInput();
    const first = buildContributionRecommendationSnapshot(input);
    const second = buildContributionRecommendationSnapshot(input);

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(() => JSON.stringify(first)).not.toThrow();
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.policy)).toBe(true);
    expect(Object.isFrozen(first.cashRemainder)).toBe(true);
    expect(Object.isFrozen(first.decisions)).toBe(true);
    expect(
      first.decisions.every((item) => Object.isFrozen(item) && Object.isFrozen(item.reasonCodes)),
    ).toBe(true);
  });
});
