import { isDecimalZero, parseDecimalParts } from "../financial/decimal";
import { InvalidAssetQuantityError } from "./errors";

const ASSET_QUANTITY_SCALE = 12;
const ASSET_QUANTITY_FACTOR = 10n ** BigInt(ASSET_QUANTITY_SCALE);

export type AssetQuantitySnapshot = Readonly<{
  scaledUnits: string;
}>;

export class AssetQuantity {
  private constructor(public readonly scaledUnits: bigint) {}

  public static fromDecimal(value: string): AssetQuantity {
    let parts;

    try {
      parts = parseDecimalParts(value);
    } catch {
      throw new InvalidAssetQuantityError(value);
    }

    if ((parts.negative && !isDecimalZero(parts)) || parts.fraction.length > ASSET_QUANTITY_SCALE) {
      throw new InvalidAssetQuantityError(value);
    }

    const fraction = parts.fraction.padEnd(ASSET_QUANTITY_SCALE, "0");
    const scaledUnits = BigInt(parts.whole) * ASSET_QUANTITY_FACTOR + BigInt(fraction || "0");

    return new AssetQuantity(scaledUnits);
  }

  public static fromScaledUnits(scaledUnits: bigint): AssetQuantity {
    if (scaledUnits < 0n) {
      throw new InvalidAssetQuantityError(scaledUnits.toString());
    }

    return new AssetQuantity(scaledUnits);
  }

  public static fromSnapshot(snapshot: AssetQuantitySnapshot): AssetQuantity {
    if (!/^\d+$/.test(snapshot.scaledUnits)) {
      throw new InvalidAssetQuantityError(snapshot.scaledUnits);
    }

    return AssetQuantity.fromScaledUnits(BigInt(snapshot.scaledUnits));
  }

  public static zero(): AssetQuantity {
    return new AssetQuantity(0n);
  }

  public isZero(): boolean {
    return this.scaledUnits === 0n;
  }

  public compare(other: AssetQuantity): -1 | 0 | 1 {
    if (this.scaledUnits < other.scaledUnits) return -1;
    if (this.scaledUnits > other.scaledUnits) return 1;
    return 0;
  }

  public equals(other: AssetQuantity): boolean {
    return this.scaledUnits === other.scaledUnits;
  }

  public toDecimalString(): string {
    const whole = this.scaledUnits / ASSET_QUANTITY_FACTOR;
    const fraction = (this.scaledUnits % ASSET_QUANTITY_FACTOR)
      .toString()
      .padStart(ASSET_QUANTITY_SCALE, "0");

    return `${whole.toString()}.${fraction}`;
  }

  public toSnapshot(): AssetQuantitySnapshot {
    return { scaledUnits: this.scaledUnits.toString() };
  }
}
