import type { ExternalContentAuditRecord } from "./ingestion";

export interface ExternalContentAuditStore {
  findByFingerprint(fingerprintSha256: string): Promise<ExternalContentAuditRecord | null>;
  findLatestBySourceDocument(
    sourceId: string,
    sourceDocumentId: string,
  ): Promise<ExternalContentAuditRecord | null>;
  append(record: ExternalContentAuditRecord): Promise<void>;
}

export class DuplicateExternalContentIngestionIdError extends Error {
  public constructor(public readonly ingestionId: string) {
    super(`External content ingestion ${ingestionId} already exists.`);
    this.name = "DuplicateExternalContentIngestionIdError";
  }
}

export class InMemoryExternalContentAuditStore implements ExternalContentAuditStore {
  readonly #records = new Map<string, ExternalContentAuditRecord>();

  public async findByFingerprint(
    fingerprintSha256: string,
  ): Promise<ExternalContentAuditRecord | null> {
    for (const record of this.#records.values()) {
      if (record.fingerprintSha256 === fingerprintSha256) return record;
    }
    return null;
  }

  public async findLatestBySourceDocument(
    sourceId: string,
    sourceDocumentId: string,
  ): Promise<ExternalContentAuditRecord | null> {
    let latest: ExternalContentAuditRecord | null = null;
    for (const record of this.#records.values()) {
      if (record.sourceId !== sourceId || record.sourceDocumentId !== sourceDocumentId) continue;
      if (
        latest === null ||
        record.retrievedAt > latest.retrievedAt ||
        (record.retrievedAt === latest.retrievedAt && record.ingestionId > latest.ingestionId)
      ) {
        latest = record;
      }
    }
    return latest;
  }

  public async append(record: ExternalContentAuditRecord): Promise<void> {
    if (this.#records.has(record.ingestionId)) {
      throw new DuplicateExternalContentIngestionIdError(record.ingestionId);
    }
    this.#records.set(record.ingestionId, record);
  }

  public list(): readonly ExternalContentAuditRecord[] {
    return Object.freeze(
      [...this.#records.values()].sort((left, right) =>
        left.retrievedAt === right.retrievedAt
          ? left.ingestionId.localeCompare(right.ingestionId)
          : left.retrievedAt.localeCompare(right.retrievedAt),
      ),
    );
  }
}
