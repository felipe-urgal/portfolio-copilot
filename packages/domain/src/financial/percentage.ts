import { formatScaledDecimal, parseScaledDecimal } from "./decimal";
import { InvalidFinancialSnapshotError } from "./errors";

const PERCENT_SCALE = 4;

export type PercentageSnapshot = Readonly<{
  scaledUnits: string;
}>;

export class Percentage {
  private constructor(public readonly scaledUnits: bigint) {}

  public static fromPercent(percent: string): Percentage {
    return new Percentage(parseScaledDecimal(percent, PERCENT_SCALE));
  }

  public static fromScaledUnits(scaledUnits: bigint): Percentage {
    return new Percentage(scaledUnits);
  }

  public static zero(): Percentage {
    return new Percentage(0n);
  }

  public static fromSnapshot(snapshot: PercentageSnapshot): Percentage {
    if (!/^-?\d+$/.test(snapshot.scaledUnits)) {
      throw new InvalidFinancialSnapshotError("Percentage.scaledUnits", snapshot.scaledUnits);
    }

    return Percentage.fromScaledUnits(BigInt(snapshot.scaledUnits));
  }

  public add(other: Percentage): Percentage {
    return Percentage.fromScaledUnits(this.scaledUnits + other.scaledUnits);
  }

  public subtract(other: Percentage): Percentage {
    return Percentage.fromScaledUnits(this.scaledUnits - other.scaledUnits);
  }

  public compare(other: Percentage): -1 | 0 | 1 {
    if (this.scaledUnits < other.scaledUnits) return -1;
    if (this.scaledUnits > other.scaledUnits) return 1;
    return 0;
  }

  public equals(other: Percentage): boolean {
    return this.scaledUnits === other.scaledUnits;
  }

  public isZero(): boolean {
    return this.scaledUnits === 0n;
  }

  public isNegative(): boolean {
    return this.scaledUnits < 0n;
  }

  public toPercentString(): string {
    return formatScaledDecimal(this.scaledUnits, PERCENT_SCALE);
  }

  public toSnapshot(): PercentageSnapshot {
    return { scaledUnits: this.scaledUnits.toString() };
  }
}
