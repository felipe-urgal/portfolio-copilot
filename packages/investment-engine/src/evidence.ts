export type InvestmentEvidenceQualityFlag = "STALE" | "CONFLICT";

export type InvestmentInputProvenanceInput = Readonly<{
  provider: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  rawIdentifier?: string | null;
  normalizationVersion: string;
}>;

export type InvestmentInputProvenance = Readonly<{
  provider: string;
  sourceId: string | null;
  sourceUrl: string | null;
  rawIdentifier: string | null;
  normalizationVersion: string;
}>;

export type AnalyticalEvidenceInput = Readonly<{
  evidenceId: string;
  asOf: string;
  retrievedAt: string;
  provenance: InvestmentInputProvenanceInput;
  qualityFlags?: readonly InvestmentEvidenceQualityFlag[];
}>;

export type AnalyticalEvidenceSnapshot = Readonly<{
  evidenceId: string;
  asOf: string;
  retrievedAt: string;
  provenance: InvestmentInputProvenance;
  qualityFlags: readonly InvestmentEvidenceQualityFlag[];
}>;

export class InvalidInvestmentEvidenceError extends Error {
  public constructor(
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(`Invalid investment evidence field ${field}: ${JSON.stringify(value)}`);
    this.name = "InvalidInvestmentEvidenceError";
  }
}

const CANONICAL_UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const IDENTIFIER_PATTERN = /^[A-Z0-9][A-Z0-9._:-]{0,127}$/;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const NORMALIZATION_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MAX_TEXT_LENGTH = 512;

export function normalizeEvaluationInstant(field: string, value: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (
    !CANONICAL_UTC_INSTANT_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new InvalidInvestmentEvidenceError(field, value);
  }

  return normalized;
}

export function normalizeInvestmentIdentifier(field: string, value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new InvalidInvestmentEvidenceError(field, value);
  }

  return normalized;
}

function normalizeOptionalText(field: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_TEXT_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidInvestmentEvidenceError(field, value);
  }

  return normalized;
}

function normalizeProvider(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!PROVIDER_PATTERN.test(normalized)) {
    throw new InvalidInvestmentEvidenceError("provenance.provider", value);
  }

  return normalized;
}

function normalizeSourceUrl(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText("provenance.sourceUrl", value);
  if (normalized === null) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new InvalidInvestmentEvidenceError("provenance.sourceUrl", value);
  }

  if (
    (parsed.protocol !== "https:" && parsed.protocol !== "http:") ||
    parsed.username.length > 0 ||
    parsed.password.length > 0
  ) {
    throw new InvalidInvestmentEvidenceError("provenance.sourceUrl", value);
  }

  return parsed.toString();
}

function normalizeProvenance(input: InvestmentInputProvenanceInput): InvestmentInputProvenance {
  const normalizationVersion = input.normalizationVersion.trim();
  if (!NORMALIZATION_VERSION_PATTERN.test(normalizationVersion)) {
    throw new InvalidInvestmentEvidenceError(
      "provenance.normalizationVersion",
      input.normalizationVersion,
    );
  }

  return Object.freeze({
    provider: normalizeProvider(input.provider),
    sourceId: normalizeOptionalText("provenance.sourceId", input.sourceId),
    sourceUrl: normalizeSourceUrl(input.sourceUrl),
    rawIdentifier: normalizeOptionalText("provenance.rawIdentifier", input.rawIdentifier),
    normalizationVersion,
  });
}

function normalizeQualityFlags(
  qualityFlags: readonly InvestmentEvidenceQualityFlag[] | undefined,
): readonly InvestmentEvidenceQualityFlag[] {
  const normalized = new Set<InvestmentEvidenceQualityFlag>();
  for (const flag of qualityFlags ?? []) {
    if (flag !== "STALE" && flag !== "CONFLICT") {
      throw new InvalidInvestmentEvidenceError("qualityFlags", flag);
    }
    normalized.add(flag);
  }

  return Object.freeze([...normalized].sort());
}

export function createAnalyticalEvidence(
  input: AnalyticalEvidenceInput,
): AnalyticalEvidenceSnapshot {
  const asOf = normalizeEvaluationInstant("asOf", input.asOf);
  const retrievedAt = normalizeEvaluationInstant("retrievedAt", input.retrievedAt);
  if (retrievedAt < asOf) {
    throw new InvalidInvestmentEvidenceError("retrievedAt", input.retrievedAt);
  }

  return Object.freeze({
    evidenceId: normalizeInvestmentIdentifier("evidenceId", input.evidenceId),
    asOf,
    retrievedAt,
    provenance: normalizeProvenance(input.provenance),
    qualityFlags: normalizeQualityFlags(input.qualityFlags),
  });
}
