import type { ExternalContentAuditStore } from "./audit-store";
import {
  ExternalSourceNotAllowedError,
  ExternalSourcePolicyRegistry,
  isAllowedSourceUrl,
  normalizeExternalIdentifier,
  type ExternalContentKind,
  type ExternalSourcePolicy,
} from "./source-policy";

export type ExternalContentParseFailureReason =
  | "MALFORMED_PAYLOAD"
  | "MISSING_REQUIRED_FIELD"
  | "UNSUPPORTED_CONTENT"
  | "ADAPTER_ERROR";

export type ParsedExternalContent = Readonly<{
  ingestionId: string;
  sourceDocumentId: string;
  kind: ExternalContentKind;
  title: string;
  body: string;
  asOf: string;
  retrievedAt: string;
  sourceUrl: string;
  metadata?: Readonly<Record<string, string>>;
}>;

export type ExternalContentParseResult =
  | Readonly<{ status: "PARSED"; content: ParsedExternalContent }>
  | Readonly<{
      status: "REJECTED";
      reasonCode: Exclude<ExternalContentParseFailureReason, "ADAPTER_ERROR">;
      detail?: string;
    }>;

export interface ExternalContentSourceAdapter<TRaw> {
  readonly sourceId: string;
  parse(raw: TRaw): ExternalContentParseResult | Promise<ExternalContentParseResult>;
}

export type ExternalContentThreatFlag =
  | "INSTRUCTION_OVERRIDE"
  | "SYSTEM_PROMPT_EXFILTRATION"
  | "TOOL_EXECUTION_REQUEST"
  | "AUTHORITY_SPOOFING";

export type ExternalContentQualityFlag = "STALE" | "SOURCE_MUTATION";
export type ExternalContentDuplicateReason = "CONTENT_FINGERPRINT" | "SOURCE_DOCUMENT_ID";
export type ExternalContentSecurityDisposition = "SAFE_FOR_ANALYSIS" | "QUARANTINED";
export type ExternalContentTrustBoundary = "UNTRUSTED_EXTERNAL_CONTENT";
export type ExternalContentInstructionAuthority = "NONE";

export type ExternalContentThesisReference = Readonly<{
  thesisId: string;
  assetId: string;
  version: number | null;
}>;

export type ExternalContentEventReference = Readonly<{
  eventId: string;
  thesisId: string;
  assetId: string;
  thesisVersion: number;
}>;

export type ExternalContentClassifierOutput =
  | Readonly<{
      status: "CLASSIFIED";
      assetIds: readonly string[];
      thesisRefs: readonly ExternalContentThesisReference[];
      eventRefs: readonly ExternalContentEventReference[];
    }>
  | Readonly<{
      status: "UNCLASSIFIED";
      reasonCodes: readonly string[];
    }>;

export type ExternalContentClassification =
  | Readonly<{
      status: "CLASSIFIED";
      classifierVersion: string;
      assetIds: readonly string[];
      thesisRefs: readonly ExternalContentThesisReference[];
      eventRefs: readonly ExternalContentEventReference[];
    }>
  | Readonly<{
      status: "UNCLASSIFIED";
      classifierVersion: string;
      reasonCodes: readonly string[];
    }>
  | Readonly<{
      status: "FAILED";
      classifierVersion: string;
      reasonCodes: readonly ("CLASSIFIER_ERROR" | "INVALID_CLASSIFICATION")[];
    }>
  | Readonly<{
      status: "SKIPPED_SECURITY";
      classifierVersion: string;
      reasonCodes: readonly ["QUARANTINED_CONTENT"];
    }>
  | Readonly<{
      status: "SKIPPED_DUPLICATE";
      classifierVersion: string;
      reasonCodes: readonly ["DUPLICATE_CONTENT"];
    }>;

export type ExternalContentForClassification = Readonly<{
  ingestionId: string;
  sourceId: string;
  kind: ExternalContentKind;
  title: string;
  body: string;
  asOf: string;
  trustBoundary: ExternalContentTrustBoundary;
  instructionAuthority: ExternalContentInstructionAuthority;
}>;

