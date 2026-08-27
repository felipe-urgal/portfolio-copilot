import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";
import { ContributionBaselinePanel } from "./contribution-baseline-panel";
import { createContributionPolicySnapshot } from "./contribution-policy-form";

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

describe("ContributionBaselinePanel", () => {
  it("renders an honest manual monetary basis before any calculation", () => {
    const html = renderToStaticMarkup(<ContributionBaselinePanel portfolio={PORTFOLIO} />);

    expect(html).toContain("Baseline do aporte");
    expect(html).toContain("Base monetária manual");
    expect(html).toContain("Total da base manual");
    expect(html).toContain("Novo aporte");
    expect(html).toContain("Peso-alvo (%)");
    expect(html).toContain("Valor atual declarado");
    expect(html).toContain("Ações");
    expect(html).toContain("Renda fixa");
    expect(html).toContain("Calcular baseline do aporte");
    expect(html).toContain("Baseline ainda não calculado");
    expect(html).toContain("não representam cotação, valuation ou patrimônio");
    expect(html).toContain("TargetAllocation, base, política e resultados");
    expect(html).not.toContain("Política operacional");
    expect(html).not.toMatch(/R\$\s*\d/);
  });

  it("reveals policy controls only after a validated baseline", () => {
    const result = createContributionBaselineSnapshot(DRAFT, PORTFOLIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <ContributionBaselinePanel portfolio={PORTFOLIO} initialBaseline={result.snapshot} />,
    );

    expect(html).toContain("Baseline validado");
    expect(html).toContain("Política operacional");
    expect(html).toContain("Mínimo significativo");
    expect(html).toContain("Limite de destinos");
    expect(html).toContain("Aplicar política ao baseline");
    expect(html).toContain("BRL 1000.00");
    expect(html).toContain("BRL 200.00");
    expect(html).toContain("BRL 1200.00");
    expect(html).toContain("60.0000%");
    expect(html).toContain("40.0000%");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("BRL 80.00");
    expect(html).toContain("Após política");
    expect(html).toContain("Não aplicada");
    expect(html).not.toContain("preço por unidade");
    expect(html).not.toMatch(/R\$\s*\d/);
  });

  it("renders baseline and post-policy amounts side by side without inventing a rule-specific reason", () => {
    const baselineResult = createContributionBaselineSnapshot(DRAFT, PORTFOLIO);
    expect(baselineResult.ok).toBe(true);
    if (!baselineResult.ok) return;

    const policyResult = createContributionPolicySnapshot(
      {
        minimumMeaningfulContribution: "0",
        maxDestinationsPerContribution: "1",
      },
      baselineResult.snapshot,
    );
    expect(policyResult.ok).toBe(true);
    if (!policyResult.ok) return;

    const html = renderToStaticMarkup(
      <ContributionBaselinePanel
        portfolio={PORTFOLIO}
        initialBaseline={baselineResult.snapshot}
        initialPolicy={policyResult.snapshot}
      />,
    );

    expect(html).toContain("Política aplicada");
    expect(html).toContain("Mínimo aplicado");
    expect(html).toContain("Máximo de destinos");
    expect(html).toContain("Sobra após política");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("BRL 80.00");
    expect(html).toContain("Mantida");
    expect(html).toContain("Removida pela política");
    expect(html).toContain("não atribui uma causa isolada entre mínimo e limite");
    expect(html).toContain(
      "Nenhuma etapa escolhe ativo, calcula quantidade ou usa preço de mercado",
    );
    expect(html).not.toMatch(/R\$\s*\d/);
  });
});
