import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  createContributionBaselineSnapshot,
  type ContributionBaselineDraft,
} from "./contribution-baseline-form";
import { ContributionBaselinePanel } from "./contribution-baseline-panel";

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
    expect(html).toContain("TargetAllocation, base e baseline existem apenas nesta sessão");
    expect(html).not.toMatch(/R\$\s*\d/);
  });

  it("renders the validated domain baseline without inventing asset quantities or prices", () => {
    const result = createContributionBaselineSnapshot(DRAFT, PORTFOLIO);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <ContributionBaselinePanel portfolio={PORTFOLIO} initialBaseline={result.snapshot} />,
    );

    expect(html).toContain("Calculado");
    expect(html).toContain("BRL 1000.00");
    expect(html).toContain("BRL 200.00");
    expect(html).toContain("BRL 1200.00");
    expect(html).toContain("BRL 0.00");
    expect(html).toContain("60.0000%");
    expect(html).toContain("40.0000%");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("BRL 80.00");
    expect(html).toContain("não escolhe ativo, não calcula quantidade e não usa");
    expect(html).not.toContain("preço por unidade");
    expect(html).not.toMatch(/R\$\s*\d/);
  });
});
