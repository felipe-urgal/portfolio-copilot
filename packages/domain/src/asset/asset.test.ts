import { describe, expect, it } from "vitest";

import { InvalidCurrencyCodeError } from "../financial";
import {
  Asset,
  DuplicateExternalAssetIdentifierError,
  ExternalAssetIdentifier,
  InvalidAssetClassError,
  InvalidAssetIdError,
  InvalidAssetNameError,
  InvalidInstrumentTypeError,
} from "./index";

const FIRST_ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const SECOND_ASSET_ID = "550e8400-e29b-41d4-a716-446655440001";

describe("Asset", () => {
  it("creates a valid asset with stable identity, economic class and instrument type", () => {
    const ticker = ExternalAssetIdentifier.marketSymbol("B3", "ITUB4");
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: " Itaú Unibanco PN ",
      assetClass: "equity",
      instrumentType: "stock",
      referenceCurrency: "brl",
      externalIdentifiers: [ticker],
    });

    expect(asset.id.toString()).toBe(FIRST_ASSET_ID);
    expect(asset.name).toBe("Itaú Unibanco PN");
    expect(asset.assetClass.toString()).toBe("EQUITY");
    expect(asset.instrumentType.toString()).toBe("STOCK");
    expect(asset.referenceCurrency.toString()).toBe("BRL");
    expect(asset.hasExternalIdentifier(ticker)).toBe(true);
  });

  it("represents an equity ETF without classifying ETF as an economic asset class", () => {
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: "Equity Index ETF",
      assetClass: "EQUITY",
      instrumentType: "ETF",
      referenceCurrency: "USD",
    });

    expect(asset.assetClass.toString()).toBe("EQUITY");
    expect(asset.instrumentType.toString()).toBe("ETF");
  });

  it("allows a fixed-income asset with no ticker or external identifier", () => {
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: "Tesouro Selic 2029",
      assetClass: "FIXED_INCOME",
      instrumentType: "FIXED_INCOME_INSTRUMENT",
      referenceCurrency: "BRL",
    });

    expect(asset.externalIdentifiers).toEqual([]);
  });

  it("uses AssetId rather than ticker as domain identity", () => {
    const ticker = ExternalAssetIdentifier.marketSymbol("B3", "ABCD3");
    const first = Asset.create({
      id: FIRST_ASSET_ID,
      name: "Empresa A",
      assetClass: "EQUITY",
      instrumentType: "STOCK",
      referenceCurrency: "BRL",
      externalIdentifiers: [ticker],
    });
    const second = Asset.create({
      id: SECOND_ASSET_ID,
      name: "Empresa B",
      assetClass: "EQUITY",
      instrumentType: "STOCK",
      referenceCurrency: "BRL",
      externalIdentifiers: [ticker],
    });

    expect(first.sameIdentityAs(second)).toBe(false);
    expect(first.hasExternalIdentifier(ticker)).toBe(true);
    expect(second.hasExternalIdentifier(ticker)).toBe(true);
  });

  it("rejects invalid ids, names, classes, instrument types and currencies", () => {
    expect(() =>
      Asset.create({
        id: "ITUB4",
        name: "Itaú",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetIdError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "   ",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetNameError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú",
        assetClass: "STOCK",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetClassError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú",
        assetClass: "EQUITY",
        instrumentType: "EQUITY",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidInstrumentTypeError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "R$",
      }),
    ).toThrowError(InvalidCurrencyCodeError);
  });

  it("rejects duplicate external identifiers within one asset", () => {
    const ticker = ExternalAssetIdentifier.marketSymbol("B3", "ITUB4");

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú Unibanco PN",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
        externalIdentifiers: [ticker, ticker],
      }),
    ).toThrowError(DuplicateExternalAssetIdentifierError);
  });

  it("defensively copies the external identifier collection", () => {
    const identifiers = [ExternalAssetIdentifier.marketSymbol("B3", "ITUB4")];
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: "Itaú Unibanco PN",
      assetClass: "EQUITY",
      instrumentType: "STOCK",
      referenceCurrency: "BRL",
      externalIdentifiers: identifiers,
    });

    identifiers.push(ExternalAssetIdentifier.isin("BRITUBACNPR1"));

    expect(asset.externalIdentifiers).toHaveLength(1);
  });
});
