import { Asset, type AssetCreationInput } from "./asset";
import {
  DuplicateAssetCatalogIdentifierError,
  DuplicateAssetCatalogListingError,
  InvalidAssetCatalogCountryError,
  InvalidAssetCatalogIdentifierError,
  InvalidAssetCatalogListingError,
  InvalidAssetCatalogProvenanceError,
  InvalidAssetCatalogStatusError,
} from "./asset-catalog-errors";
import {
  ExternalAssetIdentifier,
  type ExternalAssetIdentifierSnapshot,
} from "./external-asset-identifier";

export type AssetCatalogStatus = "ACTIVE" | "INACTIVE" | "DELISTED";
export type AssetCatalogListingStatus = "CURRENT" | "HISTORICAL";

export type AssetIdentifierProvenanceInput = Readonly<{
  provider: string;
  sourceId?: string | null;
  retrievedAt: string;
  normalizationVersion: string;
  rawValue?: string | null;
}>;

export type AssetIdentifierProvenance = Readonly<{
  provider: string;
  sourceId: string | null;
  retrievedAt: string;
  normalizationVersion: string;
  rawValue: string | null;
}>;

export type AssetCatalogIdentifierInput = Readonly<{
  identifier: ExternalAssetIdentifier;
  provenance: readonly AssetIdentifierProvenanceInput[];
}>;

export type AssetCatalogIdentifier = Readonly<{
  identifier: ExternalAssetIdentifier;
  provenance: readonly AssetIdentifierProvenance[];
}>;

export type AssetCatalogListingInput = Readonly<{
  exchange: string;
  symbol: string;
  status: AssetCatalogListingStatus | string;
  validFrom?: string | null;
  validTo?: string | null;
  provenance: readonly AssetIdentifierProvenanceInput[];
}>;

export type AssetCatalogListing = Readonly<{
  exchange: string;
  symbol: string;
  status: AssetCatalogListingStatus;
  validFrom: string | null;
  validTo: string | null;
  provenance: readonly AssetIdentifierProvenance[];
}>;

export type AssetCatalogEntryInput = Omit<AssetCreationInput, "externalIdentifiers"> &
  Readonly<{
    countryCode?: string | null;
    status: AssetCatalogStatus | string;
    identifiers?: readonly AssetCatalogIdentifierInput[];
    listings?: readonly AssetCatalogListingInput[];
  }>;

export type AssetCatalogIdentifierSnapshot = Readonly<{
  identifier: ExternalAssetIdentifierSnapshot;
  provenance: readonly AssetIdentifierProvenance[];
}>;

export type AssetCatalogListingSnapshot = Readonly<{
  exchange: string;
  symbol: string;
  status: AssetCatalogListingStatus;
  validFrom: string | null;
  validTo: string | null;
  provenance: readonly AssetIdentifierProvenance[];
}>;

export type AssetCatalogEntrySnapshot = Readonly<{
  assetId: string;
  name: string;
  assetClass: string;
  instrumentType: string;
  referenceCurrency: string;
  countryCode: string | null;
  status: AssetCatalogStatus;
  identifiers: readonly AssetCatalogIdentifierSnapshot[];
  listings: readonly AssetCatalogListingSnapshot[];
}>;

const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,31}$/;
const NORMALIZATION_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const CANONICAL_UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MAX_SOURCE_TEXT_LENGTH = 256;

function normalizeCountryCode(countryCode: string | null): string | null {
  if (countryCode === null) return null;

  const normalized = countryCode.trim().toUpperCase();
  if (!COUNTRY_CODE_PATTERN.test(normalized)) {
    throw new InvalidAssetCatalogCountryError(countryCode);
  }

  return normalized;
}

function normalizeCatalogStatus(status: string): AssetCatalogStatus {
  const normalized = status.trim().toUpperCase();
  if (normalized !== "ACTIVE" && normalized !== "INACTIVE" && normalized !== "DELISTED") {
    throw new InvalidAssetCatalogStatusError(status);
  }

  return normalized;
}

