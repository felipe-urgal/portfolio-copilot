import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import {
  createContributionConcentrationSnapshot,
  createInitialContributionConcentrationDraft,
  type ContributionConcentrationSnapshot,
} from "./contribution-concentration-form";
import {
  createContributionExecutionSnapshot,
  createInitialContributionExecutionDraft,
  type ContributionExecutionDraft,
} from "./contribution-execution-form";
import {
  createContributionPolicySnapshot,
  type ContributionPolicySnapshot,
} from "./contribution-policy-form";
import { type LocalAssetSnapshot } from "./local-asset-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const EQUITY_ASSET: LocalAssetSnapshot = {
  id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
  name: "ETF global",
  assetClass: "EQUITY",
  instrumentType: "ETF",
  referenceCurrency: "USD",
};

const FIXED_INCOME_ASSET: LocalAssetSnapshot = {
  id: "9f0b2c1d-37aa-4b16-8f62-a0a9e5ef1e2a",
  name: "Tesouro IPCA",
  assetClass: "FIXED_INCOME",
  instrumentType: "FIXED_INCOME_INSTRUMENT",
  referenceCurrency: "BRL",
};

const ASSETS = [EQUITY_ASSET, FIXED_INCOME_ASSET] as const;

function baselineFrom(draft: ContributionBaselineDraft): ContributionBaselineSnapshot {
  const result = createContributionBaselineSnapshot(draft, PORTFOLIO);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected valid baseline");
  return result.snapshot;
}

