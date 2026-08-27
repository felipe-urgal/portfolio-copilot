import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";
import {
  createContributionExecutionSnapshot,
  type ContributionExecutionDraft,
} from "./contribution-execution-form";
import { ContributionExecutionSection } from "./contribution-execution-section";
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

describe("ContributionExecutionSection", () => {
  it("renders local candidates by human context only after policy is available", () => {
    const { baseline, policy } = setup();
    const html = renderToStaticMarkup(
      <ContributionExecutionSection baseline={baseline} policy={policy} assets={ASSETS} />,
    );

    expect(html).toContain("Restrições de execução");
    expect(html).toContain("Ativo local");
    expect(html).toContain("ETF global — ETF");
    expect(html).toContain("Tesouro IPCA — Instrumento de renda fixa");
    expect(html).toContain("Elegível");
    expect(html).toContain("Inelegível");
    expect(html).toContain("Quantidade mínima negociável");
    expect(html).toContain("O AssetId é resolvido internamente");
    expect(html).toContain("Não afirma que o valor alocado");
    expect(html).not.toContain("preço por unidade");
  });

  it("states honestly when a positive class has no local candidate", () => {
    const { baseline, policy } = setup();
    const html = renderToStaticMarkup(
      <ContributionExecutionSection
        baseline={baseline}
        policy={policy}
        assets={ASSETS.filter((asset) => asset.assetClass === "EQUITY")}
      />,
    );

    expect(html).toContain("Cadastre um ativo local de Renda fixa antes de validar esta etapa.");
  });

  it("renders executable and blocked destinations without implying purchasable quantity", () => {
    const { baseline, policy } = setup();
    const executionDraft: ContributionExecutionDraft = {
      destinations: [
        {
          assetClass: "EQUITY",
          assetId: ASSETS[0]!.id,
          isEligible: true,
          minimumTradableQuantity: "0.5",
        },
        {
          assetClass: "FIXED_INCOME",
          assetId: ASSETS[1]!.id,
          isEligible: false,
          minimumTradableQuantity: "1",
        },
      ],
    };
    const executionResult = createContributionExecutionSnapshot(
      executionDraft,
      baseline,
      policy,
      ASSETS,
    );
    expect(executionResult.ok).toBe(true);
    if (!executionResult.ok) return;

    const html = renderToStaticMarkup(
      <ContributionExecutionSection
        baseline={baseline}
        policy={policy}
        assets={ASSETS}
        initialExecution={executionResult.snapshot}
      />,
    );

    expect(html).toContain("Validado");
    expect(html).toContain("Sobra após restrições");
    expect(html).toContain("BRL 80.00");
    expect(html).toContain("0.5 un.");
    expect(html).toContain("1 un.");
    expect(html).toContain("Executável");
    expect(html).toContain("Bloqueado: inelegível");
    expect(html).toContain("Sem preço, esta etapa não");
    expect(html).toContain("não executa ordem");
    expect(html).not.toContain("quantidade recomendada: 0.5");
  });
});
