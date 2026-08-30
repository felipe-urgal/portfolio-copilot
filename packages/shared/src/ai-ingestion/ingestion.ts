import type { ExternalContentAuditStore } from "./audit-store";
import { classifyExternalContent } from "./classification";
import {
  addPolicyDays,
  isExternalContentStale,
  normalizeExternalInstant,
  normalizeExternalMetadata,
  normalizeExternalPlainText,
  normalizeExternalTitle,
  normalizeSourceDocumentId,
  scanExternalContentThreats,
  sha256Hex,
} from "./normalization";
import {
  ExternalSourceNotAllowedError,
  ExternalSourcePolicyRegistry,
  isAllowedSourceUrl,
  normalizeExternalIdentifier,
  type ExternalSourcePolicy,
} from "./source-policy";
import type {
  ExternalContentAuditRecord,
  ExternalContentClassifier,
  ExternalContentDuplicateReason,
  ExternalContentForClassification,
  ExternalContentIngestionFailure,
  ExternalContentIngestionResult,
  ExternalContentParseResult,
  ExternalContentQualityFlag,
  ExternalContentSecurityDisposition,
  ExternalContentSourceAdapter,
} from "./types";

export type ExternalContentIngestionDependencies<TRaw> = Readonly<{
  registry: ExternalSourcePolicyRegistry;
  store: ExternalContentAuditStore;
  adapter: ExternalContentSourceAdapter<TRaw>;
  classifier: ExternalContentClassifier;
}>;

function failure(
  sourceId: string,
  reasonCode: ExternalContentIngestionFailure["reasonCode"],
  detail: string | null,
): ExternalContentIngestionFailure {
  return Object.freeze({ status: "REJECTED", sourceId, reasonCode, detail });
}

async function parseWithAdapter<TRaw>(
  policy: ExternalSourcePolicy,
  adapter: ExternalContentSourceAdapter<TRaw>,
  raw: TRaw,
): Promise<ExternalContentParseResult | ExternalContentIngestionFailure> {
  try {
    return await adapter.parse(raw);
  } catch {
    return failure(policy.sourceId, "ADAPTER_ERROR", null);
  }
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

  const parsed = await parseWithAdapter(policy, dependencies.adapter, raw);
  if (parsed.status === "REJECTED") {
    if ("sourceId" in parsed) return parsed;
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
    const title = normalizeExternalTitle(input.title);
    const body = normalizeExternalPlainText(input.body);
    if (body.length === 0 || body.length > policy.maxContentChars) {
      return failure(policy.sourceId, "CONTENT_TOO_LARGE", null);
    }

    const asOf = normalizeExternalInstant("asOf", input.asOf);
    const retrievedAt = normalizeExternalInstant("retrievedAt", input.retrievedAt);
    if (retrievedAt < asOf) {
      return failure(policy.sourceId, "INVALID_CONTENT", "retrievedAt cannot precede asOf.");
    }

    const metadata = normalizeExternalMetadata(input.metadata);
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

    if (isExternalContentStale(policy, asOf, retrievedAt)) {
      qualityFlags.add("STALE");
    }

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

    const threatFlags = scanExternalContentThreats([title, body, ...Object.values(metadata)]);
    const securityDisposition: ExternalContentSecurityDisposition =
      threatFlags.length === 0 ? "PASSED_INITIAL_SCREENING" : "QUARANTINED";
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
    const classification = await classifyExternalContent(
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
      retentionUntil: addPolicyDays(retrievedAt, policy.retentionDays),
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
