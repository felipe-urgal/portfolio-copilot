import { describe, expect, it } from "vitest";

import { type ContributionRecommendationSnapshot } from "@portfolio-copilot/domain";

import { createContributionRecommendationExplanation } from "./contribution-recommendation-explanation";

type Decision = ContributionRecommendationSnapshot["decisions"][number];

const BASE_DECISION: Decision = {
  assetClass: "EQUITY",
  assetId: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
  targetWeightPercent: "50.0000",
  currentValue: "500.00",
  postContributionTargetValue: "600.00",
  postContributionNeed: "100.00",
  baselineAllocatedAmount: "100.00",
  policyAllocatedAmount: "100.00",
  concentrationAllocatedAmount: "100.00",
  concentrationBlockedAmount: "0.00",
  softMaxWeightPercent: null,
  hardMaxWeightPercent: null,
  executionEligible: true,
  minimumTradableQuantity: "1.000000000000",
  transactionCost: "0.00",
  estimatedTaxImpact: "0.00",
  totalKnownCost: "0.00",
  consumedKnownCost: "0.00",
  investableAmount: "100.00",
  status: "EXECUTABLE",
  reasonCodes: [],
};

function decision(overrides: Partial<Decision>): Decision {
  return { ...BASE_DECISION, ...overrides };
}

const snapshot: ContributionRecommendationSnapshot = {
  methodologyVersion: "local-mvp-v1",
  portfolioId: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  currency: "BRL",
  portfolioValue: "1000.00",
  contribution: "200.00",
  postContributionValue: "1200.00",
  policy: {
    minimumMeaningfulContribution: "10.00",
    maxDestinationsPerContribution: 4,
  },
  cashRemainder: {
    afterAllocator: "0.00",
    afterPolicy: "20.00",
    afterConcentration: "40.00",
    afterExecution: "80.00",
    afterCosts: "120.00",
  },
  totalInvestableAmount: "70.00",
  totalConsumedKnownCost: "10.00",
  unallocatedContribution: "120.00",
  decisions: [
    decision({
      assetClass: "EQUITY",
      status: "EXECUTABLE",
      reasonCodes: ["CONTRIBUTION_POLICY_ADJUSTED", "SOFT_CONCENTRATION_LIMIT_EXCEEDED"],
      investableAmount: "70.00",
      totalKnownCost: "10.00",
      consumedKnownCost: "10.00",
    }),
    decision({
      assetClass: "FIXED_INCOME",
      assetId: null,
      status: "NOT_SELECTED_BY_POLICY",
      reasonCodes: ["CONTRIBUTION_POLICY_ADJUSTED"],
      policyAllocatedAmount: "0.00",
      concentrationAllocatedAmount: "0.00",
      investableAmount: "0.00",
    }),
    decision({
      assetClass: "REAL_ESTATE",
      assetId: null,
      status: "BLOCKED_CONCENTRATION_LIMIT",
      reasonCodes: ["HARD_CONCENTRATION_LIMIT_APPLIED"],
      concentrationAllocatedAmount: "0.00",
      investableAmount: "0.00",
    }),
    decision({
      assetClass: "CRYPTO_ASSET",
      status: "BLOCKED_INELIGIBLE",
      reasonCodes: ["EXECUTION_DESTINATION_INELIGIBLE"],
      executionEligible: false,
      investableAmount: "0.00",
    }),
    decision({
      assetClass: "COMMODITY",
      status: "BLOCKED_KNOWN_COSTS",
      reasonCodes: [
        "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
        "HARD_CONCENTRATION_LIMIT_APPLIED",
        "KNOWN_COSTS_BLOCKED_DESTINATION",
      ],
      totalKnownCost: "30.00",
      consumedKnownCost: "0.00",
      investableAmount: "0.00",
    }),
  ],
};

describe("contribution recommendation explanation", () => {
  it("translates every final status explicitly", () => {
    const explanation = createContributionRecommendationExplanation(snapshot);

    expect(explanation.decisions.map((item) => [item.status, item.statusLabel])).toEqual([
      ["EXECUTABLE", "Executável"],
      ["NOT_SELECTED_BY_POLICY", "Fora da política"],
      ["BLOCKED_CONCENTRATION_LIMIT", "Bloqueado por concentração"],
      ["BLOCKED_INELIGIBLE", "Bloqueado por elegibilidade"],
      ["BLOCKED_KNOWN_COSTS", "Bloqueado por custos conhecidos"],
    ]);
  });

  it("translates every reason code and preserves the canonical order from the snapshot", () => {
    const explanation = createContributionRecommendationExplanation(snapshot);
    const reasons = explanation.decisions.flatMap((item) => item.reasons);

    expect(new Set(reasons.map((reason) => reason.code))).toEqual(
      new Set([
        "CONTRIBUTION_POLICY_ADJUSTED",
        "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
        "HARD_CONCENTRATION_LIMIT_APPLIED",
        "EXECUTION_DESTINATION_INELIGIBLE",
        "KNOWN_COSTS_BLOCKED_DESTINATION",
      ]),
    );
    expect(explanation.decisions[4]?.reasons.map((reason) => reason.code)).toEqual([
      "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
      "HARD_CONCENTRATION_LIMIT_APPLIED",
      "KNOWN_COSTS_BLOCKED_DESTINATION",
    ]);
    expect(explanation.decisions[4]?.reasons.map((reason) => reason.title)).toEqual([
      "Alerta de concentração",
      "Limite rígido aplicado",
      "Bloqueio por custos conhecidos",
    ]);
  });

  it("copies reconciliation facts without recalculating them", () => {
    const explanation = createContributionRecommendationExplanation(snapshot);

    expect(explanation).toMatchObject({
      methodologyVersion: "local-mvp-v1",
      currency: "BRL",
      contribution: "200.00",
      totalInvestableAmount: "70.00",
      totalConsumedKnownCost: "10.00",
      unallocatedContribution: "120.00",
    });
  });

  it("does not infer status or causes from monetary differences", () => {
    const altered: ContributionRecommendationSnapshot = {
      ...snapshot,
      decisions: snapshot.decisions.map((item) => ({
        ...item,
        baselineAllocatedAmount: "9999.99",
        policyAllocatedAmount: "0.01",
        concentrationAllocatedAmount: "777.77",
        investableAmount: "333.33",
        totalKnownCost: "222.22",
        consumedKnownCost: "111.11",
      })),
    };

    const originalExplanation = createContributionRecommendationExplanation(snapshot);
    const alteredExplanation = createContributionRecommendationExplanation(altered);

    expect(
      alteredExplanation.decisions.map((item) => ({
        status: item.status,
        statusLabel: item.statusLabel,
        statusDescription: item.statusDescription,
        reasons: item.reasons,
      })),
    ).toEqual(
      originalExplanation.decisions.map((item) => ({
        status: item.status,
        statusLabel: item.statusLabel,
        statusDescription: item.statusDescription,
        reasons: item.reasons,
      })),
    );
  });
});
