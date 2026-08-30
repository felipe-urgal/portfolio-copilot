import {
  normalizeClassificationReasonCodes,
  normalizeClassifierVersion,
  normalizeExternalAssetId,
  normalizePositiveVersion,
} from "./normalization";
import { normalizeExternalIdentifier } from "./source-policy";
import type {
  ExternalContentClassification,
  ExternalContentClassifier,
  ExternalContentClassifierOutput,
  ExternalContentEventReference,
  ExternalContentForClassification,
  ExternalContentSecurityDisposition,
  ExternalContentThesisReference,
} from "./types";

function dedupeThesisReferences(
  references: readonly ExternalContentThesisReference[],
): readonly ExternalContentThesisReference[] {
  const unique = new Map<string, ExternalContentThesisReference>();
  for (const reference of references) {
    const normalized = Object.freeze({
      thesisId: normalizeExternalIdentifier("classification.thesisId", reference.thesisId),
      assetId: normalizeExternalAssetId(reference.assetId),
      version:
        reference.version === null
          ? null
          : normalizePositiveVersion("classification.thesisVersion", reference.version),
    });
    unique.set(
      `${normalized.assetId}:${normalized.thesisId}:${normalized.version ?? 0}`,
      normalized,
    );
  }

  return Object.freeze(
    [...unique.values()].sort((left, right) => {
      const leftKey = `${left.assetId}:${left.thesisId}:${left.version ?? 0}`;
      const rightKey = `${right.assetId}:${right.thesisId}:${right.version ?? 0}`;
      return leftKey.localeCompare(rightKey);
    }),
  );
}

function dedupeEventReferences(
  references: readonly ExternalContentEventReference[],
): readonly ExternalContentEventReference[] {
  const unique = new Map<string, ExternalContentEventReference>();
  for (const reference of references) {
    const normalized = Object.freeze({
      eventId: normalizeExternalIdentifier("classification.eventId", reference.eventId),
      thesisId: normalizeExternalIdentifier("classification.thesisId", reference.thesisId),
      assetId: normalizeExternalAssetId(reference.assetId),
      thesisVersion: normalizePositiveVersion(
        "classification.eventThesisVersion",
        reference.thesisVersion,
      ),
    });
    unique.set(
      `${normalized.assetId}:${normalized.thesisId}:${normalized.eventId}:${normalized.thesisVersion}`,
      normalized,
    );
  }

  return Object.freeze(
    [...unique.values()].sort((left, right) => {
      const leftKey = `${left.assetId}:${left.thesisId}:${left.eventId}:${left.thesisVersion}`;
      const rightKey = `${right.assetId}:${right.thesisId}:${right.eventId}:${right.thesisVersion}`;
      return leftKey.localeCompare(rightKey);
    }),
  );
}

function normalizeClassificationOutput(
  classifierVersion: string,
  output: ExternalContentClassifierOutput,
): ExternalContentClassification {
  if (output.status === "UNCLASSIFIED") {
    return Object.freeze({
      status: "UNCLASSIFIED",
      classifierVersion,
      reasonCodes: normalizeClassificationReasonCodes(output.reasonCodes),
    });
  }

  const assetIds = Object.freeze(
    [...new Set(output.assetIds.map(normalizeExternalAssetId))].sort(),
  );
  if (assetIds.length === 0) {
    throw new Error("CLASSIFIED output must contain at least one assetId.");
  }

  const thesisRefs = dedupeThesisReferences(output.thesisRefs);
  const eventRefs = dedupeEventReferences(output.eventRefs);
  for (const reference of [...thesisRefs, ...eventRefs]) {
    if (!assetIds.includes(reference.assetId)) {
      throw new Error("Classification reference asset is absent from assetIds.");
    }
  }

  return Object.freeze({
    status: "CLASSIFIED",
    classifierVersion,
    assetIds,
    thesisRefs,
    eventRefs,
  });
}

export async function classifyExternalContent(
  classifier: ExternalContentClassifier,
  content: ExternalContentForClassification,
  securityDisposition: ExternalContentSecurityDisposition,
  duplicateOf: string | null,
): Promise<ExternalContentClassification> {
  const classifierVersion = normalizeClassifierVersion(classifier.version);

  if (securityDisposition === "QUARANTINED") {
    return Object.freeze({
      status: "SKIPPED_SECURITY",
      classifierVersion,
      reasonCodes: Object.freeze(["QUARANTINED_CONTENT"] as const),
    });
  }

  if (duplicateOf !== null) {
    return Object.freeze({
      status: "SKIPPED_DUPLICATE",
      classifierVersion,
      reasonCodes: Object.freeze(["DUPLICATE_CONTENT"] as const),
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
