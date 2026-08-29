import { AssetId, CurrencyCode } from "@portfolio-copilot/domain";
import type { PriceSnapshot } from "@portfolio-copilot/market-data";

import {
  createAnalyticalEvidence,
  normalizeEvaluationInstant,
  normalizeInvestmentIdentifier,
  type AnalyticalEvidenceInput,
  type AnalyticalEvidenceSnapshot,
  type InvestmentEvidenceQualityFlag,
} from "./evidence";
import { parsePositiveInvestmentDecimal, relativeDifferenceBasisPoints } from "./decimal";

export type ValuationInsufficientReason =
  | "STALE_PRICE"
  | "CONFLICTING_PRICE"
  | "STALE_FAIR_VALUE"
  | "CONFLICTING_FAIR_VALUE"
  | "LOOKAHEAD_PRICE"
  | "LOOKAHEAD_FAIR_VALUE"
  | "CURRENCY_MISMATCH";

export type ValuationModelInput = Readonly<{
  modelId: string;
  version: string;
}>;

export type FairValueEstimateInput = Readonly<{
  value: string;
  currency: CurrencyCode | string;
  evidence: AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot;
}>;

export type ValuationEvaluationInput = Readonly<{
  evaluationAsOf: string;
  currentPrice: PriceSnapshot;
  currentPriceQualityFlags?: readonly InvestmentEvidenceQualityFlag[];
  fairValue: FairValueEstimateInput;
  model: ValuationModelInput;
}>;

export type ValuationSnapshot = Readonly<{
  status: "VALUED";
  assetId: string;
  currency: string;
  evaluationAsOf: string;
  currentPrice: string;
  fairValue: string;
  upsideBps: number;
  discountToFairValueBps: number;
  model: Readonly<{
    modelId: string;
    version: string;
  }>;
  priceEvidence: AnalyticalEvidenceSnapshot;
  fairValueEvidence: AnalyticalEvidenceSnapshot;
}>;

export type ValuationInsufficientData = Readonly<{
  status: "INSUFFICIENT_DATA";
  assetId: string;
  evaluationAsOf: string;
  reasonCodes: readonly ValuationInsufficientReason[];
  model: Readonly<{
    modelId: string;
    version: string;
  }>;
  priceEvidence: AnalyticalEvidenceSnapshot;
  fairValueEvidence: AnalyticalEvidenceSnapshot;
}>;

export type ValuationEvaluationResult = ValuationSnapshot | ValuationInsufficientData;

export class InvalidValuationInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidValuationInputError";
  }
}

const VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function normalizeVersion(value: string): string {
  const normalized = value.trim();
  if (!VERSION_PATTERN.test(normalized)) {
    throw new InvalidValuationInputError(
      `Invalid valuation model version: ${JSON.stringify(value)}`,
    );
  }

  return normalized;
}

function normalizeModel(input: ValuationModelInput): ValuationSnapshot["model"] {
  return Object.freeze({
    modelId: normalizeInvestmentIdentifier("modelId", input.modelId),
    version: normalizeVersion(input.version),
  });
}

function toEvidenceSnapshot(
  value: AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot,
): AnalyticalEvidenceSnapshot {
  return createAnalyticalEvidence(value);
}

function priceEvidence(
  price: PriceSnapshot,
  qualityFlags: readonly InvestmentEvidenceQualityFlag[] | undefined,
): AnalyticalEvidenceSnapshot {
  return createAnalyticalEvidence({
    evidenceId: "PRICE_INPUT",
    asOf: price.asOf,
    retrievedAt: price.retrievedAt,
    provenance: price.provenance,
    qualityFlags: [...price.qualityFlags, ...(qualityFlags ?? [])],
  });
}

function addQualityReasons(
  reasons: Set<ValuationInsufficientReason>,
  evidence: AnalyticalEvidenceSnapshot,
  staleReason: ValuationInsufficientReason,
  conflictReason: ValuationInsufficientReason,
): void {
  if (evidence.qualityFlags.includes("STALE")) reasons.add(staleReason);
  if (evidence.qualityFlags.includes("CONFLICT")) reasons.add(conflictReason);
}

export function evaluateValuation(input: ValuationEvaluationInput): ValuationEvaluationResult {
  const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
  const model = normalizeModel(input.model);
  const assetId = AssetId.from(input.currentPrice.assetId).toString();
  const currentPrice = parsePositiveInvestmentDecimal("currentPrice", input.currentPrice.price);
  const fairValue = parsePositiveInvestmentDecimal("fairValue", input.fairValue.value);
  const priceCurrency = CurrencyCode.from(input.currentPrice.currency);
  const fairValueCurrency =
    input.fairValue.currency instanceof CurrencyCode
      ? input.fairValue.currency
      : CurrencyCode.from(input.fairValue.currency);
  const currentPriceEvidence = priceEvidence(input.currentPrice, input.currentPriceQualityFlags);
  const fairValueEvidence = toEvidenceSnapshot(input.fairValue.evidence);
  const reasons = new Set<ValuationInsufficientReason>();

  addQualityReasons(reasons, currentPriceEvidence, "STALE_PRICE", "CONFLICTING_PRICE");
  addQualityReasons(reasons, fairValueEvidence, "STALE_FAIR_VALUE", "CONFLICTING_FAIR_VALUE");

  if (
    currentPriceEvidence.asOf > evaluationAsOf ||
    currentPriceEvidence.retrievedAt > evaluationAsOf
  ) {
    reasons.add("LOOKAHEAD_PRICE");
  }
  if (fairValueEvidence.asOf > evaluationAsOf || fairValueEvidence.retrievedAt > evaluationAsOf) {
    reasons.add("LOOKAHEAD_FAIR_VALUE");
  }
  if (!priceCurrency.equals(fairValueCurrency)) reasons.add("CURRENCY_MISMATCH");

  if (reasons.size > 0) {
    return Object.freeze({
      status: "INSUFFICIENT_DATA",
      assetId,
      evaluationAsOf,
      reasonCodes: Object.freeze([...reasons].sort()),
      model,
      priceEvidence: currentPriceEvidence,
      fairValueEvidence,
    });
  }

  const upsideBps = relativeDifferenceBasisPoints(currentPrice, fairValue);
  const discountToFairValueBps = -relativeDifferenceBasisPoints(fairValue, currentPrice);

  return Object.freeze({
    status: "VALUED",
    assetId,
    currency: priceCurrency.code,
    evaluationAsOf,
    currentPrice: currentPrice.normalized,
    fairValue: fairValue.normalized,
    upsideBps,
    discountToFairValueBps,
    model,
    priceEvidence: currentPriceEvidence,
    fairValueEvidence,
  });
}
