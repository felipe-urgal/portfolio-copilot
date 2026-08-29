import { describe, expect, it } from "vitest";

import {
  AssetCatalogEntry,
  DuplicateAssetCatalogAssetIdError,
  ExternalAssetIdentifier,
  InMemoryAssetCatalogAdapter,
  InvalidAssetCatalogIdentifierError,
  InvalidAssetCatalogListingError,
  InvalidAssetCatalogProvenanceError,
} from "./index";

const FIRST_ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const SECOND_ASSET_ID = "550e8400-e29b-41d4-a716-446655440001";
const THIRD_ASSET_ID = "550e8400-e29b-41d4-a716-446655440002";

const PRIMARY_PROVENANCE = {
  provider: "provider_a",
  sourceId: "instrument-001",
  retrievedAt: "2026-08-29T12:00:00.000Z",
  normalizationVersion: "asset-master-v1",
  rawValue: " itub4 ",
} as const;

const SECONDARY_PROVENANCE = {
  provider: "provider_b",
  sourceId: "asset/001",
  retrievedAt: "2026-08-29T12:01:00.000Z",
  normalizationVersion: "asset-master-v1",
} as const;

function firstAssetInput() {
  return {
    id: FIRST_ASSET_ID,
    name: "Itaú Unibanco PN",
    assetClass: "EQUITY",
    instrumentType: "STOCK",
    referenceCurrency: "BRL",
    countryCode: "br",
    status: "active",
    identifiers: [
      {
        identifier: ExternalAssetIdentifier.isin("BRITUBACNPR1"),
        provenance: [SECONDARY_PROVENANCE, PRIMARY_PROVENANCE],
      },
      {
        identifier: ExternalAssetIdentifier.providerId("provider_a", "itub-preferred"),
        provenance: [PRIMARY_PROVENANCE],
      },
      {
        identifier: ExternalAssetIdentifier.providerId("provider_b", "B3:ITUB4"),
        provenance: [SECONDARY_PROVENANCE],
      },
    ],
    listings: [
      {
        exchange: "b3",
        symbol: "itub3",
        status: "historical",
        validFrom: "2000-01-01",
        validTo: "2005-12-31",
        provenance: [PRIMARY_PROVENANCE],
      },
      {
        exchange: "b3",
        symbol: "itub4",
        status: "current",
        validFrom: "2005-12-31",
        provenance: [SECONDARY_PROVENANCE, PRIMARY_PROVENANCE],
      },
    ],
  } as const;
}

function secondAssetInput() {
  return {
    id: SECOND_ASSET_ID,
    name: "Example Corp",
    assetClass: "EQUITY",
    instrumentType: "STOCK",
    referenceCurrency: "USD",
    countryCode: "US",
    status: "ACTIVE",
    identifiers: [
      {
        identifier: ExternalAssetIdentifier.providerId("provider_a", "example-corp"),
        provenance: [PRIMARY_PROVENANCE],
      },
    ],
    listings: [
      {
        exchange: "NASDAQ",
        symbol: "ITUB4",
        status: "CURRENT",
        provenance: [PRIMARY_PROVENANCE],
      },
    ],
  } as const;
}

