import { describe, expect, it } from "vitest";

import {
  createInitialLocalAssetDraft,
  createLocalAssetSnapshot,
  LOCAL_ASSET_CLASS_OPTIONS,
  LOCAL_INSTRUMENT_TYPE_OPTIONS,
} from "./local-asset-form";

const ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";

describe("local asset form adapter", () => {
  it("creates an equity stock draft using the portfolio reference currency", () => {
    expect(createInitialLocalAssetDraft("BRL")).toEqual({
      name: "",
      assetClass: "EQUITY",
      instrumentType: "STOCK",
      referenceCurrency: "BRL",
    });
  });

  it("exposes every domain asset class and instrument type as a human option", () => {
    expect(LOCAL_ASSET_CLASS_OPTIONS.map((option) => option.value)).toEqual([
      "CASH",
      "FIXED_INCOME",
      "EQUITY",
      "REAL_ESTATE",
      "COMMODITY",
      "CRYPTO_ASSET",
      "MULTI_ASSET",
    ]);
    expect(LOCAL_INSTRUMENT_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      "CASH_BALANCE",
      "FIXED_INCOME_INSTRUMENT",
      "STOCK",
      "ETF",
      "REAL_ESTATE_FUND",
      "INVESTMENT_FUND",
      "CRYPTO_ASSET",
    ]);
  });

  it("creates a normalized local asset snapshot from domain objects", () => {
    const result = createLocalAssetSnapshot(
      {
        name: "  ETF global  ",
        assetClass: "equity",
        instrumentType: "etf",
        referenceCurrency: "usd",
      },
      () => ASSET_ID,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        id: ASSET_ID,
        name: "ETF global",
        assetClass: "EQUITY",
        instrumentType: "ETF",
        referenceCurrency: "USD",
      },
    });
  });

  it("translates invalid asset fields without duplicating domain rules", () => {
    const invalidName = createLocalAssetSnapshot(
      {
        name: "   ",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      },
      () => ASSET_ID,
    );
    const invalidClass = createLocalAssetSnapshot(
      {
        name: "Ação local",
        assetClass: "UNKNOWN",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      },
      () => ASSET_ID,
    );
    const invalidInstrument = createLocalAssetSnapshot(
      {
        name: "Ação local",
        assetClass: "EQUITY",
        instrumentType: "UNKNOWN",
        referenceCurrency: "BRL",
      },
      () => ASSET_ID,
    );
    const invalidCurrency = createLocalAssetSnapshot(
      {
        name: "Ação local",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "REAL",
      },
      () => ASSET_ID,
    );

    expect(invalidName).toEqual({
      ok: false,
      errors: { name: "Informe um nome de ativo válido com até 160 caracteres." },
    });
    expect(invalidClass).toEqual({
      ok: false,
      errors: { assetClass: "Selecione uma classe econômica válida." },
    });
    expect(invalidInstrument).toEqual({
      ok: false,
      errors: { instrumentType: "Selecione um tipo de instrumento válido." },
    });
    expect(invalidCurrency).toEqual({
      ok: false,
      errors: { referenceCurrency: "Informe um código de moeda válido com 3 letras, como BRL." },
    });
  });

  it("translates an invalid generated asset identity into form feedback", () => {
    const result = createLocalAssetSnapshot(
      {
        name: "Ação local",
        assetClass: "EQUITY",
        instrumentType: "STOCK",
        referenceCurrency: "BRL",
      },
      () => "not-a-uuid",
    );

    expect(result).toEqual({
      ok: false,
      errors: { form: "Não foi possível gerar a identidade local do ativo. Tente novamente." },
    });
  });
});
