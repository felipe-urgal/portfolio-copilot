import { InvalidCurrencyCodeError } from "./errors";

const CURRENCY_PATTERN = /^[A-Za-z]{3}$/;

export class CurrencyCode {
  private constructor(public readonly code: string) {}

  public static from(currency: string): CurrencyCode {
    if (!CURRENCY_PATTERN.test(currency)) {
      throw new InvalidCurrencyCodeError(currency);
    }

    return new CurrencyCode(currency.toUpperCase());
  }

  public equals(other: CurrencyCode): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
