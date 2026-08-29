import { AssetCatalogEntry, type AssetCatalogEntryInput } from "./asset-catalog";
import { DuplicateAssetCatalogAssetIdError } from "./asset-catalog-errors";
import { AssetId } from "./asset-id";
import {
  ExternalAssetIdentifier,
  type ExternalAssetIdentifierSnapshot,
} from "./external-asset-identifier";

export type AssetIdentityEvidence = Readonly<{
  identifier: ExternalAssetIdentifierSnapshot;
  candidateAssetIds: readonly string[];
}>;

export type AssetIdentityResolution =
  | Readonly<{
      outcome: "UNMATCHED";
      evidence: readonly AssetIdentityEvidence[];
    }>
  | Readonly<{
      outcome: "MATCH";
      assetId: string;
      evidence: readonly AssetIdentityEvidence[];
    }>
  | Readonly<{
      outcome: "CONFLICT";
      candidateAssetIds: readonly string[];
      evidence: readonly AssetIdentityEvidence[];
    }>;

export interface AssetCatalog {
  list(): readonly AssetCatalogEntry[];
  getById(assetId: AssetId | string): AssetCatalogEntry | null;
  resolve(identifiers: readonly ExternalAssetIdentifier[]): AssetIdentityResolution;
}

function toAssetId(value: AssetId | string): AssetId {
  return typeof value === "string" ? AssetId.from(value) : value;
}

function sortedUnique(values: Iterable<string>): readonly string[] {
  return Object.freeze([...new Set(values)].sort((left, right) => left.localeCompare(right)));
}

export class InMemoryAssetCatalogAdapter implements AssetCatalog {
  private readonly entriesByAssetId: ReadonlyMap<string, AssetCatalogEntry>;
  private readonly assetIdsByIdentifier: ReadonlyMap<string, readonly string[]>;
  private readonly orderedEntries: readonly AssetCatalogEntry[];

  private constructor(entries: readonly AssetCatalogEntry[]) {
    const entriesByAssetId = new Map<string, AssetCatalogEntry>();
    const assetIdsByIdentifier = new Map<string, Set<string>>();

    for (const entry of entries) {
      const assetId = entry.asset.id.toString();
      if (entriesByAssetId.has(assetId)) {
        throw new DuplicateAssetCatalogAssetIdError(assetId);
      }
      entriesByAssetId.set(assetId, entry);

      for (const identifier of entry.identityIdentifiers()) {
        const candidates = assetIdsByIdentifier.get(identifier.key()) ?? new Set<string>();
        candidates.add(assetId);
        assetIdsByIdentifier.set(identifier.key(), candidates);
      }
    }

    this.entriesByAssetId = entriesByAssetId;
    this.assetIdsByIdentifier = new Map(
      [...assetIdsByIdentifier.entries()].map(([key, assetIds]) => [key, sortedUnique(assetIds)]),
    );
    this.orderedEntries = Object.freeze(
      [...entries].sort((left, right) =>
        left.asset.id.toString().localeCompare(right.asset.id.toString()),
      ),
    );
  }

  public static create(inputs: readonly AssetCatalogEntryInput[]): InMemoryAssetCatalogAdapter {
    return new InMemoryAssetCatalogAdapter(inputs.map((input) => AssetCatalogEntry.create(input)));
  }

  public list(): readonly AssetCatalogEntry[] {
    return this.orderedEntries;
  }

  public getById(assetId: AssetId | string): AssetCatalogEntry | null {
    return this.entriesByAssetId.get(toAssetId(assetId).toString()) ?? null;
  }

  public resolve(identifiers: readonly ExternalAssetIdentifier[]): AssetIdentityResolution {
    const queryByKey = new Map<string, ExternalAssetIdentifier>();
    for (const identifier of identifiers) queryByKey.set(identifier.key(), identifier);

    const orderedIdentifiers = [...queryByKey.values()].sort((left, right) =>
      left.key().localeCompare(right.key()),
    );
    const candidateAssetIds = new Set<string>();
    const evidence = orderedIdentifiers.map((identifier) => {
      const candidates = this.assetIdsByIdentifier.get(identifier.key()) ?? Object.freeze([]);
      for (const candidate of candidates) candidateAssetIds.add(candidate);

      return Object.freeze({
        identifier: identifier.toSnapshot(),
        candidateAssetIds: candidates,
      });
    });
    const candidates = sortedUnique(candidateAssetIds);
    const frozenEvidence = Object.freeze(evidence);

    if (candidates.length === 0) {
      return { outcome: "UNMATCHED", evidence: frozenEvidence };
    }

    if (candidates.length === 1) {
      return { outcome: "MATCH", assetId: candidates[0]!, evidence: frozenEvidence };
    }

    return {
      outcome: "CONFLICT",
      candidateAssetIds: candidates,
      evidence: frozenEvidence,
    };
  }
}
