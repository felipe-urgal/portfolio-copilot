import { createPriceSnapshot } from "@portfolio-copilot/market-data";
import { describe, expect, it } from "vitest";

import {
  BANK_STOCK_METHODOLOGY,
  BASELINE_INVESTMENT_METHODOLOGY_REGISTRY,
  createAnalyticalEvidence,
  createInvestmentMethodology,
  evaluateDividendScore,
  evaluateOpportunityScore,
  evaluateQualityScore,
  evaluateValuation,
  GENERIC_STOCK_METHODOLOGY,
  InvalidInvestmentEvidenceError,
  InvalidInvestmentMethodologyError,
  REAL_ESTATE_FUND_METHODOLOGY,
  type AnalyticalEvidenceInput,
  type InvestmentMethodology,
  type ScoreComponentInput,
} from "./index";

const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const OTHER_ASSET_ID = "550e8400-e29b-41d4-a716-446655440001";
const EVALUATION_AS_OF = "2026-08-29T12:00:00.000Z";

function evidenceInput(
  evidenceId: string,
  overrides: Partial<AnalyticalEvidenceInput> = {},
): AnalyticalEvidenceInput {
  return {
    evidenceId,
    asOf: "2026-08-29T10:00:00.000Z",
    retrievedAt: "2026-08-29T10:05:00.000Z",
    provenance: {
      provider: "test_provider",
      sourceId: evidenceId,
      sourceUrl: `https://example.com/evidence/${evidenceId.toLowerCase()}`,
      normalizationVersion: "test-v1",
    },
    ...overrides,
  };
}

function componentInputs(
  methodology: InvestmentMethodology,
  kind: "quality" | "opportunity" | "dividend",
  scoreBps: number,
): readonly ScoreComponentInput[] {
  return methodology[kind].map((component) => ({
    componentId: component.componentId,
    scoreBps,
    reasonCodes: [`${component.componentId}_ASSESSED`],
    evidence: [evidenceInput(`${component.componentId}_INPUT`)],
  }));
}

function valuation(price = "80", fairValue = "100", assetId = ASSET_ID) {
  const currentPrice = createPriceSnapshot({
    assetId,
    price,
    currency: "BRL",
    asOf: "2026-08-29T10:00:00.000Z",
    retrievedAt: "2026-08-29T10:01:00.000Z",
    provenance: {
      provider: "price_provider",
      sourceId: "price-close",
      normalizationVersion: "price-v1",
    },
  });

  return evaluateValuation({
    evaluationAsOf: EVALUATION_AS_OF,
    currentPrice,
    fairValue: {
      value: fairValue,
      currency: "BRL",
      evidence: evidenceInput("FAIR_VALUE_INPUT", {
        asOf: "2026-08-29T09:00:00.000Z",
        retrievedAt: "2026-08-29T09:30:00.000Z",
      }),
    },
    model: { modelId: "DCF_BASE", version: "1.0.0" },
  });
}

describe("investment methodology", () => {
  it("keeps class and sector methodologies explicit instead of silently falling back", () => {
    expect(
      BASELINE_INVESTMENT_METHODOLOGY_REGISTRY.findForClassification({
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        sector: "BANKS",
      }),
    ).toEqual([BANK_STOCK_METHODOLOGY]);

    expect(
      BASELINE_INVESTMENT_METHODOLOGY_REGISTRY.findForClassification({
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        sector: "ENERGY",
      }),
    ).toEqual([]);

    expect(
      BASELINE_INVESTMENT_METHODOLOGY_REGISTRY.findForClassification({
        assetClass: "REAL_ESTATE",
        instrumentType: "REAL_ESTATE_FUND",
        sector: "GENERAL",
      }),
    ).toEqual([REAL_ESTATE_FUND_METHODOLOGY]);
  });

  it("requires every configured score dimension to total exactly 10000 basis points", () => {
    expect(() =>
      createInvestmentMethodology({
        methodologyId: "INVALID_WEIGHTS",
        version: "1.0.0",
        classification: {
          assetClass: "EQUITY",
          instrumentType: "STOCK",
          sector: "GENERAL",
        },
        quality: [{ componentId: "QUALITY", weightBps: 9_999 }],
        opportunity: [{ componentId: "OPPORTUNITY", weightBps: 10_000 }],
        dividendApplicability: "NOT_APPLICABLE",
      }),
    ).toThrowError(InvalidInvestmentMethodologyError);
  });

  it("keeps methodology version selection explicit", () => {
    expect(BASELINE_INVESTMENT_METHODOLOGY_REGISTRY.get("EQUITY_STOCK_GENERAL", "1.0.0")).toBe(
      GENERIC_STOCK_METHODOLOGY,
    );
    expect(
      BASELINE_INVESTMENT_METHODOLOGY_REGISTRY.get("EQUITY_STOCK_GENERAL", "2.0.0"),
    ).toBeNull();
  });
});