export interface ExternalContentClassifier {
  readonly version: string;
  classify(
    content: ExternalContentForClassification,
  ): ExternalContentClassifierOutput | Promise<ExternalContentClassifierOutput>;
}

export type ExternalContentAuditRecord = Readonly<{
  ingestionId: string;
  sourceId: string;
  provider: string;
  sourceDocumentId: string;
  sourceUrl: string;
  kind: ExternalContentKind;
  title: string;
  body: string;
  metadata: Readonly<Record<string, string>>;
  asOf: string;
  retrievedAt: string;
  retentionUntil: string;
  normalizationVersion: string;
  fingerprintSha256: string;
  duplicateOf: string | null;
  duplicateReason: ExternalContentDuplicateReason | null;
  revisionOf: string | null;
  qualityFlags: readonly ExternalContentQualityFlag[];
  threatFlags: readonly ExternalContentThreatFlag[];
  securityDisposition: ExternalContentSecurityDisposition;
  trustBoundary: ExternalContentTrustBoundary;
  instructionAuthority: ExternalContentInstructionAuthority;
  classification: ExternalContentClassification;
}>;

export type ExternalContentIngestionFailure = Readonly<{
  status: "REJECTED";
  sourceId: string;
  reasonCode:
    | ExternalContentParseFailureReason
    | "SOURCE_NOT_ALLOWED"
    | "INVALID_SOURCE_URL"
    | "CONTENT_KIND_NOT_ALLOWED"
    | "CONTENT_TOO_LARGE"
    | "INVALID_CONTENT";
  detail: string | null;
}>;

export type ExternalContentIngestionSuccess = Readonly<{
  status: "STORED";
  record: ExternalContentAuditRecord;
}>;

export type ExternalContentIngestionResult =
  | ExternalContentIngestionSuccess
  | ExternalContentIngestionFailure;

export type ExternalContentIngestionDependencies<TRaw> = Readonly<{
  registry: ExternalSourcePolicyRegistry;
  store: ExternalContentAuditStore;
  adapter: ExternalContentSourceAdapter<TRaw>;
  classifier: ExternalContentClassifier;
}>;

const CANONICAL_UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const CANONICAL_ASSET_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const CLASSIFIER_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const INVISIBLE_CONTROL_PATTERN = /[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g;
const METADATA_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const MAX_TITLE_CHARS = 512;
const MAX_METADATA_ENTRIES = 32;
const MAX_METADATA_VALUE_CHARS = 512;
const DAY_MILLISECONDS = 86_400_000;

const THREAT_PATTERNS: readonly Readonly<{
  flag: ExternalContentThreatFlag;
  pattern: RegExp;
}>[] = Object.freeze([
  {
    flag: "INSTRUCTION_OVERRIDE",
    pattern:
      /\b(?:ignore|disregard|forget|override)\b.{0,80}\b(?:previous|prior|system|developer|instructions?|rules?)\b/isu,
  },
  {
    flag: "SYSTEM_PROMPT_EXFILTRATION",
    pattern:
      /\b(?:system prompt|developer message|hidden instructions?|reveal (?:the )?prompt|show (?:the )?prompt)\b/isu,
  },
  {
    flag: "TOOL_EXECUTION_REQUEST",
    pattern:
      /\b(?:call|invoke|execute|run|use)\b.{0,60}\b(?:tool|shell|terminal|command|api|function)\b/isu,
  },
  {
    flag: "AUTHORITY_SPOOFING",
    pattern: /(?:<\/?\s*(?:system|developer|assistant)\b|\[(?:SYSTEM|INST|DEVELOPER)\])/iu,
  },
]);

function normalizeInstant(field: string, value: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (
    !CANONICAL_UTC_INSTANT_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new Error(`Invalid ${field}.`);
  }
  return normalized;
}

function normalizeAssetId(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!CANONICAL_ASSET_ID_PATTERN.test(normalized)) {
    throw new Error("Invalid classification assetId.");
  }
  return normalized;
}

