import { describe, expect, it } from "vitest";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { type ContributionCostSnapshot } from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import {
  createContributionRecommendationSnapshot,
  createInitialContributionRecommendationDraft,
} from "./contribution-recommendation-form";

const PORTFOLIO_ID = "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298";
const EQUITY_ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";
const FIXED_INCOME_ASSET_ID = "9f0b2c1d-37aa-4b16-8f62-a0a9e5ef1e2a";

const baseline: ContributionBaselineSnapshot = {
  targetAllocation: {
    portfolioId: PORTFOLIO_ID,
    buckets: [
      { assetClass: "EQUITY", targetWeightPercent: "60" },
      { assetClass: "FIXED_INCOME", targetWeightPercent: "40" },
    ],
  },
  portfolioValue: { currency: "BRL", minorUnits: "100000" },
  contribution: { currency: "BRL", minorUnits: "20000" },
  postContributionValue: { currency: "BRL", minorUnits: "120000" },
  allocations: [
    {
      assetClass: "EQUITY",
      targetWeightPercent: "60",
      currentValue: { currency: "BRL", minorUnits: "60000" },
      postContributionTargetValue: { currency: "BRL", minorUnits: "72000" },
      postContributionNeed: { currency: "BRL", minorUnits: "12000" },
      allocatedAmount: { currency: "BRL", minorUnits: "12000" },
    },
    {
      assetClass: "FIXED_INCOME",
      targetWeightPercent: "40",
      currentValue: { currency: "BRL", minorUnits: "40000" },
      postContributionTargetValue: { currency: "BRL", minorUnits: "48000" },
      postContributionNeed: { currency: "BRL", minorUnits: "8000" },
      allocatedAmount: { currency: "BRL", minorUnits: "8000" },
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const policy: ContributionPolicySnapshot = {
  minimumMeaningfulContribution: { currency: "BRL", minorUnits: "0" },
  maxDestinationsPerContribution: 2,
  allocations: [
    {
      assetClass: "EQUITY",
      baselineAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
      policyAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
      status: "KEPT",
    },
    {
      assetClass: "FIXED_INCOME",
      baselineAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      policyAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      status: "KEPT",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const concentration: ContributionConcentrationSnapshot = {
  allocations: [
    {
      assetClass: "EQUITY",
      policyAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "6000" },
      softMaxWeightPercent: "50",
      hardMaxWeightPercent: "55",
      softLimitExceeded: true,
      hardLimitApplied: true,
      blockedAmount: { currency: "BRL", minorUnits: "6000" },
      status: "HARD_LIMITED",
    },
    {
      assetClass: "FIXED_INCOME",
      policyAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      softMaxWeightPercent: null,
      hardMaxWeightPercent: null,
      softLimitExceeded: false,
      hardLimitApplied: false,
      blockedAmount: { currency: "BRL", minorUnits: "0" },
      status: "NO_LIMIT",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "6000" },
};

const execution: ContributionExecutionSnapshot = {
  destinations: [
    {
      assetClass: "EQUITY",
      assetId: EQUITY_ASSET_ID,
      isEligible: true,
      minimumTradableQuantity: "1.000000000000",
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "6000" },
      executionAllocatedAmount: { currency: "BRL", minorUnits: "6000" },
      status: "EXECUTABLE",
    },
    {
      assetClass: "FIXED_INCOME",
      assetId: FIXED_INCOME_ASSET_ID,
      isEligible: true,
      minimumTradableQuantity: "1.000000000000",
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      executionAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      status: "EXECUTABLE",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "6000" },
};

const cost: ContributionCostSnapshot = {
  destinations: [
    {
      assetId: EQUITY_ASSET_ID,
      assetClass: "EQUITY",
      grossAllocatedAmount: { currency: "BRL", minorUnits: "6000" },
      transactionCost: { currency: "BRL", minorUnits: "6000" },
      estimatedTaxImpact: { currency: "BRL", minorUnits: "0" },
      totalKnownCost: { currency: "BRL", minorUnits: "6000" },
      investableAmount: { currency: "BRL", minorUnits: "0" },
      status: "BLOCKED_KNOWN_COSTS",
    },
    {
      assetId: FIXED_INCOME_ASSET_ID,
      assetClass: "FIXED_INCOME",
      grossAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      transactionCost: { currency: "BRL", minorUnits: "0" },
      estimatedTaxImpact: { currency: "BRL", minorUnits: "0" },
      totalKnownCost: { currency: "BRL", minorUnits: "0" },
      investableAmount: { currency: "BRL", minorUnits: "8000" },
      status: "EXECUTABLE",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "12000" },
};

describe("contribution recommendation form adapter", () => {
  it("starts without inventing a methodology version", () => {
    expect(createInitialContributionRecommendationDraft()).toEqual({ methodologyVersion: "" });
  });

  it("delegates the full canonical pipeline to the domain and preserves reconciliation", () => {
    const result = createContributionRecommendationSnapshot(
      { methodologyVersion: "local-mvp-v1" },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot).toMatchObject({
      methodologyVersion: "local-mvp-v1",
      portfolioId: PORTFOLIO_ID,
      currency: "BRL",
      contribution: "200.00",
      cashRemainder: {
        afterAllocator: "0.00",
        afterPolicy: "0.00",
        afterConcentration: "60.00",
        afterExecution: "60.00",
        afterCosts: "120.00",
      },
      totalInvestableAmount: "80.00",
      totalConsumedKnownCost: "0.00",
      unallocatedContribution: "120.00",
    });

    expect(result.snapshot.decisions).toHaveLength(2);
    expect(result.snapshot.decisions[0]).toMatchObject({
      assetClass: "EQUITY",
      assetId: EQUITY_ASSET_ID,
      baselineAllocatedAmount: "120.00",
      policyAllocatedAmount: "120.00",
      concentrationAllocatedAmount: "60.00",
      concentrationBlockedAmount: "60.00",
      transactionCost: "60.00",
      totalKnownCost: "60.00",
      consumedKnownCost: "0.00",
      investableAmount: "0.00",
      status: "BLOCKED_KNOWN_COSTS",
      reasonCodes: [
        "SOFT_CONCENTRATION_LIMIT_EXCEEDED",
        "HARD_CONCENTRATION_LIMIT_APPLIED",
        "KNOWN_COSTS_BLOCKED_DESTINATION",
      ],
    });
    expect(result.snapshot.decisions[1]).toMatchObject({
      assetClass: "FIXED_INCOME",
      assetId: FIXED_INCOME_ASSET_ID,
      investableAmount: "80.00",
      status: "EXECUTABLE",
      reasonCodes: [],
    });
  });

  it("is deterministic for the same validated local inputs", () => {
    const first = createContributionRecommendationSnapshot(
      { methodologyVersion: "local-mvp-v1" },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );
    const second = createContributionRecommendationSnapshot(
      { methodologyVersion: "local-mvp-v1" },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );

    expect(first).toEqual(second);
  });

  it("recomputes the pipeline instead of trusting intermediate outcome amounts", () => {
    const tamperedBaseline: ContributionBaselineSnapshot = {
      ...baseline,
      postContributionValue: { currency: "BRL", minorUnits: "999999" },
      allocations: baseline.allocations.map((allocation) => ({
        ...allocation,
        postContributionTargetValue: { currency: "BRL", minorUnits: "999999" },
        postContributionNeed: { currency: "BRL", minorUnits: "999999" },
        allocatedAmount: { currency: "BRL", minorUnits: "999999" },
      })),
      unallocatedContribution: { currency: "BRL", minorUnits: "999999" },
    };
    const tamperedPolicy: ContributionPolicySnapshot = {
      ...policy,
      allocations: policy.allocations.map((allocation) => ({
        ...allocation,
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
      })),
      unallocatedContribution: { currency: "BRL", minorUnits: "999999" },
    };
    const tamperedConcentration: ContributionConcentrationSnapshot = {
      ...concentration,
      allocations: concentration.allocations.map((allocation) => ({
        ...allocation,
        policyAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
        concentrationAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
        blockedAmount: { currency: "BRL", minorUnits: "999999" },
      })),
      unallocatedContribution: { currency: "BRL", minorUnits: "999999" },
    };
    const tamperedExecution: ContributionExecutionSnapshot = {
      ...execution,
      destinations: execution.destinations.map((destination) => ({
        ...destination,
        concentrationAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
        executionAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
      })),
      unallocatedContribution: { currency: "BRL", minorUnits: "999999" },
    };
    const tamperedCost: ContributionCostSnapshot = {
      ...cost,
      destinations: cost.destinations.map((destination) => ({
        ...destination,
        grossAllocatedAmount: { currency: "BRL", minorUnits: "999999" },
        totalKnownCost: { currency: "BRL", minorUnits: "999999" },
        investableAmount: { currency: "BRL", minorUnits: "999999" },
      })),
      unallocatedContribution: { currency: "BRL", minorUnits: "999999" },
    };

    const expected = createContributionRecommendationSnapshot(
      { methodologyVersion: "local-mvp-v1" },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );
    const result = createContributionRecommendationSnapshot(
      { methodologyVersion: "local-mvp-v1" },
      tamperedBaseline,
      tamperedPolicy,
      tamperedConcentration,
      tamperedExecution,
      tamperedCost,
    );

    expect(result).toEqual(expected);
  });

  it("translates invalid methodology version without normalizing it silently", () => {
    const blank = createContributionRecommendationSnapshot(
      { methodologyVersion: "" },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );
    const padded = createContributionRecommendationSnapshot(
      { methodologyVersion: " local-mvp-v1 " },
      baseline,
      policy,
      concentration,
      execution,
      cost,
    );
    const expected = {
      ok: false,
      errors: {
        methodologyVersion:
          "Informe uma versão explícita, não vazia e sem espaços no início ou no fim.",
      },
    } as const;

    expect(blank).toEqual(expected);
    expect(padded).toEqual(expected);
  });
});
