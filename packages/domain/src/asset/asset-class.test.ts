import { describe, expect, it } from "vitest";

import { ASSET_CLASS_CODES, AssetClass, InvalidAssetClassError } from "./index";

describe("AssetClass", () => {
  it("supports the initial economic taxonomy", () => {
    expect(ASSET_CLASS_CODES).toEqual([
      "CASH",
      "FIXED_INCOME",
      "EQUITY",
      "ETF",
      "REAL_ESTATE_FUND",
      "INVESTMENT_FUND",
      "CRYPTO_ASSET",
    ]);
  });

  it("normalizes class input at the domain boundary", () => {
    expect(AssetClass.from(" equity ").toString()).toBe("EQUITY");
  });

  it("rejects unsupported classes instead of silently using OTHER", () => {
    expect(() => AssetClass.from("OTHER")).toThrowError(InvalidAssetClassError);
    expect(() => AssetClass.from("STOCK")).toThrowError(InvalidAssetClassError);
  });
});
