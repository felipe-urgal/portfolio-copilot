import type { ExternalContentAuditStore } from "./audit-store";
import type { ExternalContentKind, ExternalSourcePolicyRegistry } from "./source-policy";

export type ExternalContentParseFailureReason =
  "MALFORMED_PAYLOAD" | "MISSING_REQUIRED_FIELD" | "UNSUPPORTED_CONTENT" | "ADAPTER_ERROR";

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
export type ExternalContentSecurityDisposition = "PASSED_INITIAL_SCREENING" | "QUARANTINED";
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
  ExternalContentIngestionSuccess | ExternalContentIngestionFailure;

export type ExternalContentIngestionDependencies<TRaw> = Readonly<{
  registry: ExternalSourcePolicyRegistry;
  store: ExternalContentAuditStore;
  adapter: ExternalContentSourceAdapter<TRaw>;
  classifier: ExternalContentClassifier;
}>;
