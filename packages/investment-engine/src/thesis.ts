import { AssetId } from "@portfolio-copilot/domain";

import {
  createAnalyticalEvidence,
  normalizeEvaluationInstant,
  normalizeInvestmentIdentifier,
  type AnalyticalEvidenceInput,
  type AnalyticalEvidenceSnapshot,
} from "./evidence";

export type InvestmentThesisReviewPolicyInput = Readonly<{
  intervalDays: number;
}>;

export type InvestmentThesisReviewPolicy = Readonly<{
  intervalDays: number;
}>;

export type InvestmentThesisFactInput = Readonly<{
  factId: string;
  statement: string;
  evidence: readonly (AnalyticalEvidenceInput | AnalyticalEvidenceSnapshot)[];
}>;

export type InvestmentThesisFactSnapshot = Readonly<{
  factId: string;
  statement: string;
  evidence: readonly AnalyticalEvidenceSnapshot[];
}>;

export type InvestmentThesisAnalyticalPointInput = Readonly<{
  pointId: string;
  statement: string;
  supportingFactIds: readonly string[];
}>;

export type InvestmentThesisAnalyticalPointSnapshot = Readonly<{
  pointId: string;
  statement: string;
  supportingFactIds: readonly string[];
}>;

export type InvestmentThesisIndicatorInput = Readonly<{
  indicatorId: string;
  name: string;
  description: string;
}>;

export type InvestmentThesisIndicatorSnapshot = Readonly<{
  indicatorId: string;
  name: string;
  description: string;
}>;

export type InvestmentThesisInvalidationCriterionInput = Readonly<{
  criterionId: string;
  description: string;
  indicatorIds: readonly string[];
}>;

export type InvestmentThesisInvalidationCriterionSnapshot = Readonly<{
  criterionId: string;
  description: string;
  indicatorIds: readonly string[];
}>;

export type InvestmentThesisContentInput = Readonly<{
  thesisStatement: string;
  facts: readonly InvestmentThesisFactInput[];
  drivers: readonly InvestmentThesisAnalyticalPointInput[];
  risks: readonly InvestmentThesisAnalyticalPointInput[];
  monitoredIndicators: readonly InvestmentThesisIndicatorInput[];
  invalidationCriteria: readonly InvestmentThesisInvalidationCriterionInput[];
  reviewPolicy: InvestmentThesisReviewPolicyInput;
}>;

export type CreateInvestmentThesisInput = InvestmentThesisContentInput &
  Readonly<{
    thesisId: string;
    assetId: string;
    createdAt: string;
    effectiveAt: string;
  }>;

export type ReviseInvestmentThesisInput = InvestmentThesisContentInput &
  Readonly<{
    createdAt: string;
    effectiveAt: string;
    revisionReason: string;
  }>;

export type InvestmentThesisSnapshot = Readonly<{
  thesisId: string;
  assetId: string;
  version: number;
  previousVersion: number | null;
  createdAt: string;
  effectiveAt: string;
  revisionReason: string | null;
  thesisStatement: string;
  facts: readonly InvestmentThesisFactSnapshot[];
  drivers: readonly InvestmentThesisAnalyticalPointSnapshot[];
  risks: readonly InvestmentThesisAnalyticalPointSnapshot[];
  monitoredIndicators: readonly InvestmentThesisIndicatorSnapshot[];
  invalidationCriteria: readonly InvestmentThesisInvalidationCriterionSnapshot[];
  reviewPolicy: InvestmentThesisReviewPolicy;
}>;

export class InvalidInvestmentThesisInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidInvestmentThesisInputError";
  }
}

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const MAX_STATEMENT_LENGTH = 2_000;
const MAX_SHORT_TEXT_LENGTH = 256;

function normalizeText(field: string, value: string, maxLength: number): string {
  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > maxLength ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidInvestmentThesisInputError(`Invalid ${field}.`);
  }
  return normalized;
}

function normalizeUniqueIds(field: string, values: readonly string[]): readonly string[] {
  if (values.length === 0) {
    throw new InvalidInvestmentThesisInputError(`${field} requires at least one identifier.`);
  }

  const normalized = values.map((value) => normalizeInvestmentIdentifier(field, value));
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new InvalidInvestmentThesisInputError(`${field} contains duplicate identifiers.`);
  }
  return Object.freeze([...normalized].sort());
}

