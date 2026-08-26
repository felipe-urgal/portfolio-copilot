import { CurrencyCode } from "./currency-code";
import { formatScaledDecimal, parseScaledDecimal } from "./decimal";
import {
  CurrencyMismatchError,
  InvalidFinancialSnapshotError,
} from "./errors";

const MONEY_SCALE = 2;

export type MoneySnapshot = Readonly<{
  currency: string;
  minorUnits: string;
}>;

function toCurrencyCode(currency: CurrencyCode | string): CurrencyCode {
  return typeof currency === "string" ? CurrencyCode.from(currency) : currency;
}

export class Money {
  private constructor(
    public readonly minorUnits: bigint,
    public readonly currency: CurrencyCode,
  ) {}

  public static fromMinorUnits(
    minorUnits: bigint,
    currency: CurrencyCode | string,
  ): Money {
    return new Money(minorUnits, toCurrencyCode(currency));
  }

  public static fromDecimal(
    decimal: string,
    currency: CurrencyCode | string,
  ): Money {
    return Money.fromMinorUnits(
      parseScaledDecimal(decimal, MONEY_SCALE),
      currency,
    );
  }

  public static fromSnapshot(snapshot: MoneySnapshot): Money {
    if (!/^-?\d+$/.test(snapshot.minorUnits)) {
      throw new InvalidFinancialSnapshotError(
        "Money.minorUnits",
        snapshot.minorUnits,
      );
    }

    return Money.fromMinorUnits(BigInt(snapshot.minorUnits), snapshot.currency);
  }

  public static zero(currency: CurrencyCode | string): Money {
    return Money.fromMinorUnits(0n, currency);
  }

  public add(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinorUnits(this.minorUnits + other.minorUnits, this.currency);
  }

  public subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return Money.fromMinorUnits(this.minorUnits - other.minorUnits, this.currency);
  }

  public compare(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other);

    if (this.minorUnits < other.minorUnits) return -1;
    if (this.minorUnits > other.minorUnits) return 1;
    return 0;
  }

  public equals(other: Money): boolean {
    return (
      this.currency.equals(other.currency) &&
      this.minorUnits === other.minorUnits
    );
  }

  public negate(): Money {
    return Money.fromMinorUnits(-this.minorUnits, this.currency);
  }

  public abs(): Money {
    return this.minorUnits < 0n ? this.negate() : this;
  }

  public isZero(): boolean {
    return this.minorUnits === 0n;
  }

  public isNegative(): boolean {
    return this.minorUnits < 0n;
  }

  public toDecimalString(): string {
    return formatScaledDecimal(this.minorUnits, MONEY_SCALE);
  }

  public toSnapshot(): MoneySnapshot {
    return {
      currency: this.currency.code,
      minorUnits: this.minorUnits.toString(),
    };
  }

  private assertSameCurrency(other: Money): void {
    if (!this.currency.equals(other.currency)) {
      throw new CurrencyMismatchError(
        this.currency.code,
        other.currency.code,
      );
    }
  }
}