describe("AssetCatalogEntry", () => {
  it("normalizes canonical metadata while preserving economic class and instrument type", () => {
    const entry = AssetCatalogEntry.create(firstAssetInput());
    const snapshot = entry.toSnapshot();

    expect(snapshot.assetId).toBe(FIRST_ASSET_ID);
    expect(snapshot.countryCode).toBe("BR");
    expect(snapshot.status).toBe("ACTIVE");
    expect(snapshot.assetClass).toBe("EQUITY");
    expect(snapshot.instrumentType).toBe("STOCK");
    expect(snapshot.referenceCurrency).toBe("BRL");
    expect(snapshot.listings).toEqual([
      expect.objectContaining({ exchange: "B3", symbol: "ITUB4", status: "CURRENT" }),
      expect.objectContaining({ exchange: "B3", symbol: "ITUB3", status: "HISTORICAL" }),
    ]);
    expect(snapshot.identifiers[0]?.provenance.map((item) => item.provider)).toEqual([
      "PROVIDER_A",
      "PROVIDER_B",
    ]);
  });

  it("keeps historical ticker aliases in the catalog without exposing them as current Asset identifiers", () => {
    const entry = AssetCatalogEntry.create(firstAssetInput());
    const currentTicker = ExternalAssetIdentifier.marketSymbol("B3", "ITUB4");
    const historicalTicker = ExternalAssetIdentifier.marketSymbol("B3", "ITUB3");

    expect(entry.asset.hasExternalIdentifier(currentTicker)).toBe(true);
    expect(entry.asset.hasExternalIdentifier(historicalTicker)).toBe(false);
    expect(entry.identityIdentifiers().map((identifier) => identifier.key())).toContain(
      historicalTicker.key(),
    );
  });

  it.each(["ACTIVE", "INACTIVE", "DELISTED"])("supports the %s lifecycle status", (status) => {
    expect(AssetCatalogEntry.create({ ...firstAssetInput(), status }).status).toBe(status);
  });

  it("keeps market symbols in explicit listings instead of generic identifier bindings", () => {
    expect(() =>
      AssetCatalogEntry.create({
        ...firstAssetInput(),
        identifiers: [
          {
            identifier: ExternalAssetIdentifier.marketSymbol("B3", "ITUB4"),
            provenance: [PRIMARY_PROVENANCE],
          },
        ],
      }),
    ).toThrowError(InvalidAssetCatalogIdentifierError);
  });

  it("validates listing history and provenance instead of accepting unauditable metadata", () => {
    expect(() =>
      AssetCatalogEntry.create({
        ...firstAssetInput(),
        listings: [
          {
            exchange: "B3",
            symbol: "ITUB4",
            status: "CURRENT",
            validTo: "2026-01-01",
            provenance: [PRIMARY_PROVENANCE],
          },
        ],
      }),
    ).toThrowError(InvalidAssetCatalogListingError);

    expect(() =>
      AssetCatalogEntry.create({
        ...firstAssetInput(),
        identifiers: [
          {
            identifier: ExternalAssetIdentifier.providerId("provider_a", "itub-preferred"),
            provenance: [],
          },
        ],
      }),
    ).toThrowError(InvalidAssetCatalogProvenanceError);
  });
});