function normalizeListingStatus(status: string): AssetCatalogListingStatus {
  const normalized = status.trim().toUpperCase();
  if (normalized !== "CURRENT" && normalized !== "HISTORICAL") {
    throw new InvalidAssetCatalogListingError(`Invalid listing status: ${JSON.stringify(status)}`);
  }

  return normalized;
}

function normalizeProvider(provider: string): string {
  const normalized = provider.trim().toUpperCase();
  if (!PROVIDER_PATTERN.test(normalized)) {
    throw new InvalidAssetCatalogProvenanceError("provider", provider);
  }

  return normalized;
}

function normalizeOptionalSourceText(
  field: string,
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_SOURCE_TEXT_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidAssetCatalogProvenanceError(field, value);
  }

  return normalized;
}

function normalizeRetrievedAt(value: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (
    !CANONICAL_UTC_INSTANT_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new InvalidAssetCatalogProvenanceError("retrievedAt", value);
  }

  return normalized;
}

function normalizeNormalizationVersion(value: string): string {
  const normalized = value.trim();
  if (!NORMALIZATION_VERSION_PATTERN.test(normalized)) {
    throw new InvalidAssetCatalogProvenanceError("normalizationVersion", value);
  }

  return normalized;
}

function normalizeDate(field: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim();
  const parsed = new Date(`${normalized}T00:00:00.000Z`);
  if (
    !DATE_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== normalized
  ) {
    throw new InvalidAssetCatalogListingError(`Invalid ${field}: ${JSON.stringify(value)}`);
  }

  return normalized;
}

function provenanceKey(provenance: AssetIdentifierProvenance): string {
  return [
    provenance.provider,
    provenance.sourceId ?? "",
    provenance.retrievedAt,
    provenance.normalizationVersion,
    provenance.rawValue ?? "",
  ].join("\u0000");
}

function normalizeProvenance(
  provenance: readonly AssetIdentifierProvenanceInput[],
): readonly AssetIdentifierProvenance[] {
  if (provenance.length === 0) {
    throw new InvalidAssetCatalogProvenanceError("provenance", "[]");
  }

  const normalized = provenance.map((item) =>
    Object.freeze({
      provider: normalizeProvider(item.provider),
      sourceId: normalizeOptionalSourceText("sourceId", item.sourceId),
      retrievedAt: normalizeRetrievedAt(item.retrievedAt),
      normalizationVersion: normalizeNormalizationVersion(item.normalizationVersion),
      rawValue: normalizeOptionalSourceText("rawValue", item.rawValue),
    }),
  );
  const byKey = new Map(normalized.map((item) => [provenanceKey(item), item]));

  return Object.freeze(
    [...byKey.values()].sort((left, right) =>
      provenanceKey(left).localeCompare(provenanceKey(right)),
    ),
  );
}

function normalizeIdentifiers(
  identifiers: readonly AssetCatalogIdentifierInput[],
): readonly AssetCatalogIdentifier[] {
  const seen = new Set<string>();
  const normalized = identifiers.map((binding) => {
    if (binding.identifier.kind === "MARKET_SYMBOL") {
      throw new InvalidAssetCatalogIdentifierError(
        "Market symbols must be modeled as catalog listings so exchange and ticker history remain explicit.",
      );
    }

    const key = binding.identifier.key();
    if (seen.has(key)) throw new DuplicateAssetCatalogIdentifierError(key);
    seen.add(key);

    return Object.freeze({
      identifier: binding.identifier,
      provenance: normalizeProvenance(binding.provenance),
    });
  });

  return Object.freeze(
    [...normalized].sort((left, right) =>
      left.identifier.key().localeCompare(right.identifier.key()),
    ),
  );
}

function listingKey(listing: AssetCatalogListing): string {
  const symbolKey = ExternalAssetIdentifier.marketSymbol(listing.exchange, listing.symbol).key();
  if (listing.status === "CURRENT") return `CURRENT:${symbolKey}`;
  return `HISTORICAL:${symbolKey}:${listing.validFrom ?? ""}:${listing.validTo ?? ""}`;
}

