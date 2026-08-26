import { describe, expect, it } from "vitest";

import { INSTRUMENT_TYPE_CODES, InstrumentType, InvalidInstrumentTypeError } from "./index";

describe("InstrumentType", () => {
  it("supports the initial vehicle taxonomy", () => {
    expect(INSTRUMENT_TYPE_CODES).toEqual([
      "CASH_BALANCE",
      "FIXED_INCOME_INSTRUMENT",
      "STOCK",
      "ETF",
      "REAL_ESTATE_FUND",
      "INVESTMENT_FUND",
      "CRYPTO_ASSET",
    ]);
  });

  it("normalizes instrument input at the domain boundary", () => {
    expect(InstrumentType.from(" etf ").toString()).toBe("ETF");
  });

  it("rejects economic classes as instrument types", () => {
    expect(() => InstrumentType.from("EQUITY")).toThrowError(InvalidInstrumentTypeError);
    expect(() => InstrumentType.from("FIXED_INCOME")).toThrowError(InvalidInstrumentTypeError);
  });
});
