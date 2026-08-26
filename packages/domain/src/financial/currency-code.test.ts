import { describe, expect, it } from "vitest";

import { CurrencyCode, InvalidCurrencyCodeError } from "./index";

describe("CurrencyCode", () => {
  it("normalizes valid three-letter currency codes to uppercase", () => {
    const currency = CurrencyCode.from("usd");

    expect(currency.code).toBe("USD");
    expect(currency.toString()).toBe("USD");
  });

  it("compares normalized codes by value", () => {
    expect(CurrencyCode.from("brl").equals(CurrencyCode.from("BRL"))).toBe(
      true,
    );
    expect(CurrencyCode.from("BRL").equals(CurrencyCode.from("USD"))).toBe(
      false,
    );
  });

  it("rejects malformed currency codes", () => {
    expect(() => CurrencyCode.from("R$")).toThrowError(
      InvalidCurrencyCodeError,
    );
    expect(() => CurrencyCode.from("REAL")).toThrowError(
      InvalidCurrencyCodeError,
    );
    expect(() => CurrencyCode.from("12A")).toThrowError(
      InvalidCurrencyCodeError,
    );
  });
});
