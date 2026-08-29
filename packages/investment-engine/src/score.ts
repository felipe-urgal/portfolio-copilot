import { AssetId } from "@portfolio-copilot/domain";

import type {
  InvestmentMethodology,
  InvestmentScoreKind,
  ScoreComponentDefinition,
} from "./methodology";
import {
  createAnalyticalEvidence,
  normalizeEvaluationInstant,
  normalizeInvestmentIdentifier,
  type AnalyticalEvidenceInput,
  type AnalyticalEvidenceSnapshot,
} from "./evidence";
import type { ValuationEvaluationResult, ValuationSnapshot } from "./valuation";

export type InvestmentScoreInsufficientReason =
  | "MISSING_COMPONENT"
  | "MISSING_EVIDENCE"
  | "STALE_EVIDENCE"
  | "CONFLICTING_EVIDENCE"
  | "LOOKAHEAD_EVIDENCE"
  | "MISSING_VALUATION"
  | "INVALID_VALUATION"
  | "VALUATION_ASSET_MISMATCH";

export type ScoreComponentInput = Readonly<{
  componentId: string;
  scoreBps: number;
  reasonCodes: readonly string[];
  evidence: readonly (AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot)[];
}>;

export type ScoreComponentSnapshot = Readonly<{
  componentId: string;
  scoreBps: number;
  weightBps: number;
  weightedContributionNumerator: number;
  reasonCodes: readonly string[];
  evidence: readonly AnalyticalEvidenceSnapshot[];
}>;

export type InvestmentScoreSnapshot = Readonly<{
  status: "SCORED";
  kind: InvestmentScoreKind;
  assetId: string;
  scoreBps: number;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  classification: InvestmentMethodology["classification"];
  components: readonly ScoreComponentSnapshot[];
  valuation: ValuationSnapshot | null;
}>;

export type InvestmentScoreInsufficientData = Readonly<{
  status: "INSUFFICIENT_DATA";
  kind: InvestmentScoreKind;
  assetId: string;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  classification: InvestmentMethodology["classification"];
  reasonCodes: readonly InvestmentScoreInsufficientReason[];
  affectedComponents: readonly string[];
  components: readonly ScoreComponentSnapshot[];
  valuation: ValuationEvaluationResult | null;
}>;

export type DividendScoreNotApplicable = Readonly<{
  status: "NOT_APPLICABLE";
  kind: "DIVIDEND";
  assetId: string;
  evaluationAsOf: string;
  methodologyId: string;
  methodologyVersion: string;
  classification: InvestmentMethodology["classification"];
}>;

export type InvestmentScoreResult = InvestmentScoreSnapshot | InvestmentScoreInsufficientData;
export type DividendScoreResult = InvestmentScoreResult | DividendScoreNotApplicable;

export class InvalidInvestmentScoreInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidInvestmentScoreInputError";
  }
}

function normalizeScoreBps(componentId: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > 10_000) {
    throw new InvalidInvestmentScoreInputError(
      `Invalid score for ${componentId}: ${String(value)}. Expected an integer from 0 to 10000.`,
    );
  }

  return value;
}

function normalizeReasonCodes(componentId: string, values: readonly string[]): readonly string[] {
  if (values.length === 0) {
    throw new InvalidInvestmentScoreInputError(
      `Score component ${componentId} requires at least one reason code.`,
    );
  }

  const normalized = values.map((value) => normalizeInvestmentIdentifier("reasonCode", value));
  return Object.freeze([...new Set(normalized)].sort());
}

function normalizeInputs(inputs: readonly ScoreComponentInput[]): ReadonlyMap<string, ScoreComponentInput> {
  const normalized = new Map<string, ScoreComponentInput>();
  for (const input of inputs) {
    const componentId = normalizeInvestmentIdentifier("componentId", input.componentId);
    if (normalized.has(componentId)) {
      throw new InvalidInvestmentScoreInputError(`Duplicate score component input ${componentId}.`);
    }
    normalized.set(componentId, input);
  }

  return normalized;
}

function aggregateScore(components: readonly ScoreComponentSnapshot[]): number {
  const numerator = components.reduce(
    (sum, component) => sum + component.weightedContributionNumerator,
    0,
  );
  return Math.floor((numerator + 5_000) / 10_000);
}

function validateEvidence(
  definition: ScoreComponentDefinition,
  input: ScoreComponentInput,
  evaluationAsOf: string,
  reasons: Set<InvestmentScoreInsufficientReason>,
  affectedComponents: Set<string>,
): readonly AnalyticalEvidenceSnapshot[] {
  if (input.evidence.length === 0) {
    reasons.add("MISSING_EVIDENCE");
    affectedComponents.add(definition.componentId);
    return Object.freeze([]);
  }

  const evidence = input.evidence.map((entry) => createAnalyticalEvidence(entry));
  for (const entry of evidence) {
    if (entry.qualityFlags.includes("STALE")) {
      reasons.add("STALE_EVIDENCE");
      affectedComponents.add(definition.componentId);
    }
    if (entry.qualityFlags.includes("CONFLICT")) {
      reasons.add("CONFLICTING_EVIDENCE");
      affectedComponents.add(definition.componentId);
    }
    if (entry.asOf > evaluationAsOf || entry.retrievedAt > evaluationAsOf) {
      reasons.add("LOOKAHEAD_EVIDENCE");
      affectedComponents.add(definition.componentId);
    }
  }

  return Object.freeze(evidence);
}

