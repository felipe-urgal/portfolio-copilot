import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { type ContributionRecommendationSnapshot } from "@portfolio-copilot/domain";

import { type ContributionBaselineSnapshot } from "./contribution-baseline-form";
import { type ContributionConcentrationSnapshot } from "./contribution-concentration-form";
import { type ContributionCostSnapshot } from "./contribution-cost-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import { ContributionRecommendationSection } from "./contribution-recommendation-section";
import { type LocalAssetSnapshot } from "./local-asset-form";

const PORTFOLIO_ID = "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298";
const EQUITY_ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";

const baseline: ContributionBaselineSnapshot = {
  targetAllocation: {
    portfolioId: PORTFOLIO_ID,
    buckets: [{ assetClass: "EQUITY", targetWeightPercent: "100" }],
  },
  portfolioValue: { currency: "BRL", minorUnits: "100000" },
  contribution: { currency: "BRL", minorUnits: "10000" },
  postContributionValue: { currency: "BRL", minorUnits: "110000" },
  allocations: [
    {
      assetClass: "EQUITY",
      targetWeightPercent: "100",
      currentValue: { currency: "BRL", minorUnits: "100000" },
      postContributionTargetValue: { currency: "BRL", minorUnits: "110000" },
      postContributionNeed: { currency: "BRL", minorUnits: "10000" },
      allocatedAmount: { currency: "BRL", minorUnits: "10000" },
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const policy: ContributionPolicySnapshot = {
  minimumMeaningfulContribution: { currency: "BRL", minorUnits: "0" },
  maxDestinationsPerContribution: 1,
  allocations: [
    {
      assetClass: "EQUITY",
      baselineAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      policyAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      status: "KEPT",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const concentration: ContributionConcentrationSnapshot = {
  allocations: [
    {
      assetClass: "EQUITY",
      policyAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      softMaxWeightPercent: null,
      hardMaxWeightPercent: null,
      softLimitExceeded: false,
      hardLimitApplied: false,
      blockedAmount: { currency: "BRL", minorUnits: "0" },
      status: "NO_LIMIT",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const execution: ContributionExecutionSnapshot = {
  destinations: [
    {
      assetClass: "EQUITY",
      assetId: EQUITY_ASSET_ID,
      isEligible: true,
      minimumTradableQuantity: "1.000000000000",
      concentrationAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      executionAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      status: "EXECUTABLE",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const cost: ContributionCostSnapshot = {
  destinations: [
    {
      assetId: EQUITY_ASSET_ID,
      assetClass: "EQUITY",
      grossAllocatedAmount: { currency: "BRL", minorUnits: "10000" },
      transactionCost: { currency: "BRL", minorUnits: "1000" },
      estimatedTaxImpact: { currency: "BRL", minorUnits: "0" },
      totalKnownCost: { currency: "BRL", minorUnits: "1000" },
      investableAmount: { currency: "BRL", minorUnits: "9000" },
      status: "EXECUTABLE",
    },
  ],
  unallocatedContribution: { currency: "BRL", minorUnits: "0" },
};

const recommendation: ContributionRecommendationSnapshot = {
  methodologyVersion: "local-mvp-v1",
  portfolioId: PORTFOLIO_ID,
  currency: "BRL",
  portfolioValue: "1000.00",
  contribution: "100.00",
  postContributionValue: "1100.00",
  policy: {
    minimumMeaningfulContribution: "0.00",
    maxDestinationsPerContribution: 1,
  },
  cashRemainder: {
    afterAllocator: "0.00",
    afterPolicy: "0.00",
    afterConcentration: "0.00",
    afterExecution: "0.00",
    afterCosts: "0.00",
  },
  totalInvestableAmount: "90.00",
  totalConsumedKnownCost: "10.00",
  unallocatedContribution: "0.00",
  decisions: [
    {
      assetClass: "EQUITY",
      assetId: EQUITY_ASSET_ID,
      targetWeightPercent: "100.0000",
      currentValue: "1000.00",
      postContributionTargetValue: "1100.00",
      postContributionNeed: "100.00",
      baselineAllocatedAmount: "100.00",
      policyAllocatedAmount: "100.00",
      concentrationAllocatedAmount: "100.00",
      concentrationBlockedAmount: "0.00",
      softMaxWeightPercent: null,
      hardMaxWeightPercent: null,
      executionEligible: true,
      minimumTradableQuantity: "1.000000000000",
      transactionCost: "10.00",
      estimatedTaxImpact: "0.00",
      totalKnownCost: "10.00",
      consumedKnownCost: "10.00",
      investableAmount: "90.00",
      status: "EXECUTABLE",
      reasonCodes: ["CONTRIBUTION_POLICY_ADJUSTED"],
    },
  ],
};

const assets: readonly LocalAssetSnapshot[] = [
  {
    id: EQUITY_ASSET_ID,
    name: "ETF global",
    assetClass: "EQUITY",
    instrumentType: "ETF",
    referenceCurrency: "USD",
  },
];

describe("ContributionRecommendationSection", () => {
  it("renders an explicit methodology input before consolidation", () => {
    const html = renderToStaticMarkup(
      <ContributionRecommendationSection
        baseline={baseline}
        policy={policy}
        concentration={concentration}
        execution={execution}
        cost={cost}
        assets={assets}
      />,
    );

    expect(html).toContain("Snapshot auditável");
    expect(html).toContain("Versão da metodologia");
    expect(html).toContain("Gerar snapshot consolidado");
    expect(html).toContain("Não é gerado nem normalizado automaticamente");
    expect(html).not.toContain("Total investível");
    expect(html).not.toContain("Como ler este aporte");
  });

  it("renders cumulative remainder, reconciliation, structured provenance and deterministic explanation", () => {
    const html = renderToStaticMarkup(
      <ContributionRecommendationSection
        baseline={baseline}
        policy={policy}
        concentration={concentration}
        execution={execution}
        cost={cost}
        assets={assets}
        initialMethodologyVersion="local-mvp-v1"
        initialRecommendation={recommendation}
      />,
    );

    expect(html).toContain("Consolidado");
    expect(html).toContain("local-mvp-v1");
    expect(html).toContain("Total investível");
    expect(html).toContain("BRL 90.00");
    expect(html).toContain("Custo conhecido consumido");
    expect(html).toContain("BRL 10.00");
    expect(html).toContain("Após allocator");
    expect(html).toContain("Após política");
    expect(html).toContain("Após concentração");
    expect(html).toContain("Após execução");
    expect(html).toContain("Após custos");
    expect(html).toContain("ETF global");
    expect(html).toContain("Executável");
    expect(html).toContain("CONTRIBUTION_POLICY_ADJUSTED");
    expect(html).toContain("Como ler este aporte");
    expect(html).toContain("Política ajustou o baseline");
    expect(html).toContain("Nenhuma causa adicional é inferida");
    expect(html).toContain("não uma ordem de compra");
    expect(html).toContain("Nenhum valor é recalculado nesta leitura");
    expect(html).toContain("cumulativas, não incrementais");
    expect(html).not.toContain(EQUITY_ASSET_ID);
  });
});