describe("InMemoryAssetCatalogAdapter", () => {
  it("uses AssetId rather than ticker as canonical identity", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput(), secondAssetInput()]);

    expect(catalog.getById(FIRST_ASSET_ID)?.asset.name).toBe("Itaú Unibanco PN");
    expect(catalog.getById(SECOND_ASSET_ID)?.asset.name).toBe("Example Corp");
    expect(catalog.resolve([ExternalAssetIdentifier.marketSymbol("B3", "ITUB4")])).toMatchObject({
      outcome: "MATCH",
      assetId: FIRST_ASSET_ID,
    });
    expect(
      catalog.resolve([ExternalAssetIdentifier.marketSymbol("NASDAQ", "ITUB4")]),
    ).toMatchObject({ outcome: "MATCH", assetId: SECOND_ASSET_ID });
  });

  it("resolves current and historical ticker aliases to the same canonical AssetId", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput()]);

    expect(catalog.resolve([ExternalAssetIdentifier.marketSymbol("B3", "ITUB4")])).toMatchObject({
      outcome: "MATCH",
      assetId: FIRST_ASSET_ID,
    });
    expect(catalog.resolve([ExternalAssetIdentifier.marketSymbol("B3", "ITUB3")])).toMatchObject({
      outcome: "MATCH",
      assetId: FIRST_ASSET_ID,
    });
  });

  it("allows multiple provider identifiers to map to the same canonical asset", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput()]);

    expect(
      catalog.resolve([ExternalAssetIdentifier.providerId("PROVIDER_A", "itub-preferred")]),
    ).toMatchObject({ outcome: "MATCH", assetId: FIRST_ASSET_ID });
    expect(
      catalog.resolve([ExternalAssetIdentifier.providerId("PROVIDER_B", "B3:ITUB4")]),
    ).toMatchObject({ outcome: "MATCH", assetId: FIRST_ASSET_ID });
  });

  it("returns a partial match when evidence converges but one supplied identifier is unknown", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput()]);
    const knownIdentifier = ExternalAssetIdentifier.providerId("PROVIDER_A", "itub-preferred");
    const unknownIdentifier = ExternalAssetIdentifier.providerId("PROVIDER_C", "unknown");

    expect(catalog.resolve([unknownIdentifier, knownIdentifier])).toEqual({
      outcome: "PARTIAL_MATCH",
      assetId: FIRST_ASSET_ID,
      evidence: [
        {
          identifier: knownIdentifier.toSnapshot(),
          candidateAssetIds: [FIRST_ASSET_ID],
        },
        {
          identifier: unknownIdentifier.toSnapshot(),
          candidateAssetIds: [],
        },
      ],
    });
  });

  it("returns deterministic auditable conflict evidence instead of guessing", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput(), secondAssetInput()]);
    const resolution = catalog.resolve([
      ExternalAssetIdentifier.providerId("PROVIDER_A", "itub-preferred"),
      ExternalAssetIdentifier.providerId("PROVIDER_A", "example-corp"),
    ]);

    expect(resolution).toEqual({
      outcome: "CONFLICT",
      candidateAssetIds: [FIRST_ASSET_ID, SECOND_ASSET_ID],
      evidence: [
        {
          identifier: {
            kind: "PROVIDER_ID",
            scope: "PROVIDER_A",
            value: "example-corp",
          },
          candidateAssetIds: [SECOND_ASSET_ID],
        },
        {
          identifier: {
            kind: "PROVIDER_ID",
            scope: "PROVIDER_A",
            value: "itub-preferred",
          },
          candidateAssetIds: [FIRST_ASSET_ID],
        },
      ],
    });
  });

  it("surfaces cross-asset identifier collisions as conflicts", () => {
    const sharedIdentifier = ExternalAssetIdentifier.providerId("PROVIDER_A", "shared-id");
    const catalog = InMemoryAssetCatalogAdapter.create([
      {
        ...firstAssetInput(),
        identifiers: [{ identifier: sharedIdentifier, provenance: [PRIMARY_PROVENANCE] }],
      },
      {
        ...secondAssetInput(),
        identifiers: [{ identifier: sharedIdentifier, provenance: [SECONDARY_PROVENANCE] }],
      },
    ]);

    expect(catalog.resolve([sharedIdentifier])).toEqual({
      outcome: "CONFLICT",
      candidateAssetIds: [FIRST_ASSET_ID, SECOND_ASSET_ID],
      evidence: [
        {
          identifier: sharedIdentifier.toSnapshot(),
          candidateAssetIds: [FIRST_ASSET_ID, SECOND_ASSET_ID],
        },
      ],
    });
  });

  it("returns unmatched without inventing a fuzzy name or ticker match", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([firstAssetInput()]);

    expect(catalog.resolve([ExternalAssetIdentifier.providerId("PROVIDER_A", "unknown")])).toEqual({
      outcome: "UNMATCHED",
      evidence: [
        {
          identifier: {
            kind: "PROVIDER_ID",
            scope: "PROVIDER_A",
            value: "unknown",
          },
          candidateAssetIds: [],
        },
      ],
    });
  });

  it("rejects duplicate AssetIds while allowing external conflicts to remain auditable", () => {
    expect(() =>
      InMemoryAssetCatalogAdapter.create([
        firstAssetInput(),
        {
          ...secondAssetInput(),
          id: FIRST_ASSET_ID,
        },
      ]),
    ).toThrowError(DuplicateAssetCatalogAssetIdError);
  });

  it("keeps catalog listing order deterministic", () => {
    const catalog = InMemoryAssetCatalogAdapter.create([
      {
        ...secondAssetInput(),
        id: THIRD_ASSET_ID,
      },
      firstAssetInput(),
      secondAssetInput(),
    ]);

    expect(catalog.list().map((entry) => entry.asset.id.toString())).toEqual([
      FIRST_ASSET_ID,
      SECOND_ASSET_ID,
      THIRD_ASSET_ID,
    ]);
  });
});