function normalizeClassifierVersion(value: string): string {
  const normalized = value.trim();
  if (!CLASSIFIER_VERSION_PATTERN.test(normalized)) {
    throw new Error("Invalid classifier version.");
  }
  return normalized;
}

function normalizePlainText(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(CONTROL_CHARACTER_PATTERN, " ")
    .replace(INVISIBLE_CONTROL_PATTERN, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim();
}

function normalizeTitle(value: string): string {
  const normalized = normalizePlainText(value).replace(/\s*\n\s*/g, " ");
  if (normalized.length === 0 || normalized.length > MAX_TITLE_CHARS) {
    throw new Error("Invalid title.");
  }
  return normalized;
}

function normalizeSourceDocumentId(value: string): string {
  const normalized = normalizePlainText(value);
  if (normalized.length === 0 || normalized.length > 512) {
    throw new Error("Invalid sourceDocumentId.");
  }
  return normalized;
}

function normalizeMetadata(
  input: Readonly<Record<string, string>> | undefined,
): Readonly<Record<string, string>> {
  const entries = Object.entries(input ?? {});
  if (entries.length > MAX_METADATA_ENTRIES) {
    throw new Error("Too many metadata entries.");
  }

  const output: Record<string, string> = Object.create(null) as Record<string, string>;
  for (const [key, value] of entries) {
    if (
      !METADATA_KEY_PATTERN.test(key) ||
      key === "__proto__" ||
      key === "prototype" ||
      key === "constructor"
    ) {
      throw new Error("Invalid metadata key.");
    }
    const normalized = normalizePlainText(value);
    if (normalized.length === 0 || normalized.length > MAX_METADATA_VALUE_CHARS) {
      throw new Error("Invalid metadata value.");
    }
    output[key] = normalized;
  }

  return Object.freeze(output);
}

function scanThreats(values: readonly string[]): readonly ExternalContentThreatFlag[] {
  const text = values.join("\n");
  const flags = THREAT_PATTERNS.filter(({ pattern }) => pattern.test(text)).map(({ flag }) => flag);
  return Object.freeze([...new Set(flags)].sort());
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function addDays(instant: string, days: number): string {
  return new Date(new Date(instant).getTime() + days * DAY_MILLISECONDS).toISOString();
}

function isStale(policy: ExternalSourcePolicy, asOf: string, retrievedAt: string): boolean {
  return (
    new Date(retrievedAt).getTime() - new Date(asOf).getTime() >
    policy.staleAfterDays * DAY_MILLISECONDS
  );
}

function normalizeReasonCodes(values: readonly string[]): readonly string[] {
  if (values.length === 0) return Object.freeze(["NO_MATCH"]);
  const normalized = values.map((value) =>
    normalizeExternalIdentifier("classification.reasonCode", value),
  );
  return Object.freeze([...new Set(normalized)].sort());
}

function normalizePositiveVersion(field: string, value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`Invalid ${field}.`);
  }
  return value;
}

