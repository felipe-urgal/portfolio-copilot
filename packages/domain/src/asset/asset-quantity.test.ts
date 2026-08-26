import { describe, expect, it } from "vitest";

import { AssetQuantity, InvalidAssetQuantityError } from "./index";

describe("AssetQuantity", () => {
  it("represents zero and positive quantities exactly at 12 decimal places", () => {
    expect(AssetQuantity.zero().toDecimalString()).toBe("0.000000000000");
    expect(AssetQuantity.fromDecimal("10").toDecimalString()).toBe("10.000000000000");
    expect(AssetQuantity.fromDecimal("0.00000001").toDecimalString()).toBe(
      "0.000000010000",
    );
    expect(AssetQuantity.fromDecimal("1.234567890123").toDecimalString()).toBe(
      "1.234567890123",
    );
  });

  it("normalizes harmless signs and leading zeros without binary floating point", () => {
    expect(AssetQuantity.fromDecimal("+00012.3400").toDecimalString()).toBe(
      "12.340000000000",
    );
    expect(AssetQuantity.fromDecimal("-0.000000000000").toDecimalString()).toBe(
      "0.000000000000",
    );
  });

  it("rejects negative, malformed or over-precision quantities instead of rounding", () => {
    for (const value of [
      "-0.000000000001",
      "1.2345678901234",
      "1e-8",
      "1,5",
      "",
      "abc",
    ]) {
      expect(() => AssetQuantity.fromDecimal(value)).toThrowError(InvalidAssetQuantityError);
    }
  });

  it("round-trips through a persistible snapshot", () => {
    const quantity = AssetQuantity.fromDecimal("123.456789012345");
    const snapshot = quantity.toSnapshot();

    expect(snapshot).toEqual({ scaledUnits: "123456789012345" });
    expect(AssetQuantity.fromSnapshot(snapshot).equals(quantity)).toBe(true);
    expect(() => AssetQuantity.fromSnapshot({ scaledUnits: "-1" })).toThrowError(
      InvalidAssetQuantityError,
    );
    expect(() => AssetQuantity.fromSnapshot({ scaledUnits: "1.2" })).toThrowError(
      InvalidAssetQuantityError,
    );
  });
});
