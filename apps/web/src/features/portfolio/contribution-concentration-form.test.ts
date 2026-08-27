import { Money, type MoneySnapshot } from "@portfolio-copilot/domain";
import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";
import {
  createContributionConcentrationSnapshot,
  createInitialContributionConcentrationDraft,
  type ContributionConcentrationDraft,
} from "./contribution-concentration-form";
import { createContributionPolicySnapshot } from "./contribution-policy-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

function moneyValue(snapshot: MoneySnapshot | undefined): string | undefined {
  return snapshot === undefined ? undefined : Money.fromSnapshot(snapshot).toDecimalString();
}

function createUpstream(
  draft: ContributionBaselineDraft = {
    portfolioValue: "90",
    contribution: "10",
    rows: [
      { assetClass: "EQUITY", targetWeight: "60", currentValue: "50" },
      { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "40" },
    ],
  },
) {
  const baselineResult = createContributionBaselineSnapshot(draft, PORTFOLIO);
  expect(baselineResult.ok).toBe(true);
  if (!baselineResult.ok) throw new Error("Expected baseline");

  const policyResult = createContributionPolicySnapshot(
    { minimumMeaningfulContribution: "0", maxDestinationsPerContribution: "2" },
    baselineResult.snapshot,
  );
  expect(policyResult.ok).toBe(true);
  if (!policyResult.ok) throw new Error("Expected policy");

  return { baseline: baselineResult.snapshot, policy: policyResult.snapshot };
}

function withEquityLimit(
  draft: ContributionConcentrationDraft,
  softMaxWeight: string,
  hardMaxWeight: string,
): ContributionConcentrationDraft {
  return {
    rows: draft.rows.map((row) =>
      row.assetClass === "EQUITY" ? { ...row, enabled: true, softMaxWeight, hardMaxWeight } : row,
    ),
  };
}

describe("contribution concentration form adapter", () => {
  it("starts with every class explicitly unconfigured", () => {
    const { policy } = createUpstream();
    const draft = createInitialContributionConcentrationDraft(policy);

    expect(draft.rows.length).toBe(policy.allocations.length);
    expect(draft.rows.every((row) => !row.enabled)).toBe(true);
    expect(draft.rows.every((row) => row.softMaxWeight === "" && row.hardMaxWeight === "")).toBe(
      true,
    );
  });

  it("preserves post-policy allocations exactly when no limit is configured", () => {
    const { baseline, policy } = createUpstream();
    const result = createContributionConcentrationSnapshot(
      createInitialContributionConcentrationDraft(policy),
      baseline,
      policy,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const equity = result.snapshot.allocations.find((row) => row.assetClass === "EQUITY");
    expect(moneyValue(equity?.policyAllocatedAmount)).toBe("10.00");
    expect(moneyValue(equity?.concentrationAllocatedAmount)).toBe("10.00");
    expect(moneyValue(equity?.blockedAmount)).toBe("0.00");
    expect(equity?.status).toBe("NO_LIMIT");
    expect(moneyValue(result.snapshot.unallocatedContribution)).toBe("0.00");
  });

  it("surfaces the soft limit as alert-only without reducing allocation", () => {
    const { baseline, policy } = createUpstream();
    const draft = withEquityLimit(createInitialContributionConcentrationDraft(policy), "55", "70");
    const result = createContributionConcentrationSnapshot(draft, baseline, policy);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const equity = result.snapshot.allocations.find((row) => row.assetClass === "EQUITY");
    expect(equity?.softMaxWeightPercent).toBe("55.0000");
    expect(equity?.hardMaxWeightPercent).toBe("70.0000");
    expect(equity?.softLimitExceeded).toBe(true);
    expect(equity?.hardLimitApplied).toBe(false);
    expect(moneyValue(equity?.concentrationAllocatedAmount)).toBe("10.00");
    expect(equity?.status).toBe("SOFT_ALERT");
  });

  it("keeps blocked hard-limit value explicit and adds it to the upstream remainder", () => {
    const { baseline, policy } = createUpstream();
    const draft = withEquityLimit(createInitialContributionConcentrationDraft(policy), "50", "55");
    const result = createContributionConcentrationSnapshot(draft, baseline, policy);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const equity = result.snapshot.allocations.find((row) => row.assetClass === "EQUITY");
    expect(moneyValue(equity?.policyAllocatedAmount)).toBe("10.00");
    expect(moneyValue(equity?.concentrationAllocatedAmount)).toBe("5.00");
    expect(moneyValue(equity?.blockedAmount)).toBe("5.00");
    expect(equity?.hardLimitApplied).toBe(true);
    expect(equity?.status).toBe("HARD_LIMITED");
    expect(moneyValue(result.snapshot.unallocatedContribution)).toBe("5.00");
  });

  it("blocks new allocation when the class is already above the hard limit", () => {
    const { baseline, policy } = createUpstream({
      portfolioValue: "90",
      contribution: "10",
      rows: [
        { assetClass: "EQUITY", targetWeight: "70", currentValue: "61" },
        { assetClass: "FIXED_INCOME", targetWeight: "30", currentValue: "29" },
      ],
    });
    const draft = withEquityLimit(createInitialContributionConcentrationDraft(policy), "55", "60");
    const result = createContributionConcentrationSnapshot(draft, baseline, policy);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const equity = result.snapshot.allocations.find((row) => row.assetClass === "EQUITY");
    expect(moneyValue(equity?.policyAllocatedAmount)).toBe("9.00");
    expect(moneyValue(equity?.concentrationAllocatedAmount)).toBe("0.00");
    expect(moneyValue(equity?.blockedAmount)).toBe("9.00");
    expect(moneyValue(result.snapshot.unallocatedContribution)).toBe("9.00");
  });

  it("translates invalid weights and invalid soft-to-hard ranges to row feedback", () => {
    const { baseline, policy } = createUpstream();
    const initial = createInitialContributionConcentrationDraft(policy);

    const invalidWeight = createContributionConcentrationSnapshot(
      withEquityLimit(initial, "101", "100"),
      baseline,
      policy,
    );
    expect(invalidWeight).toEqual({
      ok: false,
      errors: {
        rows: { EQUITY: { softMaxWeight: "Informe um percentual válido entre 0 e 100." } },
      },
    });

    const invalidRange = createContributionConcentrationSnapshot(
      withEquityLimit(initial, "61", "60"),
      baseline,
      policy,
    );
    expect(invalidRange).toEqual({
      ok: false,
      errors: {
        rows: {
          EQUITY: { range: "O limite de alerta deve ser menor ou igual ao limite rígido." },
        },
      },
    });
  });

  it("ignores empty values for classes that were not explicitly enabled", () => {
    const { baseline, policy } = createUpstream();
    const result = createContributionConcentrationSnapshot(
      createInitialContributionConcentrationDraft(policy),
      baseline,
      policy,
    );

    expect(result.ok).toBe(true);
  });
});
