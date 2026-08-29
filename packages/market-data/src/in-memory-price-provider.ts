import { AssetId } from "@portfolio-copilot/domain";

import {
  foundMarketData,
  missingMarketData,
  type MarketDataProviderResult,
  type PriceProvider,
} from "./providers";
import { createPriceSnapshot, type PriceSnapshot } from "./snapshots";

export class InMemoryPriceProvider implements PriceProvider {
  private readonly snapshotsByAssetId: ReadonlyMap<string, PriceSnapshot>;

  public constructor(
    public readonly name: string,
    snapshots: readonly PriceSnapshot[],
  ) {
    const normalizedProvider = foundMarketData(name, null).provider;
    const entries = snapshots.map((snapshot) => {
      const canonical = createPriceSnapshot({
        assetId: snapshot.assetId,
        price: snapshot.price,
        currency: snapshot.currency,
        asOf: snapshot.asOf,
        retrievedAt: snapshot.retrievedAt,
        provenance: snapshot.provenance,
        qualityFlags: snapshot.qualityFlags,
      });
      if (canonical.provenance.provider !== normalizedProvider) {
        throw new TypeError(
          `In-memory price provenance provider ${canonical.provenance.provider} does not match adapter ${normalizedProvider}.`,
        );
      }

      const assetId = AssetId.from(canonical.assetId).toString();
      return [assetId, canonical] as const;
    });
    if (new Set(entries.map(([assetId]) => assetId)).size !== entries.length) {
      throw new TypeError("In-memory price provider cannot contain duplicate AssetIds.");
    }

    this.snapshotsByAssetId = new Map(entries);
  }

  public async fetchPrice(assetIdInput: string): Promise<MarketDataProviderResult<PriceSnapshot>> {
    const assetId = AssetId.from(assetIdInput).toString();
    const snapshot = this.snapshotsByAssetId.get(assetId);
    if (snapshot === undefined) {
      return missingMarketData(this.name, `No price snapshot available for AssetId ${assetId}.`);
    }

    return foundMarketData(this.name, snapshot);
  }
}
