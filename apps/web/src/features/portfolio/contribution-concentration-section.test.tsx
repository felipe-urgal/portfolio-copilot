import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";
import {
  createContributionConcentrationSnapshot,
  createInitialContributionConcentrationDraft,
} from "./contribution-concentration-form";
import { ContributionConcentrationSection } from "./contribution-concentration-section";
import { createContributionPolicySnapshot } from "./contribution-policy-form";
import { type LocalAssetSnapshot } from "./local-asset-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const DRAFT: ContributionBaselineDraft = {
  portfolioValue: "1000",
  contribution: "200",
  rows: [
    { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
    { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
  ],
};

const ASSETS: readonly LocalAssetSnapshot[] = [
  {
    id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
    name: "ETF global",
    assetClass: "EQUITY",
    instrumentType: "ETF",
    referenceCurrency: "USD",
  },
  {
    id: "9f0b2c1d-37aa-4b16-8f62-a0a9e5ef1e2a",
    name: "Tesouro IPCA",
    assetClass: "FIXED_INCOME",
    instrumentType: "FIXED_INCOME_INSTRUMENT",
    referenceCurrency: "BRL",
  },
];

function setup() {
  const baselineResult = createContributionBaselineSnapshot(DRAFT, PORTFOLIO);
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

describe("ContributionConcentrationSection", () => {
  it("starts with explicit opt-in limits and keeps execution unavailable", () => {
    const { baseline, policy } = setup();
    const html = renderToStaticMarkup(
      <ContributionConcentrationSection baseline={baseline} policy={policy} assets={ASSETS} />,
    );

    expect(html).toContain("Limites de concentração");
    expect(html).toContain("Configurar limite nesta classe");
    expect(html).toContain("Limite de alerta (%)");
    expect(html).toContain("Limite rígido (%)");
    expect(html).toContain("Alert-only. Não reduz valor sozinho.");
    expect(html).toContain("Pode bloquear apenas o novo aporte desta classe.");
    expect(html).not.toContain("Restrições de execução");
  });

  it("renders soft alert-only without reducing the post-policy allocation", () => {
    const { baseline, policy } = setup();
    const initial = createInitialContributionConcentrationDraft(policy);
    const result = createContributionConcentrationSnapshot(
      {
        rows: initial.rows.map((row) =>
          row.assetClass === "EQUITY"
            ? { ...row, enabled: true, softMaxWeight: "55", hardMaxWeight: "70" }
            : row,
        ),
      },
      baseline,
      policy,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <ContributionConcentrationSection
        baseline={baseline}
        policy={policy}
        assets={ASSETS}
        initialConcentration={result.snapshot}
      />,
    );

    expect(html).toContain("Alerta suave");
    expect(html).toContain("55.0000%");
    expect(html).toContain("70.0000%");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("BRL 0.00");
    expect(html).toContain("Restrições de execução");
  });

  it("shows hard-blocked value and removes the zeroed class from execution", () => {
    const { baseline, policy } = setup();
    const initial = createInitialContributionConcentrationDraft(policy);
    const result = createContributionConcentrationSnapshot(
      {
        rows: initial.rows.map((row) =>
          row.assetClass === "EQUITY"
            ? { ...row, enabled: true, softMaxWeight: "45", hardMaxWeight: "50" }
            : row,
        ),
      },
      baseline,
      policy,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <ContributionConcentrationSection
        baseline={baseline}
        policy={policy}
        assets={ASSETS}
        initialConcentration={result.snapshot}
      />,
    );

    expect(html).toContain("Limite rígido aplicado");
    expect(html).toContain("Sobra após concentração");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("Nenhuma");
    expect(html).toContain("Após concentração: BRL 80.00");
    expect(html).not.toContain("Após concentração: BRL 0.00");
    expect(html).not.toContain("ETF global — ETF");
    expect(html).toContain("Tesouro IPCA — Instrumento de renda fixa");
  });
});
