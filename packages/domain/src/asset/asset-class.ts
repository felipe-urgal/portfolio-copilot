import { InvalidAssetClassError } from "./errors";

export const ASSET_CLASS_CODES = [
  "CASH",
  "FIXED_INCOME",
  "EQUITY",
  "REAL_ESTATE",
  "COMMODITY",
  "CRYPTO_ASSET",
  "MULTI_ASSET",
] as const;

export type AssetClassCode = (typeof ASSET_CLASS_CODES)[number];

const ASSET_CLASS_SET = new Set<string>(ASSET_CLASS_CODES);

export class AssetClass {
  private constructor(public readonly code: AssetClassCode) {}

  public static from(value: string): AssetClass {
    const normalized = value.trim().toUpperCase();

    if (!ASSET_CLASS_SET.has(normalized)) {
      throw new InvalidAssetClassError(value);
    }

    return new AssetClass(normalized as AssetClassCode);
  }

  public equals(other: AssetClass): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
