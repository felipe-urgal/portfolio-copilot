import { InvalidInstrumentTypeError } from "./errors";

export const INSTRUMENT_TYPE_CODES = [
  "CASH_BALANCE",
  "FIXED_INCOME_INSTRUMENT",
  "STOCK",
  "ETF",
  "REAL_ESTATE_FUND",
  "INVESTMENT_FUND",
  "CRYPTO_ASSET",
] as const;

export type InstrumentTypeCode = (typeof INSTRUMENT_TYPE_CODES)[number];

const INSTRUMENT_TYPE_SET = new Set<string>(INSTRUMENT_TYPE_CODES);

export class InstrumentType {
  private constructor(public readonly code: InstrumentTypeCode) {}

  public static from(value: string): InstrumentType {
    const normalized = value.trim().toUpperCase();

    if (!INSTRUMENT_TYPE_SET.has(normalized)) {
      throw new InvalidInstrumentTypeError(value);
    }

    return new InstrumentType(normalized as InstrumentTypeCode);
  }

  public equals(other: InstrumentType): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