function normalizeListings(
  listings: readonly AssetCatalogListingInput[],
): readonly AssetCatalogListing[] {
  const seen = new Set<string>();
  const normalized = listings.map((listing) => {
    const identifier = ExternalAssetIdentifier.marketSymbol(listing.exchange, listing.symbol);
    const status = normalizeListingStatus(listing.status);
    const validFrom = normalizeDate("validFrom", listing.validFrom);
    const validTo = normalizeDate("validTo", listing.validTo);

    if (status === "CURRENT" && validTo !== null) {
      throw new InvalidAssetCatalogListingError("A CURRENT listing cannot have validTo.");
    }
    if (validFrom !== null && validTo !== null && validFrom > validTo) {
      throw new InvalidAssetCatalogListingError("Listing validFrom cannot be after validTo.");
    }

    const normalizedListing = Object.freeze({
      exchange: identifier.scope,
      symbol: identifier.value,
      status,
      validFrom,
      validTo,
      provenance: normalizeProvenance(listing.provenance),
    });
    const key = listingKey(normalizedListing);
    if (seen.has(key)) throw new DuplicateAssetCatalogListingError(key);
    seen.add(key);

    return normalizedListing;
  });

  return Object.freeze(
    [...normalized].sort((left, right) => listingKey(left).localeCompare(listingKey(right))),
  );
}

function externalIdentifiersFor(
  identifiers: readonly AssetCatalogIdentifier[],
  listings: readonly AssetCatalogListing[],
  includeHistoricalListings: boolean,
): readonly ExternalAssetIdentifier[] {
  const byKey = new Map<string, ExternalAssetIdentifier>();

  for (const binding of identifiers) {
    byKey.set(binding.identifier.key(), binding.identifier);
  }
  for (const listing of listings) {
    if (!includeHistoricalListings && listing.status !== "CURRENT") continue;

    const identifier = ExternalAssetIdentifier.marketSymbol(listing.exchange, listing.symbol);
    byKey.set(identifier.key(), identifier);
  }

  return Object.freeze(
    [...byKey.values()].sort((left, right) => left.key().localeCompare(right.key())),
  );
}

export class AssetCatalogEntry {
  private constructor(
    public readonly asset: Asset,
    public readonly countryCode: string | null,
    public readonly status: AssetCatalogStatus,
    public readonly identifiers: readonly AssetCatalogIdentifier[],
    public readonly listings: readonly AssetCatalogListing[],
  ) {}

  public static create(input: AssetCatalogEntryInput): AssetCatalogEntry {
    const identifiers = normalizeIdentifiers(input.identifiers ?? []);
    const listings = normalizeListings(input.listings ?? []);
    const asset = Asset.create({
      id: input.id,
      name: input.name,
      assetClass: input.assetClass,
      instrumentType: input.instrumentType,
      referenceCurrency: input.referenceCurrency,
      externalIdentifiers: externalIdentifiersFor(identifiers, listings, false),
    });

    return new AssetCatalogEntry(
      asset,
      normalizeCountryCode(input.countryCode ?? null),
      normalizeCatalogStatus(input.status),
      identifiers,
      listings,
    );
  }

  public identityIdentifiers(): readonly ExternalAssetIdentifier[] {
    return externalIdentifiersFor(this.identifiers, this.listings, true);
  }

  public toSnapshot(): AssetCatalogEntrySnapshot {
    return {
      assetId: this.asset.id.toString(),
      name: this.asset.name,
      assetClass: this.asset.assetClass.toString(),
      instrumentType: this.asset.instrumentType.toString(),
      referenceCurrency: this.asset.referenceCurrency.toString(),
      countryCode: this.countryCode,
      status: this.status,
      identifiers: this.identifiers.map((binding) => ({
        identifier: binding.identifier.toSnapshot(),
        provenance: binding.provenance,
      })),
      listings: this.listings.map((listing) => ({ ...listing })),
    };
  }
}
