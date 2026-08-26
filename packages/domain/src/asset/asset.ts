import { CurrencyCode } from "../financial";
import { AssetClass } from "./asset-class";
import { AssetId } from "./asset-id";
import { DuplicateExternalAssetIdentifierError, InvalidAssetNameError } from "./errors";
import { ExternalAssetIdentifier } from "./external-asset-identifier";
import { InstrumentType } from "./instrument-type";

const MAX_ASSET_NAME_LENGTH = 160;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export type AssetCreationInput = Readonly<{
  id: AssetId | string;
  name: string;
  assetClass: AssetClass | string;
  instrumentType: InstrumentType | string;
  referenceCurrency: CurrencyCode | string;
  externalIdentifiers?: readonly ExternalAssetIdentifier[];
}>;

function normalizeAssetName(name: string): string {
  const normalized = name.trim();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_ASSET_NAME_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidAssetNameError(name);
  }

  return normalized;
}

function toAssetId(value: AssetId | string): AssetId {
  return typeof value === "string" ? AssetId.from(value) : value;
}

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function toInstrumentType(value: InstrumentType | string): InstrumentType {
  return typeof value === "string" ? InstrumentType.from(value) : value;
}

function toCurrencyCode(value: CurrencyCode | string): CurrencyCode {
  return typeof value === "string" ? CurrencyCode.from(value) : value;
}

function copyAndValidateIdentifiers(
  identifiers: readonly ExternalAssetIdentifier[],
): readonly ExternalAssetIdentifier[] {
  const seen = new Set<string>();

  for (const identifier of identifiers) {
    const key = identifier.key();

    if (seen.has(key)) {
      throw new DuplicateExternalAssetIdentifierError(key);
    }

    seen.add(key);
  }

  return Object.freeze([...identifiers]);
}

export class Asset {
  private constructor(
    public readonly id: AssetId,
    public readonly name: string,
    public readonly assetClass: AssetClass,
    public readonly instrumentType: InstrumentType,
    public readonly referenceCurrency: CurrencyCode,
    public readonly externalIdentifiers: readonly ExternalAssetIdentifier[],
  ) {}

  public static create(input: AssetCreationInput): Asset {
    return new Asset(
      toAssetId(input.id),
      normalizeAssetName(input.name),
      toAssetClass(input.assetClass),
      toInstrumentType(input.instrumentType),
      toCurrencyCode(input.referenceCurrency),
      copyAndValidateIdentifiers(input.externalIdentifiers ?? []),
    );
  }

  public sameIdentityAs(other: Asset): boolean {
    return this.id.equals(other.id);
  }

  public hasExternalIdentifier(identifier: ExternalAssetIdentifier): boolean {
    return this.externalIdentifiers.some((candidate) => candidate.equals(identifier));
  }
}
