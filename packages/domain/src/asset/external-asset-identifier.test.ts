import { describe, expect, it } from "vitest";

import { ExternalAssetIdentifier, InvalidExternalAssetIdentifierError } from "./index";

describe("ExternalAssetIdentifier", () => {
  it("normalizes market and symbol explicitly", () => {
    const ticker = ExternalAssetIdentifier.marketSymbol(" b3 ", "itub4");

    expect(ticker.toSnapshot()).toEqual({
      kind: "MARKET_SYMBOL",
      scope: "B3",
      value: "ITUB4",
    });
  });

  it("accepts safe punctuation instead of assuming one exchange symbol grammar", () => {
    const symbol = ExternalAssetIdentifier.marketSymbol("GLOBAL", "abc/def");

    expect(symbol.toSnapshot()).toEqual({
      kind: "MARKET_SYMBOL",
      scope: "GLOBAL",
      value: "ABC/DEF",
    });
  });

  it("normalizes and validates the ISO 6166 ISIN checksum", () => {
    const isin = ExternalAssetIdentifier.isin("us0378331005");

    expect(isin.toSnapshot()).toEqual({
      kind: "ISIN",
      scope: "GLOBAL",
      value: "US0378331005",
    });

    expect(() => ExternalAssetIdentifier.isin("US0378331004")).toThrowError(
      InvalidExternalAssetIdentifierError,
    );
  });

  it("preserves provider identifier case while normalizing provider scope", () => {
    const providerId = ExternalAssetIdentifier.providerId(" yahoo_finance ", "Itub4.SA");

    expect(providerId.toSnapshot()).toEqual({
      kind: "PROVIDER_ID",
      scope: "YAHOO_FINANCE",
      value: "Itub4.SA",
    });
  });

  it("rejects malformed identifiers", () => {
    expect(() => ExternalAssetIdentifier.marketSymbol("B3", "")).toThrowError(
      InvalidExternalAssetIdentifierError,
    );
    expect(() => ExternalAssetIdentifier.marketSymbol("B3", "ABC DEF")).toThrowError(
      InvalidExternalAssetIdentifierError,
    );
    expect(() => ExternalAssetIdentifier.isin("BR123")).toThrowError(
      InvalidExternalAssetIdentifierError,
    );
    expect(() => ExternalAssetIdentifier.providerId("", "abc")).toThrowError(
      InvalidExternalAssetIdentifierError,
    );
  });
});
