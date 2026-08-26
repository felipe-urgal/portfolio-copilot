import { describe, expect, it } from "vitest";

import {
  CurrencyCode,
  CurrencyMismatchError,
  InvalidCurrencyCodeError,
  InvalidFinancialSnapshotError,
  Money,
} from "./index";

describe("Money", () => {
  it("stores monetary values as integer minor units", () => {
    const money = Money.fromDecimal("123.45", "brl");

    expect(money.minorUnits).toBe(12345n);
    expect(money.currency.code).toBe("BRL");
    expect(money.toDecimalString()).toBe("123.45");
  });

  it("accepts a reusable CurrencyCode value object", () => {
    const brl = CurrencyCode.from("brl");
    const money = Money.fromDecimal("10.00", brl);

    expect(money.currency).toBe(brl);
    expect(money.currency.toString()).toBe("BRL");
  });

  it("rounds half away from zero deterministically", () => {
    expect(Money.fromDecimal("10.004", "BRL").toDecimalString()).toBe(
      "10.00",
    );
    expect(Money.fromDecimal("10.005", "BRL").toDecimalString()).toBe(
      "10.01",
    );
    expect(Money.fromDecimal("-10.004", "BRL").toDecimalString()).toBe(
      "-10.00",
    );
    expect(Money.fromDecimal("-10.005", "BRL").toDecimalString()).toBe(
      "-10.01",
    );
  });

  it("adds repeatedly without binary floating-point drift", () => {
    const cent = Money.fromDecimal("0.01", "BRL");
    let total = Money.zero("BRL");

    for (let index = 0; index < 10_000; index += 1) {
      total = total.add(cent);
    }

    expect(total.minorUnits).toBe(10_000n);
    expect(total.toDecimalString()).toBe("100.00");
  });

  it("supports signed results required by differences and cash flows", () => {
    const result = Money.fromDecimal("10.00", "BRL").subtract(
      Money.fromDecimal("12.50", "BRL"),
    );

    expect(result.isNegative()).toBe(true);
    expect(result.toDecimalString()).toBe("-2.50");
    expect(result.abs().toDecimalString()).toBe("2.50");
  });

  it("rejects operations between different currencies", () => {
    const brl = Money.fromDecimal("10", "BRL");
    const usd = Money.fromDecimal("10", "USD");

    expect(() => brl.add(usd)).toThrowError(CurrencyMismatchError);
    expect(() => brl.subtract(usd)).toThrowError(CurrencyMismatchError);
    expect(() => brl.compare(usd)).toThrowError(CurrencyMismatchError);
  });

  it("rejects malformed currency codes", () => {
    expect(() => Money.zero("R$")).toThrowError(InvalidCurrencyCodeError);
    expect(() => Money.zero("REAL")).toThrowError(InvalidCurrencyCodeError);
  });

  it("serializes bigint safely as an integer string", () => {
    const original = Money.fromMinorUnits(-12345n, "USD");
    const snapshot = original.toSnapshot();
    const restored = Money.fromSnapshot(snapshot);

    expect(snapshot).toEqual({ currency: "USD", minorUnits: "-12345" });
    expect(restored.equals(original)).toBe(true);
  });

  it("rejects malformed snapshots with a typed financial error", () => {
    expect(() =>
      Money.fromSnapshot({ currency: "BRL", minorUnits: "12.34" }),
    ).toThrowError(InvalidFinancialSnapshotError);
  });

  it("round-trips a broad range of minor-unit values exactly", () => {
    for (let minorUnits = -5_000; minorUnits <= 5_000; minorUnits += 1) {
      const money = Money.fromMinorUnits(BigInt(minorUnits), "BRL");
      const roundTripped = Money.fromDecimal(money.toDecimalString(), "BRL");

      expect(roundTripped.minorUnits).toBe(BigInt(minorUnits));
    }
  });
});
