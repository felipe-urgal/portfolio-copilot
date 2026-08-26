import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  createInitialContributionBaselineDraft,
  normalizeContributionDecimal,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

function draftWith(
  overrides: Partial<Pick<ContributionBaselineDraft, "portfolioValue" | "contribution">> = {},
): ContributionBaselineDraft {
  return {
    ...createInitialContributionBaselineDraft(),
    portfolioValue: overrides.portfolioValue ?? "1000",
    contribution: overrides.contribution ?? "200",
    rows: [
      { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
      { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
    ],
  };
}

describe("contribution baseline form adapter", () => {
  it("creates an empty local draft for every domain asset class", () => {
    const draft = createInitialContributionBaselineDraft();

    expect(draft.portfolioValue).toBe("");
    expect(draft.contribution).toBe("");
    expect(draft.rows).toHaveLength(7);
    expect(draft.rows.every((row) => row.targetWeight === "" && row.currentValue === "")).toBe(
      true,
    );
  });

  it("normalizes decimal comma without converting through number", () => {
    expect(normalizeContributionDecimal(" 12,50 ")).toBe("12.50");
    expect(normalizeContributionDecimal("12.50")).toBe("12.50");
    expect(normalizeContributionDecimal("1,2,3")).toBe("1.2,3");
  });

  it("creates TargetAllocation and the deterministic contribution baseline", () => {
    const result = createContributionBaselineSnapshot(draftWith(), PORTFOLIO);

    expect(result).toEqual({
      ok: true,
      snapshot: {
        targetAllocation: {
          portfolioId: PORTFOLIO.id,
          buckets: [
            { assetClass: "EQUITY", targetWeightPercent: "60.0000" },
            { assetClass: "FIXED_INCOME", targetWeightPercent: "40.0000" },
          ],
        },
        portfolioValue: { currency: "BRL", minorUnits: "100000" },
        contribution: { currency: "BRL", minorUnits: "20000" },
        postContributionValue: { currency: "BRL", minorUnits: "120000" },
        allocations: [
          {
            assetClass: "EQUITY",
            targetWeightPercent: "60.0000",
            currentValue: { currency: "BRL", minorUnits: "60000" },
            postContributionTargetValue: { currency: "BRL", minorUnits: "72000" },
            postContributionNeed: { currency: "BRL", minorUnits: "12000" },
            allocatedAmount: { currency: "BRL", minorUnits: "12000" },
          },
          {
            assetClass: "FIXED_INCOME",
            targetWeightPercent: "40.0000",
            currentValue: { currency: "BRL", minorUnits: "40000" },
            postContributionTargetValue: { currency: "BRL", minorUnits: "48000" },
            postContributionNeed: { currency: "BRL", minorUnits: "8000" },
            allocatedAmount: { currency: "BRL", minorUnits: "8000" },
          },
        ],
        unallocatedContribution: { currency: "BRL", minorUnits: "0" },
      },
    });
  });

  it("propagates the portfolio reference currency through every Money value", () => {
    const result = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "250,50",
        rows: [{ assetClass: "EQUITY", targetWeight: "100", currentValue: "1000" }],
      },
      { ...PORTFOLIO, referenceCurrency: "USD" },
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.portfolioValue).toEqual({ currency: "USD", minorUnits: "100000" });
    expect(result.snapshot.contribution).toEqual({ currency: "USD", minorUnits: "25050" });
    expect(result.snapshot.postContributionValue).toEqual({
      currency: "USD",
      minorUnits: "125050",
    });
    expect(result.snapshot.allocations[0]?.currentValue.currency).toBe("USD");
    expect(result.snapshot.allocations[0]?.allocatedAmount.currency).toBe("USD");
    expect(result.snapshot.unallocatedContribution.currency).toBe("USD");
  });

  it("accepts a zero contribution without inventing a destination", () => {
    const result = createContributionBaselineSnapshot(draftWith({ contribution: "0" }), PORTFOLIO);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.snapshot.contribution.minorUnits).toBe("0");
    expect(
      result.snapshot.allocations.map((allocation) => allocation.allocatedAmount.minorUnits),
    ).toEqual(["0", "0"]);
    expect(result.snapshot.unallocatedContribution.minorUnits).toBe("0");
  });

  it("delegates invalid target totals, zero weights and duplicates to TargetAllocation", () => {
    const invalidTotal = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "100",
        rows: [
          { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
          { assetClass: "FIXED_INCOME", targetWeight: "30", currentValue: "400" },
        ],
      },
      PORTFOLIO,
    );
    const zeroWeight = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "100",
        rows: [
          { assetClass: "EQUITY", targetWeight: "0", currentValue: "600" },
          { assetClass: "FIXED_INCOME", targetWeight: "100", currentValue: "400" },
        ],
      },
      PORTFOLIO,
    );
    const duplicate = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "100",
        rows: [
          { assetClass: "EQUITY", targetWeight: "50", currentValue: "500" },
          { assetClass: "EQUITY", targetWeight: "50", currentValue: "500" },
        ],
      },
      PORTFOLIO,
    );

    expect(invalidTotal).toEqual({
      ok: false,
      errors: {
        targetAllocation: "A soma dos pesos-alvo deve ser exatamente 100% (atual: 90.0000%).",
      },
    });
    expect(zeroWeight).toEqual({
      ok: false,
      errors: { targetAllocation: "Pesos-alvo preenchidos precisam ser maiores que zero." },
    });
    expect(duplicate).toEqual({
      ok: false,
      errors: {
        targetAllocation: "A mesma classe econômica não pode aparecer duas vezes no alvo.",
      },
    });
  });

  it("translates monetary format, negative values and reconciliation failures", () => {
    const invalidPortfolioValue = createContributionBaselineSnapshot(
      draftWith({ portfolioValue: "abc" }),
      PORTFOLIO,
    );
    const negativeContribution = createContributionBaselineSnapshot(
      draftWith({ contribution: "-10" }),
      PORTFOLIO,
    );
    const negativeCurrentValue = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "100",
        rows: [
          { assetClass: "EQUITY", targetWeight: "100", currentValue: "-100" },
          { assetClass: "FIXED_INCOME", targetWeight: "", currentValue: "1100" },
        ],
      },
      PORTFOLIO,
    );
    const mismatch = createContributionBaselineSnapshot(
      {
        portfolioValue: "1000",
        contribution: "100",
        rows: [{ assetClass: "EQUITY", targetWeight: "100", currentValue: "900" }],
      },
      PORTFOLIO,
    );

    expect(invalidPortfolioValue).toEqual({
      ok: false,
      errors: { portfolioValue: "Informe o valor total atual como valor monetário válido." },
    });
    expect(negativeContribution).toEqual({
      ok: false,
      errors: { contribution: "O aporte não pode ser negativo." },
    });
    expect(negativeCurrentValue).toEqual({
      ok: false,
      errors: { currentValues: "Valores atuais por classe não podem ser negativos." },
    });
    expect(mismatch).toEqual({
      ok: false,
      errors: {
        currentValues:
          "Os valores atuais somam 900.00 BRL, mas o valor total informado é 1000.00 BRL.",
      },
    });
  });
});