function normalizeClassificationOutput(
  version: string,
  output: ExternalContentClassifierOutput,
): ExternalContentClassification {
  if (output.status === "UNCLASSIFIED") {
    return Object.freeze({
      status: "UNCLASSIFIED",
      classifierVersion: version,
      reasonCodes: normalizeReasonCodes(output.reasonCodes),
    });
  }

  const assetIds = Object.freeze([...new Set(output.assetIds.map(normalizeAssetId))].sort());
  const thesisRefs = output.thesisRefs.map((reference) =>
    Object.freeze({
      thesisId: normalizeExternalIdentifier("classification.thesisId", reference.thesisId),
      assetId: normalizeAssetId(reference.assetId),
      version:
        reference.version === null
          ? null
          : normalizePositiveVersion("classification.thesisVersion", reference.version),
    }),
  );
  const eventRefs = output.eventRefs.map((reference) =>
    Object.freeze({
      eventId: normalizeExternalIdentifier("classification.eventId", reference.eventId),
      thesisId: normalizeExternalIdentifier("classification.thesisId", reference.thesisId),
      assetId: normalizeAssetId(reference.assetId),
      thesisVersion: normalizePositiveVersion(
        "classification.eventThesisVersion",
        reference.thesisVersion,
      ),
    }),
  );

  for (const reference of [...thesisRefs, ...eventRefs]) {
    if (!assetIds.includes(reference.assetId)) {
      throw new Error("Classification reference asset is absent from assetIds.");
    }
  }

  return Object.freeze({
    status: "CLASSIFIED",
    classifierVersion: version,
    assetIds,
    thesisRefs: Object.freeze(
      [...thesisRefs].sort((a, b) =>
        `${a.assetId}:${a.thesisId}:${a.version ?? 0}`.localeCompare(
          `${b.assetId}:${b.thesisId}:${b.version ?? 0}`,
        ),
      ),
    ),
    eventRefs: Object.freeze(
      [...eventRefs].sort((a, b) =>
        `${a.assetId}:${a.thesisId}:${a.eventId}:${a.thesisVersion}`.localeCompare(
          `${b.assetId}:${b.thesisId}:${b.eventId}:${b.thesisVersion}`,
        ),
      ),
    ),
  });
}

async function classifyContent(
  classifier: ExternalContentClassifier,
  content: ExternalContentForClassification,
  securityDisposition: ExternalContentSecurityDisposition,
  duplicateOf: string | null,
): Promise<ExternalContentClassification> {
  const classifierVersion = normalizeClassifierVersion(classifier.version);
  if (duplicateOf !== null) {
    return Object.freeze({
      status: "SKIPPED_DUPLICATE",
      classifierVersion,
      reasonCodes: Object.freeze(["DUPLICATE_CONTENT"] as const),
    });
  }
  if (securityDisposition === "QUARANTINED") {
    return Object.freeze({
      status: "SKIPPED_SECURITY",
      classifierVersion,
      reasonCodes: Object.freeze(["QUARANTINED_CONTENT"] as const),
    });
  }

  try {
    const output = await classifier.classify(content);
    try {
      return normalizeClassificationOutput(classifierVersion, output);
    } catch {
      return Object.freeze({
        status: "FAILED",
        classifierVersion,
        reasonCodes: Object.freeze(["INVALID_CLASSIFICATION"] as const),
      });
    }
  } catch {
    return Object.freeze({
      status: "FAILED",
      classifierVersion,
      reasonCodes: Object.freeze(["CLASSIFIER_ERROR"] as const),
    });
  }
}

function failure(
  sourceId: string,
  reasonCode: ExternalContentIngestionFailure["reasonCode"],
  detail: string | null,
): ExternalContentIngestionFailure {
  return Object.freeze({ status: "REJECTED", sourceId, reasonCode, detail });
}

