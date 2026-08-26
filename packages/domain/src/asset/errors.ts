export type AssetDomainErrorCode =
  | "INVALID_ASSET_ID"
  | "INVALID_ASSET_CLASS"
  | "INVALID_INSTRUMENT_TYPE"
  | "INVALID_ASSET_NAME"
  | "INVALID_EXTERNAL_ASSET_IDENTIFIER"
  | "DUPLICATE_EXTERNAL_ASSET_IDENTIFIER";

export class AssetDomainError extends Error {
  public constructor(
    public readonly code: AssetDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAssetIdError extends AssetDomainError {
  public constructor(value: string) {
    super("INVALID_ASSET_ID", `Invalid asset id: ${JSON.stringify(value)}`);
  }
}

export class InvalidAssetClassError extends AssetDomainError {
  public constructor(value: string) {
    super("INVALID_ASSET_CLASS", `Unsupported asset class: ${JSON.stringify(value)}`);
  }
}

export class InvalidInstrumentTypeError extends AssetDomainError {
  public constructor(value: string) {
    super(
      "INVALID_INSTRUMENT_TYPE",
      `Unsupported instrument type: ${JSON.stringify(value)}`,
    );
  }
}

export class InvalidAssetNameError extends AssetDomainError {
  public constructor(value: string) {
    super("INVALID_ASSET_NAME", `Invalid asset name: ${JSON.stringify(value)}`);
  }
}

export class InvalidExternalAssetIdentifierError extends AssetDomainError {
  public constructor(field: string, value: string) {
    super(
      "INVALID_EXTERNAL_ASSET_IDENTIFIER",
      `Invalid external asset identifier field ${field}: ${JSON.stringify(value)}`,
    );
  }
}

export class DuplicateExternalAssetIdentifierError extends AssetDomainError {
  public constructor(key: string) {
    super(
      "DUPLICATE_EXTERNAL_ASSET_IDENTIFIER",
      `Duplicate external asset identifier: ${key}`,
    );
  }
}
