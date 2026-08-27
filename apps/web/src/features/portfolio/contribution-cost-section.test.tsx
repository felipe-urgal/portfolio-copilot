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
import { createContributionCostSnapshot } from "./contribution-cost-form";
import { ContributionCostSection } from "./contribution-cost-section";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { createContributionPolicySnapshot } from "./contribution-policy-form";
import { type LocalAssetSnapshot } from "./local-asset-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const EQUITY_ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";
const FIXED_INCOME_ASSET_ID = "9f0b2c1d-37aa-4b16-8f62-a0a9e5ef1e2a";

const ASSETS: readonly LocalAssetSnapshot[] = [
  {
    id: EQUITY_ASSET_ID,
    name: "ETF global",
    assetClass: "EQUITY",
    instrumentType: "ETF",
    referenceCurrency: "USD",
  },
  {
    id: FIXED_INCOME_ASSET_ID,
    name: "Tesouro IPCA",
    assetClass: "FIXED_INCOME",
    instrumentType: "FIXED_INCOME_INSTRUMENT",
    referenceCurrency: "BRL",
  },
];

function setup() {
  const draft: ContributionBaselineDraft = {
    portfolioValue: "1000",
    contribution: "200",
    rows: [
      { assetClass: "EQUITY", targetWeight: "60", currentValue: "600" },
      { assetClass: "FIXED_INCOME", targetWeight: "40", currentValue: "400" },
    ],
  };
  const baselineResult = createContributionBaselineSnapshot(draft, PORTFOLIO);
  expect(baselineResult.ok).toBe(true);
  if (!baselineResult.ok) throw new Error("Expected baseline");

  const policyResult = createContributionPolicySnapshot(
    { minimumMeaningfulContribution: "0", maxDestinationsPerContribution: "2" },
    baselineResult.snapshot,
  );
  expect(policyResult.ok).toBe(true);
  if (!policyResult.ok) throw new Error("Expected policy");

  const concentrationResult = createContributionConcentrationSnapshot(
    createInitialContributionConcentrationDraft(policyResult.snapshot),
    baselineResult.snapshot,
    policyResult.snapshot,
  );
  expect(concentrationResult.ok).toBe(true);
  if (!concentrationResult.ok) throw new Error("Expected concentration");

  const execution: ContributionExecutionSnapshot = {
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

  return {
    baseline: baselineResult.snapshot,
    policy: policyResult.snapshot,
    concentration: concentrationResult.snapshot,
    execution,
  };
}

describe("ContributionCostSection", () => {
  it("renders optional known-cost inputs only for executable destinations", () => {
    const { baseline, policy, concentration, execution } = setup();
    const html = renderToStaticMarkup(
      <ContributionCostSection
        baseline={baseline}
        policy={policy}
        concentration={concentration}
        execution={execution}
        assets={ASSETS}
      />,
    );

    expect(html).toContain("Custos conhecidos");
    expect(html).toContain("ETF global");
    expect(html).not.toContain("Tesouro IPCA");
    expect(html).toContain("Custo transacional conhecido");
    expect(html).toContain("Impacto tributário reservado");
    expect(html).toContain("não é imposto calculado pelo domínio");
    expect(html).toContain("Campo vazio significa custo conhecido zero");
    expect(html).toContain("Aplicar custos conhecidos");
    expect(html).not.toContain("Snapshot auditável");
  });

  it("shows gross budget, known costs and investable amount without hiding provenance", () => {
    const { baseline, policy, concentration, execution } = setup();
    const costResult = createContributionCostSnapshot(
      {
        rows: [
          {
            assetId: EQUITY_ASSET_ID,
            transactionCost: "10",
            estimatedTaxImpact: "5",
          },
        ],
      },
      baseline,
      execution,
    );
    expect(costResult.ok).toBe(true);
    if (!costResult.ok) return;

    const html = renderToStaticMarkup(
      <ContributionCostSection
        baseline={baseline}
        policy={policy}
        concentration={concentration}
        execution={execution}
        assets={ASSETS}
        initialCost={costResult.snapshot}
      />,
    );

    expect(html).toContain("Aplicado");
    expect(html).toContain("Sobra antes dos custos");
    expect(html).toContain("Sobra após custos");
    expect(html).toContain("BRL 120.00");
    expect(html).toContain("BRL 10.00");
    expect(html).toContain("BRL 5.00");
    expect(html).toContain("BRL 15.00");
    expect(html).toContain("BRL 105.00");
    expect(html).toContain("Executável");
    expect(html).toContain("Snapshot auditável");
    expect(html).toContain("Versão da metodologia");
    expect(html).not.toContain("Ativo não disponível nesta sessão");
  });

  it("states blocked known costs and preserves the full gross budget as remainder", () => {
    const { baseline, policy, concentration, execution } = setup();
    const costResult = createContributionCostSnapshot(
      {
        rows: [
          {
            assetId: EQUITY_ASSET_ID,
            transactionCost: "100",
            estimatedTaxImpact: "20",
          },
        ],
      },
      baseline,
      execution,
    );
    expect(costResult.ok).toBe(true);
    if (!costResult.ok) return;

    const html = renderToStaticMarkup(
      <ContributionCostSection
        baseline={baseline}
        policy={policy}
        concentration={concentration}
        execution={execution}
        assets={ASSETS}
        initialCost={costResult.snapshot}
      />,
    );

    expect(html).toContain("Bloqueado: custos conhecidos");
    expect(html).toContain("BRL 200.00");
    expect(html).toContain("Nenhum custo hipotético é debitado");
    expect(html).toContain("nada é redistribuído automaticamente");
    expect(html).toContain("Snapshot auditável");
  });
});