export async function ingestExternalContent<TRaw>(
  dependencies: ExternalContentIngestionDependencies<TRaw>,
  raw: TRaw,
): Promise<ExternalContentIngestionResult> {
  let policy: ExternalSourcePolicy;
  try {
    policy = dependencies.registry.resolve(dependencies.adapter.sourceId);
  } catch (error) {
    if (error instanceof ExternalSourceNotAllowedError) {
      return failure(error.sourceId, "SOURCE_NOT_ALLOWED", error.message);
    }
    return failure(dependencies.adapter.sourceId, "SOURCE_NOT_ALLOWED", null);
  }

  let parsed: ExternalContentParseResult;
  try {
    parsed = await dependencies.adapter.parse(raw);
  } catch {
    return failure(policy.sourceId, "ADAPTER_ERROR", null);
  }
  if (parsed.status === "REJECTED") {
    return failure(policy.sourceId, parsed.reasonCode, parsed.detail ?? null);
  }

  const input = parsed.content;
  if (!policy.allowedKinds.includes(input.kind)) {
    return failure(policy.sourceId, "CONTENT_KIND_NOT_ALLOWED", input.kind);
  }
  if (!isAllowedSourceUrl(policy, input.sourceUrl)) {
    return failure(policy.sourceId, "INVALID_SOURCE_URL", null);
  }
  if (input.body.length > policy.maxContentChars) {
    return failure(policy.sourceId, "CONTENT_TOO_LARGE", null);
  }

  try {
    const ingestionId = normalizeExternalIdentifier("ingestionId", input.ingestionId);
    const sourceDocumentId = normalizeSourceDocumentId(input.sourceDocumentId);
    const title = normalizeTitle(input.title);
    const body = normalizePlainText(input.body);
    if (body.length === 0 || body.length > policy.maxContentChars) {
      return failure(policy.sourceId, "CONTENT_TOO_LARGE", null);
    }
    const asOf = normalizeInstant("asOf", input.asOf);
    const retrievedAt = normalizeInstant("retrievedAt", input.retrievedAt);
    if (retrievedAt < asOf) {
      return failure(policy.sourceId, "INVALID_CONTENT", "retrievedAt cannot precede asOf.");
    }
    const metadata = normalizeMetadata(input.metadata);
    const sourceUrl = new URL(input.sourceUrl).toString();
    const fingerprintSha256 = await sha256Hex(JSON.stringify([input.kind, title, body]));

    const sourceMatch = await dependencies.store.findLatestBySourceDocument(
      policy.sourceId,
      sourceDocumentId,
    );
    const fingerprintMatch = await dependencies.store.findByFingerprint(fingerprintSha256);
    let duplicateOf: string | null = null;
    let duplicateReason: ExternalContentDuplicateReason | null = null;
    let revisionOf: string | null = null;
    const qualityFlags = new Set<ExternalContentQualityFlag>();

    if (isStale(policy, asOf, retrievedAt)) qualityFlags.add("STALE");
    if (sourceMatch !== null) {
      if (sourceMatch.fingerprintSha256 === fingerprintSha256) {
        duplicateOf = sourceMatch.ingestionId;
        duplicateReason = "SOURCE_DOCUMENT_ID";
      } else {
        revisionOf = sourceMatch.ingestionId;
        qualityFlags.add("SOURCE_MUTATION");
      }
    }
    if (duplicateOf === null && fingerprintMatch !== null) {
      duplicateOf = fingerprintMatch.ingestionId;
      duplicateReason = "CONTENT_FINGERPRINT";
    }

    const threatFlags = scanThreats([title, body, ...Object.values(metadata)]);
    const securityDisposition: ExternalContentSecurityDisposition =
      threatFlags.length === 0 ? "SAFE_FOR_ANALYSIS" : "QUARANTINED";
    const classificationInput: ExternalContentForClassification = Object.freeze({
      ingestionId,
      sourceId: policy.sourceId,
      kind: input.kind,
      title,
      body,
      asOf,
      trustBoundary: "UNTRUSTED_EXTERNAL_CONTENT",
      instructionAuthority: "NONE",
    });
    const classification = await classifyContent(
      dependencies.classifier,
      classificationInput,
      securityDisposition,
      duplicateOf,
    );

    const record: ExternalContentAuditRecord = Object.freeze({
      ingestionId,
      sourceId: policy.sourceId,
      provider: policy.provider,
      sourceDocumentId,
      sourceUrl,
      kind: input.kind,
      title,
      body,
      metadata,
      asOf,
      retrievedAt,
      retentionUntil: addDays(retrievedAt, policy.retentionDays),
      normalizationVersion: policy.normalizationVersion,
      fingerprintSha256,
      duplicateOf,
      duplicateReason,
      revisionOf,
      qualityFlags: Object.freeze([...qualityFlags].sort()),
      threatFlags,
      securityDisposition,
      trustBoundary: "UNTRUSTED_EXTERNAL_CONTENT",
      instructionAuthority: "NONE",
      classification,
    });

    await dependencies.store.append(record);
    return Object.freeze({ status: "STORED", record });
  } catch (error) {
    return failure(
      policy.sourceId,
      "INVALID_CONTENT",
      error instanceof Error ? error.message : null,
    );
  }
}