function normalizeReviewPolicy(input: InvestmentThesisReviewPolicyInput): InvestmentThesisReviewPolicy {
  if (!Number.isSafeInteger(input.intervalDays) || input.intervalDays <= 0 || input.intervalDays > 3_650) {
    throw new InvalidInvestmentThesisInputError(
      `Invalid review interval: ${String(input.intervalDays)}.`,
    );
  }

  return Object.freeze({ intervalDays: input.intervalDays });
}

function normalizeFacts(
  inputs: readonly InvestmentThesisFactInput[],
  createdAt: string,
): readonly InvestmentThesisFactSnapshot[] {
  if (inputs.length === 0) {
    throw new InvalidInvestmentThesisInputError("Investment thesis requires at least one fact.");
  }

  const facts = inputs.map((input) => {
    if (input.evidence.length === 0) {
      throw new InvalidInvestmentThesisInputError(
        `Thesis fact ${input.factId} requires provenance evidence.`,
      );
    }

    const evidence = input.evidence.map((entry) => createAnalyticalEvidence(entry));
    for (const entry of evidence) {
      if (entry.asOf > createdAt || entry.retrievedAt > createdAt) {
        throw new InvalidInvestmentThesisInputError(
          `Thesis fact ${input.factId} contains look-ahead evidence.`,
        );
      }
    }

    return Object.freeze({
      factId: normalizeInvestmentIdentifier("factId", input.factId),
      statement: normalizeText("fact statement", input.statement, MAX_STATEMENT_LENGTH),
      evidence: Object.freeze(evidence),
    });
  });

  if (new Set(facts.map((fact) => fact.factId)).size !== facts.length) {
    throw new InvalidInvestmentThesisInputError("Investment thesis contains duplicate fact ids.");
  }

  return Object.freeze([...facts].sort((left, right) => left.factId.localeCompare(right.factId)));
}

function normalizeAnalyticalPoints(
  field: "drivers" | "risks",
  inputs: readonly InvestmentThesisAnalyticalPointInput[],
  factIds: ReadonlySet<string>,
): readonly InvestmentThesisAnalyticalPointSnapshot[] {
  if (inputs.length === 0) {
    throw new InvalidInvestmentThesisInputError(`Investment thesis requires at least one ${field}.`);
  }

  const points = inputs.map((input) => {
    const pointId = normalizeInvestmentIdentifier(`${field}.pointId`, input.pointId);
    const supportingFactIds = normalizeUniqueIds(
      `${field}.${pointId}.supportingFactIds`,
      input.supportingFactIds,
    );
    for (const factId of supportingFactIds) {
      if (!factIds.has(factId)) {
        throw new InvalidInvestmentThesisInputError(
          `${field} point ${pointId} references unknown fact ${factId}.`,
        );
      }
    }

    return Object.freeze({
      pointId,
      statement: normalizeText(`${field}.${pointId}.statement`, input.statement, MAX_STATEMENT_LENGTH),
      supportingFactIds,
    });
  });

  if (new Set(points.map((point) => point.pointId)).size !== points.length) {
    throw new InvalidInvestmentThesisInputError(`Investment thesis contains duplicate ${field} ids.`);
  }

  return Object.freeze([...points].sort((left, right) => left.pointId.localeCompare(right.pointId)));
}

function normalizeIndicators(
  inputs: readonly InvestmentThesisIndicatorInput[],
): readonly InvestmentThesisIndicatorSnapshot[] {
  if (inputs.length === 0) {
    throw new InvalidInvestmentThesisInputError(
      "Investment thesis requires at least one monitored indicator.",
    );
  }

  const indicators = inputs.map((input) =>
    Object.freeze({
      indicatorId: normalizeInvestmentIdentifier("indicatorId", input.indicatorId),
      name: normalizeText("indicator name", input.name, MAX_SHORT_TEXT_LENGTH),
      description: normalizeText("indicator description", input.description, MAX_STATEMENT_LENGTH),
    }),
  );

  if (new Set(indicators.map((indicator) => indicator.indicatorId)).size !== indicators.length) {
    throw new InvalidInvestmentThesisInputError("Investment thesis contains duplicate indicator ids.");
  }

  return Object.freeze(
    [...indicators].sort((left, right) => left.indicatorId.localeCompare(right.indicatorId)),
  );
}

