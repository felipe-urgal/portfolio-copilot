import { InvalidAssetIdError } from "./errors";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class AssetId {
  private constructor(public readonly value: string) {}

  public static from(value: string): AssetId {
    if (!UUID_PATTERN.test(value)) {
      throw new InvalidAssetIdError(value);
    }

    return new AssetId(value.toLowerCase());
  }

  public equals(other: AssetId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
