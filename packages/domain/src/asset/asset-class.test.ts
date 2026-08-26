import { describe, expect, it } from "vitest";

import { ASSET_CLASS_CODES, AssetClass, InvalidAssetClassError } from "./index";

describe("AssetClass", () => {
  it("supports the initial economic exposure taxonomy", () => {
    expect(ASSET_CLASS_CODES).toEqual([
      "CASH",
      "FIXED_INCOME",
      "EQUITY",
      "REAL_ESTATE",
      "COMMODITY",
      "CRYPTO_ASSET",
      "MULTI_ASSET",
    ]);
  });

  it("normalizes class input at the domain boundary", () => {
    expect(AssetClass.from(" equity ").toString()).toBe("EQUITY");
  });

  it("rejects instrument vehicles and unsupported classes", () => {
    expect(() => AssetClass.from("ETF")).toThrowError(InvalidAssetClassError);
    expect(() => AssetClass.from("STOCK")).toThrowError(InvalidAssetClassError);
    expect(() => AssetClass.from("OTHER")).toThrowError(InvalidAssetClassError);
  });
});