function policyFrom(baseline: ContributionBaselineSnapshot): ContributionPolicySnapshot {
  const result = createContributionPolicySnapshot(
    { minimumMeaningfulContribution: "0", maxDestinationsPerContribution: "2" },
    baseline,
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected valid policy");
  return result.snapshot;
}

function concentrationFrom(
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
): ContributionConcentrationSnapshot {
  const result = createContributionConcentrationSnapshot(
    createInitialContributionConcentrationDraft(policy),
    baseline,
    policy,
  );
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error("Expected valid concentration plan");
  return result.snapshot;
}

const BASELINE = baselineFrom({
  portfolioValue: "1000",
  contribution: "200",
  rows: [
    { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
    { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
  ],
});
const POLICY = policyFrom(BASELINE);
const CONCENTRATION = concentrationFrom(BASELINE, POLICY);

function validDraft(): ContributionExecutionDraft {
  return {
    destinations: [
      {
        assetClass: "EQUITY",
        assetId: EQUITY_ASSET.id,
        isEligible: true,
        minimumTradableQuantity: "0,5",
      },
      {
        assetClass: "FIXED_INCOME",
        assetId: FIXED_INCOME_ASSET.id,
        isEligible: true,
        minimumTradableQuantity: "1",
      },
    ],
  };
}

describe("contribution execution form adapter", () => {
  it("creates empty destination rows only for positive post-concentration allocations", () => {
    expect(createInitialContributionExecutionDraft(CONCENTRATION)).toEqual({
      destinations: [
        {
          assetClass: "EQUITY",
          assetId: "",
          isEligible: null,
          minimumTradableQuantity: "",
        },
        {
          assetClass: "FIXED_INCOME",
          assetId: "",
          isEligible: null,
          minimumTradableQuantity: "",
        },
      ],
    });

    const zeroBaseline = baselineFrom({
      portfolioValue: "1000",
      contribution: "0",
      rows: [
        { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
        { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
      ],
    });
    const zeroPolicy = policyFrom(zeroBaseline);

    expect(
      createInitialContributionExecutionDraft(concentrationFrom(zeroBaseline, zeroPolicy)),
    ).toEqual({ destinations: [] });
  });

  it("removes a hard-blocked class before execution destinations are created", () => {
    const concentrationDraft = createInitialContributionConcentrationDraft(POLICY);
    const result = createContributionConcentrationSnapshot(
      {
        rows: concentrationDraft.rows.map((row) =>
          row.assetClass === "EQUITY"
            ? { ...row, enabled: true, softMaxWeight: "45", hardMaxWeight: "50" }
            : row,
        ),
      },
      BASELINE,
      POLICY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(createInitialContributionExecutionDraft(result.snapshot)).toEqual({
      destinations: [
        {
          assetClass: "FIXED_INCOME",
          assetId: "",
          isEligible: null,
          minimumTradableQuantity: "",
        },
      ],
    });
  });

  it("preserves eligible post-concentration amounts and normalizes minimum quantities without price", () => {
    const result = createContributionExecutionSnapshot(
      validDraft(),
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        destinations: [
          {
            assetClass: "EQUITY",
            assetId: EQUITY_ASSET.id,
            isEligible: true,
            minimumTradableQuantity: "0.500000000000",
            concentrationAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
            executionAllocatedAmount: { currency: "BRL", minorUnits: "12000" },
            status: "EXECUTABLE",
          },
          {
            assetClass: "FIXED_INCOME",
            assetId: FIXED_INCOME_ASSET.id,
            isEligible: true,
            minimumTradableQuantity: "1.000000000000",
            concentrationAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
            executionAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
            status: "EXECUTABLE",
          },
        ],
        unallocatedContribution: { currency: "BRL", minorUnits: "0" },
      },
    });
  });

  it("keeps an ineligible destination blocked and returns its amount to explicit cash remainder", () => {
    const draft = validDraft();
    const result = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "FIXED_INCOME" ? { ...row, isEligible: false } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.destinations[1]).toEqual({
      assetClass: "FIXED_INCOME",
      assetId: FIXED_INCOME_ASSET.id,
      isEligible: false,
      minimumTradableQuantity: "1.000000000000",
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "8000" },
      executionAllocatedAmount: null,
      status: "BLOCKED_INELIGIBLE",
    });
    expect(result.snapshot.unallocatedContribution).toEqual({
      currency: "BRL",
      minorUnits: "8000",
    });
  });

  it("translates the domain missing-destination error to the affected class", () => {
    const draft = validDraft();
    const result = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "FIXED_INCOME" ? { ...row, assetId: "" } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        destinations: {
          FIXED_INCOME: { assetId: "Selecione um ativo local desta classe." },
        },
      },
    });
  });

  it("requires eligibility explicitly and translates invalid minimum quantity", () => {
    const draft = validDraft();
    const missingEligibility = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "EQUITY" ? { ...row, isEligible: null } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );
    const zeroMinimum = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "EQUITY" ? { ...row, minimumTradableQuantity: "0" } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );
    const invalidMinimum = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "EQUITY" ? { ...row, minimumTradableQuantity: "abc" } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    expect(missingEligibility).toEqual({
      ok: false,
      errors: {
        destinations: {
          EQUITY: { isEligible: "Informe explicitamente se este destino está elegível." },
        },
      },
    });
    const quantityError = {
      ok: false,
      errors: {
        destinations: {
          EQUITY: {
            minimumTradableQuantity:
              "Informe uma quantidade mínima maior que zero e com até 12 casas decimais.",
          },
        },
      },
    } as const;
    expect(zeroMinimum).toEqual(quantityError);
    expect(invalidMinimum).toEqual(quantityError);
  });

  it("rejects a selected id that is absent from the local catalog or belongs to another class", () => {
    const draft = validDraft();
    const unknownAsset = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "EQUITY"
            ? { ...row, assetId: "7744df4d-bb41-4a07-b582-a8d8f710a8af" }
            : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );
    const wrongClass = createContributionExecutionSnapshot(
      {
        destinations: draft.destinations.map((row) =>
          row.assetClass === "EQUITY" ? { ...row, assetId: FIXED_INCOME_ASSET.id } : row,
        ),
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    const expected = {
      ok: false,
      errors: {
        destinations: {
          EQUITY: { assetId: "Selecione um ativo válido desta sessão e da mesma classe." },
        },
      },
    } as const;
    expect(unknownAsset).toEqual(expected);
    expect(wrongClass).toEqual(expected);
  });

  it("translates duplicate destination input without weakening the domain invariant", () => {
    const draft = validDraft();
    const duplicated = createContributionExecutionSnapshot(
      {
        destinations: [draft.destinations[0]!, draft.destinations[0]!, draft.destinations[1]!],
      },
      BASELINE,
      CONCENTRATION,
      ASSETS,
    );

    expect(duplicated).toEqual({
      ok: false,
      errors: {
        form: "Cada classe e cada ativo podem aparecer apenas uma vez como destino de execução.",
      },
    });
  });
});
