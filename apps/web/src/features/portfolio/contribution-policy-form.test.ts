import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import {
  createContributionPolicySnapshot,
  createInitialContributionPolicyDraft,
} from "./contribution-policy-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

function baselineFrom(draft: ContributionBaselineDraft): ContributionBaselineSnapshot {
  const result = createContributionBaselineSnapshot(draft, PORTFOLIO);

  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected a valid contribution baseline");

  return result.snapshot;
}

const TWO_CLASS_BASELINE = baselineFrom({
  portfolioValue: "1000",
  contribution: "200",
  rows: [
    { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
    { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
  ],
});

const REDISTRIBUTION_BASELINE = baselineFrom({
  portfolioValue: "1000",
  contribution: "100",
  rows: [
    { assetClass: "EQUITY", targetWeight: "40", currentValue: "350" },
    { assetClass: "FIXED_INCOME", targetWeight: "30", currentValue: "350" },
    { assetClass: "CRYPTO", targetWeight: "30", currentValue: "300" },
  ],
});

describe("contribution policy form adapter", () => {
  it("starts with no invented policy values", () => {
    expect(createInitialContributionPolicyDraft()).toEqual({
      minimumMeaningfulContribution: "",
      maxDestinationsPerContribution: "",
    });
  });

  it("preserves the allocator baseline with zero minimum and a broad destination limit", () => {
    const result = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "0",
        maxDestinationsPerContribution: "7",
      },
      TWO_CLASS_BASELINE,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        minimumMeaningfulContribution: { currency: "BRL", minorUnits: "0" },
        maxDestinationsPerContribution: 7,
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
      },
    });
  });

  it("limits destinations using the domain priority and keeps the remainder explicit", () => {
    const result = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "0",
        maxDestinationsPerContribution: "1",
      },
      TWO_CLASS_BASELINE,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.allocations).toEqual([
      {
        assetClass: "EQUITY",
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
        status: "KEPT",
      },
      {
        assetClass: "FIXED_INCOME",
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "0" },
        status: "REMOVED",
      },
    ]);
    expect(result.snapshot.unallocatedContribution).toEqual({
      currency: "BRL",
      minorUnits: "8000",
    });
  });

  it("lets the domain remove microallocations and redistribute only among remaining classes", () => {
    const result = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "30",
        maxDestinationsPerContribution: "7",
      },
      REDISTRIBUTION_BASELINE,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.allocations).toEqual([
      {
        assetClass: "CRYPTO",
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "2500" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "0" },
        status: "REMOVED",
      },
      {
        assetClass: "EQUITY",
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "7500" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "9000" },
        status: "KEPT",
      },
      {
        assetClass: "FIXED_INCOME",
        baselineAllocatedAmount: { currency: "BRL", minorUnits: "0" },
        policyAllocatedAmount: { currency: "BRL", minorUnits: "0" },
        status: "NO_BASELINE",
      },
    ]);
    expect(result.snapshot.unallocatedContribution).toEqual({
      currency: "BRL",
      minorUnits: "1000",
    });
  });

  it("translates invalid minimum and destination-limit configurations", () => {
    const invalidMinimum = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "abc",
        maxDestinationsPerContribution: "2",
      },
      TWO_CLASS_BASELINE,
    );
    const negativeMinimum = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "-1",
        maxDestinationsPerContribution: "2",
      },
      TWO_CLASS_BASELINE,
    );
    const zeroLimit = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "0",
        maxDestinationsPerContribution: "0",
      },
      TWO_CLASS_BASELINE,
    );
    const fractionalLimit = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "0",
        maxDestinationsPerContribution: "1.5",
      },
      TWO_CLASS_BASELINE,
    );

    expect(invalidMinimum).toEqual({
      ok: false,
      errors: { minimumMeaningfulContribution: "Informe um valor monetário válido para o mínimo significativo." },
    });
    expect(negativeMinimum).toEqual({
      ok: false,
      errors: { minimumMeaningfulContribution: "O mínimo significativo não pode ser negativo." },
    });
    expect(zeroLimit).toEqual({
      ok: false,
      errors: { maxDestinationsPerContribution: "Informe um inteiro positivo seguro para o limite de destinos." },
    });
    expect(fractionalLimit).toEqual(zeroLimit);
  });
});