function normalizeInvalidationCriteria(
  inputs: readonly InvestmentThesisInvalidationCriterionInput[],
  indicatorIds: ReadonlySet<string>,
): readonly InvestmentThesisInvalidationCriterionSnapshot[] {
  if (inputs.length === 0) {
    throw new InvalidInvestmentThesisInputError(
      "Investment thesis requires at least one invalidation criterion.",
    );
  }

  const criteria = inputs.map((input) => {
    const criterionId = normalizeInvestmentIdentifier("criterionId", input.criterionId);
    const referencedIndicatorIds = normalizeUniqueIds(
      `criterion.${criterionId}.indicatorIds`,
      input.indicatorIds,
    );
    for (const indicatorId of referencedIndicatorIds) {
      if (!indicatorIds.has(indicatorId)) {
        throw new InvalidInvestmentThesisInputError(
          `Invalidation criterion ${criterionId} references unknown indicator ${indicatorId}.`,
        );
      }
    }

    return Object.freeze({
      criterionId,
      description: normalizeText(
        `criterion.${criterionId}.description`,
        input.description,
        MAX_STATEMENT_LENGTH,
      ),
      indicatorIds: referencedIndicatorIds,
    });
  });

  if (new Set(criteria.map((criterion) => criterion.criterionId)).size !== criteria.length) {
    throw new InvalidInvestmentThesisInputError(
      "Investment thesis contains duplicate invalidation criterion ids.",
    );
  }

  return Object.freeze(
    [...criteria].sort((left, right) => left.criterionId.localeCompare(right.criterionId)),
  );
}

function normalizeContent(
  input: InvestmentThesisContentInput,
  createdAt: string,
): Readonly<
  Pick<
    InvestmentThesisSnapshot,
    | "thesisStatement"
    | "facts"
    | "drivers"
    | "risks"
    | "monitoredIndicators"
    | "invalidationCriteria"
    | "reviewPolicy"
  >
> {
  const facts = normalizeFacts(input.facts, createdAt);
  const factIds = new Set(facts.map((fact) => fact.factId));
  const monitoredIndicators = normalizeIndicators(input.monitoredIndicators);
  const indicatorIds = new Set(monitoredIndicators.map((indicator) => indicator.indicatorId));

  return Object.freeze({
    thesisStatement: normalizeText("thesis statement", input.thesisStatement, MAX_STATEMENT_LENGTH),
    facts,
    drivers: normalizeAnalyticalPoints("drivers", input.drivers, factIds),
    risks: normalizeAnalyticalPoints("risks", input.risks, factIds),
    monitoredIndicators,
    invalidationCriteria: normalizeInvalidationCriteria(input.invalidationCriteria, indicatorIds),
    reviewPolicy: normalizeReviewPolicy(input.reviewPolicy),
  });
}

function normalizeVersionInstants(
  createdAtInput: string,
  effectiveAtInput: string,
): Readonly<{ createdAt: string; effectiveAt: string }> {
  const createdAt = normalizeEvaluationInstant("createdAt", createdAtInput);
  const effectiveAt = normalizeEvaluationInstant("effectiveAt", effectiveAtInput);
  if (effectiveAt < createdAt) {
    throw new InvalidInvestmentThesisInputError("Thesis effectiveAt cannot precede createdAt.");
  }
  return Object.freeze({ createdAt, effectiveAt });
}

export function createInvestmentThesis(input: CreateInvestmentThesisInput): InvestmentThesisSnapshot {
  const thesisId = normalizeInvestmentIdentifier("thesisId", input.thesisId);
  const assetId = AssetId.from(input.assetId).toString();
  const { createdAt, effectiveAt } = normalizeVersionInstants(input.createdAt, input.effectiveAt);
  const content = normalizeContent(input, createdAt);

  return Object.freeze({
    thesisId,
    assetId,
    version: 1,
    previousVersion: null,
    createdAt,
    effectiveAt,
    revisionReason: null,
    ...content,
  });
}

export function reviseInvestmentThesis(
  previous: InvestmentThesisSnapshot,
  input: ReviseInvestmentThesisInput,
): InvestmentThesisSnapshot {
  const { createdAt, effectiveAt } = normalizeVersionInstants(input.createdAt, input.effectiveAt);
  if (createdAt < previous.createdAt || effectiveAt <= previous.effectiveAt) {
    throw new InvalidInvestmentThesisInputError(
      "A revised thesis must be created no earlier than the previous version and become effective later.",
    );
  }

  const content = normalizeContent(input, createdAt);

  return Object.freeze({
    thesisId: previous.thesisId,
    assetId: previous.assetId,
    version: previous.version + 1,
    previousVersion: previous.version,
    createdAt,
    effectiveAt,
    revisionReason: normalizeText("revision reason", input.revisionReason, MAX_STATEMENT_LENGTH),
    ...content,
  });
}