describe("analytical evidence", () => {
  it("rejects impossible retrieval chronology", () => {
    expect(() =>
      createAnalyticalEvidence(
        evidenceInput("LATE_OBSERVATION", {
          asOf: "2026-08-29T11:00:00.000Z",
          retrievedAt: "2026-08-29T10:59:59.000Z",
        }),
      ),
    ).toThrowError(InvalidInvestmentEvidenceError);
  });

  it("rejects credentials embedded in provenance URLs", () => {
    expect(() =>
      createAnalyticalEvidence(
        evidenceInput("CREDENTIAL_URL", {
          provenance: {
            provider: "provider_a",
            sourceUrl: "https://user:secret@example.com/data",
            normalizationVersion: "v1",
          },
        }),
      ),
    ).toThrowError(InvalidInvestmentEvidenceError);
  });
});

describe("valuation snapshots", () => {
  it("calculates exact upside and discount without floating point input conversion", () => {
    expect(valuation("80", "100")).toMatchObject({
      status: "VALUED",
      assetId: ASSET_ID,
      currency: "BRL",
      currentPrice: "80",
      fairValue: "100",
      upsideBps: 2_500,
      discountToFairValueBps: 2_000,
      model: { modelId: "DCF_BASE", version: "1.0.0" },
    });

    expect(valuation("120", "100")).toMatchObject({
      status: "VALUED",
      upsideBps: -1_667,
      discountToFairValueBps: -2_000,
    });
  });

  it("returns insufficient data for stale price instead of treating it as current", () => {
    const currentPrice = createPriceSnapshot({
      assetId: ASSET_ID,
      price: "80",
      currency: "BRL",
      asOf: "2026-08-29T10:00:00.000Z",
      retrievedAt: "2026-08-29T10:01:00.000Z",
      provenance: { provider: "price_provider", normalizationVersion: "v1" },
    });

    const result = evaluateValuation({
      evaluationAsOf: EVALUATION_AS_OF,
      currentPrice,
      currentPriceQualityFlags: ["STALE"],
      fairValue: {
        value: "100",
        currency: "BRL",
        evidence: evidenceInput("FAIR_VALUE"),
      },
      model: { modelId: "DCF_BASE", version: "1.0.0" },
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["STALE_PRICE"],
    });
  });

  it("blocks currency mismatch and historical look-ahead explicitly", () => {
    const currentPrice = createPriceSnapshot({
      assetId: ASSET_ID,
      price: "80",
      currency: "BRL",
      asOf: "2026-08-29T10:00:00.000Z",
      retrievedAt: "2026-08-29T12:01:00.000Z",
      provenance: { provider: "price_provider", normalizationVersion: "v1" },
    });

    const result = evaluateValuation({
      evaluationAsOf: EVALUATION_AS_OF,
      currentPrice,
      fairValue: {
        value: "100",
        currency: "USD",
        evidence: evidenceInput("FAIR_VALUE_LOOKAHEAD", {
          retrievedAt: "2026-08-29T12:02:00.000Z",
        }),
      },
      model: { modelId: "DCF_BASE", version: "1.0.0" },
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["CURRENCY_MISMATCH", "LOOKAHEAD_FAIR_VALUE", "LOOKAHEAD_PRICE"],
    });
  });
});

