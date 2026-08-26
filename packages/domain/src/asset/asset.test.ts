import { describe, expect, it } from "vitest";

import { InvalidCurrencyCodeError } from "../financial";
import {
  Asset,
  DuplicateExternalAssetIdentifierError,
  ExternalAssetIdentifier,
  InvalidAssetClassError,
  InvalidAssetIdError,
  InvalidAssetNameError,
} from "./index";

const FIRST_ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const SECOND_ASSET_ID = "550e8400-e29b-41d4-a716-446655440001";

describe("Asset", () => {
  it("creates a valid asset with stable identity and reference currency", () => {
    const ticker = ExternalAssetIdentifier.marketSymbol("B3", "ITUB4");
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: " Itaú Unibanco PN ",
      assetClass: "equity",
      referenceCurrency: "brl",
      externalIdentifiers: [ticker],
    });

    expect(asset.id.toString()).toBe(FIRST_ASSET_ID);
    expect(asset.name).toBe("Itaú Unibanco PN");
    expect(asset.assetClass.toString()).toBe("EQUITY");
    expect(asset.referenceCurrency.toString()).toBe("BRL");
    expect(asset.hasExternalIdentifier(ticker)).toBe(true);
  });

  it("allows an asset with no ticker or external identifier", () => {
    const asset = Asset.create({
      id: FIRST_ASSET_ID,
      name: "Tesouro Selic 2029",
      assetClass: "FIXED_INCOME",
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
      referenceCurrency: "BRL",
      externalIdentifiers: [ticker],
    });
    const second = Asset.create({
      id: SECOND_ASSET_ID,
      name: "Empresa B",
      assetClass: "EQUITY",
      referenceCurrency: "BRL",
      externalIdentifiers: [ticker],
    });

    expect(first.sameIdentityAs(second)).toBe(false);
    expect(first.hasExternalIdentifier(ticker)).toBe(true);
    expect(second.hasExternalIdentifier(ticker)).toBe(true);
  });

  it("rejects invalid ids, names, classes and currencies", () => {
    expect(() =>
      Asset.create({
        id: "ITUB4",
        name: "Itaú",
        assetClass: "EQUITY",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetIdError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "   ",
        assetClass: "EQUITY",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetNameError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú",
        assetClass: "STOCK",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidAssetClassError);

    expect(() =>
      Asset.create({
        id: FIRST_ASSET_ID,
        name: "Itaú",
        assetClass: "EQUITY",
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
      referenceCurrency: "BRL",
      externalIdentifiers: identifiers,
    });

    identifiers.push(ExternalAssetIdentifier.isin("BRITUBACNPR1"));

    expect(asset.externalIdentifiers).toHaveLength(1);
  });
});
