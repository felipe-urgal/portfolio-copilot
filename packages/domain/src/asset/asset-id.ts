import { normalizeUuid } from "../identity/uuid";
import { InvalidAssetIdError } from "./errors";

export class AssetId {
  private constructor(public readonly value: string) {}

  public static from(value: string): AssetId {
    const normalized = normalizeUuid(value);

    if (normalized === null) {
      throw new InvalidAssetIdError(value);
    }

    return new AssetId(normalized);
  }

  public equals(other: AssetId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