function scoreComponents(
  definitions: readonly ScoreComponentDefinition[],
  inputComponents: readonly ScoreComponentInput[],
  evaluationAsOf: string,
  reasons: Set<InvestmentScoreInsufficientReason>,
  affectedComponents: Set<string>,
): readonly ScoreComponentSnapshot[] {
  const inputsById = normalizeInputs(inputComponents);
  const definitionIds = new Set(definitions.map((definition) => definition.componentId));

  for (const inputId of inputsById.keys()) {
    if (!definitionIds.has(inputId)) {
      throw new InvalidInvestmentScoreInputError(`Unknown score component ${inputId}.`);
    }
  }

  const snapshots: ScoreComponentSnapshot[] = [];
  for (const definition of definitions) {
    const input = inputsById.get(definition.componentId);
    if (input === undefined) {
      reasons.add("MISSING_COMPONENT");
      affectedComponents.add(definition.componentId);
      continue;
    }

    const scoreBps = normalizeScoreBps(definition.componentId, input.scoreBps);
    const evidence = validateEvidence(
      definition,
      input,
      evaluationAsOf,
      reasons,
      affectedComponents,
    );

    snapshots.push(
      Object.freeze({
        componentId: definition.componentId,
        scoreBps,
        weightBps: definition.weightBps,
        weightedContributionNumerator: scoreBps * definition.weightBps,
        reasonCodes: normalizeReasonCodes(definition.componentId, input.reasonCodes),
        evidence,
      }),
    );
  }

  return Object.freeze(snapshots);
}

type EvaluateScoreInput = Readonly<{
  assetId: string;
  evaluationAsOf: string;
  components: readonly ScoreComponentInput[];
}>;

type EvaluateOpportunityScoreInput = EvaluateScoreInput &
  Readonly<{
    valuation: ValuationEvaluationResult | null;
  }>;

function evaluateScore(
  kind: InvestmentScoreKind,
  methodology: InvestmentMethodology,
  definitions: readonly ScoreComponentDefinition[],
  input: EvaluateScoreInput,
  valuation: ValuationEvaluationResult | null,
  extraReasons: readonly InvestmentScoreInsufficientReason[] = [],
): InvestmentScoreResult {
  const assetId = AssetId.from(input.assetId).toString();
  const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
  const reasons = new Set<InvestmentScoreInsufficientReason>(extraReasons);
  const affectedComponents = new Set<string>();
  const components = scoreComponents(
    definitions,
    input.components,
    evaluationAsOf,
    reasons,
    affectedComponents,
  );

  if (reasons.size > 0) {
    return Object.freeze({
      status: "INSUFFICIENT_DATA",
      kind,
      assetId,
      evaluationAsOf,
      methodologyId: methodology.methodologyId,
      methodologyVersion: methodology.version,
      classification: methodology.classification,
      reasonCodes: Object.freeze([...reasons].sort()),
      affectedComponents: Object.freeze([...affectedComponents].sort()),
      components,
      valuation,
    });
  }

  const validValuation = valuation?.status === "VALUED" ? valuation : null;
  return Object.freeze({
    status: "SCORED",
    kind,
    assetId,
    scoreBps: aggregateScore(components),
    evaluationAsOf,
    methodologyId: methodology.methodologyId,
    methodologyVersion: methodology.version,
    classification: methodology.classification,
    components,
    valuation: validValuation,
  });
}

export function evaluateQualityScore(
  methodology: InvestmentMethodology,
  input: EvaluateScoreInput,
): InvestmentScoreResult {
  return evaluateScore("QUALITY", methodology, methodology.quality, input, null);
}

export function evaluateOpportunityScore(
  methodology: InvestmentMethodology,
  input: EvaluateOpportunityScoreInput,
): InvestmentScoreResult {
  const assetId = AssetId.from(input.assetId).toString();
  const reasons: InvestmentScoreInsufficientReason[] = [];

  if (input.valuation === null) {
    reasons.push("MISSING_VALUATION");
  } else if (input.valuation.status !== "VALUED") {
    reasons.push("INVALID_VALUATION");
  } else {
    const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
    if (input.valuation.evaluationAsOf > evaluationAsOf) reasons.push("INVALID_VALUATION");
    if (input.valuation.assetId !== assetId) reasons.push("VALUATION_ASSET_MISMATCH");
  }

  return evaluateScore(
    "OPPORTUNITY",
    methodology,
    methodology.opportunity,
    input,
    input.valuation,
    reasons,
  );
}

export function evaluateDividendScore(
  methodology: InvestmentMethodology,
  input: EvaluateScoreInput,
): DividendScoreResult {
  const assetId = AssetId.from(input.assetId).toString();
  const evaluationAsOf = normalizeEvaluationInstant("evaluationAsOf", input.evaluationAsOf);
  if (
    methodology.dividendApplicability === "NOT_APPLICABLE" ||
    (methodology.dividendApplicability === "OPTIONAL" && input.components.length === 0)
  ) {
    return Object.freeze({
      status: "NOT_APPLICABLE",
      kind: "DIVIDEND",
      assetId,
      evaluationAsOf,
      methodologyId: methodology.methodologyId,
      methodologyVersion: methodology.version,
      classification: methodology.classification,
    });
  }

  return evaluateScore("DIVIDEND", methodology, methodology.dividend, input, null);
}
