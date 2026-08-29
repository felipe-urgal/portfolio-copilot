export type AssetCatalogErrorCode =
  | "INVALID_ASSET_CATALOG_COUNTRY"
  | "INVALID_ASSET_CATALOG_STATUS"
  | "INVALID_ASSET_CATALOG_PROVENANCE"
  | "INVALID_ASSET_CATALOG_IDENTIFIER"
  | "INVALID_ASSET_CATALOG_LISTING"
  | "DUPLICATE_ASSET_CATALOG_IDENTIFIER"
  | "DUPLICATE_ASSET_CATALOG_LISTING"
  | "DUPLICATE_ASSET_CATALOG_ASSET_ID";

export class AssetCatalogError extends Error {
  public constructor(
    public readonly code: AssetCatalogErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAssetCatalogCountryError extends AssetCatalogError {
  public constructor(value: string) {
    super("INVALID_ASSET_CATALOG_COUNTRY", `Invalid asset catalog country: ${JSON.stringify(value)}`);
  }
}

export class InvalidAssetCatalogStatusError extends AssetCatalogError {
  public constructor(value: string) {
    super("INVALID_ASSET_CATALOG_STATUS", `Invalid asset catalog status: ${JSON.stringify(value)}`);
  }
}

export class InvalidAssetCatalogProvenanceError extends AssetCatalogError {
  public constructor(field: string, value: string) {
    super(
      "INVALID_ASSET_CATALOG_PROVENANCE",
      `Invalid asset catalog provenance field ${field}: ${JSON.stringify(value)}`,
    );
  }
}

export class InvalidAssetCatalogIdentifierError extends AssetCatalogError {
  public constructor(message: string) {
    super("INVALID_ASSET_CATALOG_IDENTIFIER", message);
  }
}

export class InvalidAssetCatalogListingError extends AssetCatalogError {
  public constructor(message: string) {
    super("INVALID_ASSET_CATALOG_LISTING", message);
  }
}

export class DuplicateAssetCatalogIdentifierError extends AssetCatalogError {
  public constructor(key: string) {
    super("DUPLICATE_ASSET_CATALOG_IDENTIFIER", `Duplicate asset catalog identifier: ${key}`);
  }
}

export class DuplicateAssetCatalogListingError extends AssetCatalogError {
  public constructor(key: string) {
    super("DUPLICATE_ASSET_CATALOG_LISTING", `Duplicate asset catalog listing: ${key}`);
  }
}

export class DuplicateAssetCatalogAssetIdError extends AssetCatalogError {
  public constructor(assetId: string) {
    super("DUPLICATE_ASSET_CATALOG_ASSET_ID", `Duplicate asset catalog AssetId: ${assetId}`);
  }
}