describe("deterministic scores", () => {
  it("keeps high quality separate from a low opportunity score", () => {
    const quality = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 10_000),
    });
    const opportunity = evaluateOpportunityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "opportunity", 1_000),
      valuation: valuation(),
    });

    expect(quality).toMatchObject({
      status: "SCORED",
      kind: "QUALITY",
      assetId: ASSET_ID,
      scoreBps: 10_000,
    });
    expect(opportunity).toMatchObject({
      status: "SCORED",
      kind: "OPPORTUNITY",
      assetId: ASSET_ID,
      scoreBps: 1_000,
    });
  });

  it("does not invent a score when a required component is missing", () => {
    const components = componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 8_000).slice(1);
    const result = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components,
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      assetId: ASSET_ID,
      reasonCodes: ["MISSING_COMPONENT"],
      affectedComponents: ["PROFITABILITY"],
    });
    expect("scoreBps" in result).toBe(false);
  });

  it("blocks stale, conflicting and look-ahead evidence instead of reducing confidence silently", () => {
    const components = [...componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 8_000)];
    components[0] = {
      ...components[0]!,
      evidence: [
        evidenceInput("PROFITABILITY_STALE", { qualityFlags: ["STALE"] }),
        evidenceInput("PROFITABILITY_CONFLICT", { qualityFlags: ["CONFLICT"] }),
        evidenceInput("PROFITABILITY_LOOKAHEAD", {
          retrievedAt: "2026-08-29T12:01:00.000Z",
        }),
      ],
    };

    const result = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components,
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["CONFLICTING_EVIDENCE", "LOOKAHEAD_EVIDENCE", "STALE_EVIDENCE"],
      affectedComponents: ["PROFITABILITY"],
    });
  });

  it("requires a valid valuation for opportunity scoring and preserves failed valuation details", () => {
    const currentPrice = createPriceSnapshot({
      assetId: ASSET_ID,
      price: "80",
      currency: "BRL",
      asOf: "2026-08-29T10:00:00.000Z",
      retrievedAt: "2026-08-29T10:01:00.000Z",
      provenance: { provider: "price_provider", normalizationVersion: "v1" },
    });
    const invalidValuation = evaluateValuation({
      evaluationAsOf: EVALUATION_AS_OF,
      currentPrice,
      currentPriceQualityFlags: ["STALE"],
      fairValue: {
        value: "100",
        currency: "BRL",
        evidence: evidenceInput("FAIR_VALUE"),
      },
      model: { modelId: "DCF_BASE", version: "1.0.0" },
    });

    const result = evaluateOpportunityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "opportunity", 6_000),
      valuation: invalidValuation,
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      kind: "OPPORTUNITY",
      reasonCodes: ["INVALID_VALUATION"],
      valuation: {
        status: "INSUFFICIENT_DATA",
        reasonCodes: ["STALE_PRICE"],
      },
    });
  });

  it("rejects a valuation created for another asset", () => {
    const result = evaluateOpportunityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "opportunity", 6_000),
      valuation: valuation("80", "100", OTHER_ASSET_ID),
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      reasonCodes: ["VALUATION_ASSET_MISMATCH"],
    });
  });

  it("requires a valuation instead of treating absence as a neutral opportunity input", () => {
    const result = evaluateOpportunityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "opportunity", 6_000),
      valuation: null,
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      kind: "OPPORTUNITY",
      reasonCodes: ["MISSING_VALUATION"],
    });
  });

  it("keeps optional dividends not applicable when no dividend evidence is supplied", () => {
    expect(
      evaluateDividendScore(GENERIC_STOCK_METHODOLOGY, {
        assetId: ASSET_ID,
        evaluationAsOf: EVALUATION_AS_OF,
        components: [],
      }),
    ).toMatchObject({ status: "NOT_APPLICABLE", kind: "DIVIDEND", assetId: ASSET_ID });
  });

  it("requires dividend components when the methodology marks dividends as required", () => {
    const result = evaluateDividendScore(REAL_ESTATE_FUND_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: [],
    });

    expect(result).toMatchObject({
      status: "INSUFFICIENT_DATA",
      kind: "DIVIDEND",
      reasonCodes: ["MISSING_COMPONENT"],
    });
  });

  it("preserves exact weighted contributions, reason codes and methodology metadata", () => {
    const components = componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 7_500);
    const first = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components,
    });
    const second = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components,
    });

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      status: "SCORED",
      assetId: ASSET_ID,
      methodologyId: "EQUITY_STOCK_GENERAL",
      methodologyVersion: "1.0.0",
      scoreBps: 7_500,
    });
    if (first.status !== "SCORED") throw new Error("Expected scored quality snapshot.");
    expect(first.components[0]).toMatchObject({
      componentId: "PROFITABILITY",
      reasonCodes: ["PROFITABILITY_ASSESSED"],
      weightedContributionNumerator: 15_000_000,
    });
  });

  it("keeps score boundaries exact at zero and one hundred percent", () => {
    const zero = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 0),
    });
    const full = evaluateQualityScore(GENERIC_STOCK_METHODOLOGY, {
      assetId: ASSET_ID,
      evaluationAsOf: EVALUATION_AS_OF,
      components: componentInputs(GENERIC_STOCK_METHODOLOGY, "quality", 10_000),
    });

    expect(zero).toMatchObject({ status: "SCORED", scoreBps: 0 });
    expect(full).toMatchObject({ status: "SCORED", scoreBps: 10_000 });
  });
});
