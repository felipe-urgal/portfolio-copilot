import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import {
  createContributionCostSnapshot,
  createInitialContributionCostDraft,
  type ContributionCostDraft,
} from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const EQUITY_ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";
const FIXED_INCOME_ASSET_ID = "9f0b2c1d-37aa-4b16-8f62-a0a9e5ef1e2a";

function baseline(): ContributionBaselineSnapshot {
  const draft: ContributionBaselineDraft = {
    portfolioValue: "1000",
    contribution: "200",
    rows: [
      { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
      { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
    ],
  };
  const result = createContributionBaselineSnapshot(draft, PORTFOLIO);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected baseline");
  return result.snapshot;
}

function execution(): ContributionExecutionSnapshot {
  return {
    destinations: [
      {
        assetClass: "EQUITY",
        assetId: EQUITY_ASSET_ID,
        isEligible: true,
        minimumTradableQuantity: "1.000000000000",
        concentrationAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
        executionAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
        status: "EXECUTABLE",
      },
      {
        assetClass: "FIXED_INCOME",
        assetId: FIXED_INCOME_ASSET_ID,
        isEligible: false,
        minimumTradableQuantity: "1.000000000000",
        concentrationAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
        executionAllocatedAmount: null,
        status: "BLOCKED_INELIGIBLE",
      },
    ],
    unallocatedContribution: { currency: "BRL", minorUnits: "8000" },
  };
}

function withEquityCosts(transactionCost: string, estimatedTaxImpact: string): ContributionCostDraft {
  return {
    rows: [
      {
        assetId: EQUITY_ASSET_ID,
        transactionCost,
        estimatedTaxImpact,
      },
    ],
  };
}

describe("contribution cost form adapter", () => {
  it("creates optional cost rows only for executable destinations", () => {
    expect(createInitialContributionCostDraft(execution())).toEqual({
      rows: [
        {
          assetId: EQUITY_ASSET_ID,
          transactionCost: "",
          estimatedTaxImpact: "",
        },
      ],
    });
  });

  it("treats missing configuration as known cost zero and preserves the upstream remainder", () => {
    const result = createContributionCostSnapshot(
      createInitialContributionCostDraft(execution()),
      baseline(),
      execution(),
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        destinations: [
          {
            assetId: EQUITY_ASSET_ID,
            assetClass: "EQUITY",
            grossAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
            transactionCost: { currency: "BRL", minorUnits: "0" },
            estimatedTaxImpact: { currency: "BRL", minorUnits: "0" },
            totalKnownCost: { currency: "BRL", minorUnits: "0" },
            investableAmount: { currency: "BRL", minorUnits: "12000" },
            status: "EXECUTABLE",
          },
        ],
        unallocatedContribution: { currency: "BRL", minorUnits: "8000" },
      },
    });
  });

  it("reduces only investable amount when known costs are below the gross budget", () => {
    const result = createContributionCostSnapshot(
      withEquityCosts("10", "5,50"),
      baseline(),
      execution(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.destinations[0]).toMatchObject({
      grossAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
      transactionCost: { currency: "BRL", minorUnits: "1000" },
      estimatedTaxImpact: { currency: "BRL", minorUnits: "550" },
      totalKnownCost: { currency: "BRL", minorUnits: "1550" },
      investableAmount: { currency: "BRL", minorUnits: "10450" },
      status: "EXECUTABLE",
    });
    expect(result.snapshot.unallocatedContribution).toEqual({ currency: "BRL", minorUnits: "8000" });
  });

  it("blocks a destination when known costs equal its gross budget and returns the full budget to remainder", () => {
    const result = createContributionCostSnapshot(
      withEquityCosts("100", "20"),
      baseline(),
      execution(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.destinations[0]).toMatchObject({
      totalKnownCost: { currency: "BRL", minorUnits: "12000" },
      investableAmount: { currency: "BRL", minorUnits: "0" },
      status: "BLOCKED_KNOWN_COSTS",
    });
    expect(result.snapshot.unallocatedContribution).toEqual({ currency: "BRL", minorUnits: "20000" });
  });

  it("also blocks when known costs exceed the gross budget without debiting hypothetical costs", () => {
    const result = createContributionCostSnapshot(
      withEquityCosts("121", "1"),
      baseline(),
      execution(),
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.destinations[0]?.investableAmount).toEqual({
      currency: "BRL",
      minorUnits: "0",
    });
    expect(result.snapshot.destinations[0]?.status).toBe("BLOCKED_KNOWN_COSTS");
    expect(result.snapshot.unallocatedContribution).toEqual({ currency: "BRL", minorUnits: "20000" });
  });

  it("translates malformed and negative values to the affected field", () => {
    const malformed = createContributionCostSnapshot(
      withEquityCosts("abc", ""),
      baseline(),
      execution(),
    );
    const negative = createContributionCostSnapshot(
      withEquityCosts("", "-1"),
      baseline(),
      execution(),
    );

    expect(malformed).toEqual({
      ok: false,
      errors: {
        rows: {
          [EQUITY_ASSET_ID]: {
            transactionCost: "Informe um valor monetário válido ou deixe em branco para zero.",
          },
        },
      },
    });
    expect(negative).toEqual({
      ok: false,
      errors: {
        rows: {
          [EQUITY_ASSET_ID]: {
            estimatedTaxImpact: "O valor informado não pode ser negativo.",
          },
        },
      },
    });
  });

  it("rejects cost input for an asset that is not an executable destination", () => {
    const unknownAssetId = "7744df4d-bb41-4a07-b582-a8d8f710a8af";
    const result = createContributionCostSnapshot(
      {
        rows: [{ assetId: unknownAssetId, transactionCost: "1", estimatedTaxImpact: "" }],
      },
      baseline(),
      execution(),
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        rows: {
          [unknownAssetId]: {
            transactionCost: "A configuração referencia um destino que não está executável.",
          },
        },
      },
    });
  });

  it("keeps duplicate cost configuration delegated to the domain invariant", () => {
    const row = {
      assetId: EQUITY_ASSET_ID,
      transactionCost: "1",
      estimatedTaxImpact: "",
    } as const;
    const result = createContributionCostSnapshot(
      { rows: [row, row] },
      baseline(),
      execution(),
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        form: "Cada destino executável pode ter no máximo uma configuração de custos.",
      },
    });
  });
});
