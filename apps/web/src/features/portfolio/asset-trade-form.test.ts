import { describe, expect, it } from "vitest";

import {
  createAssetTradeSnapshot,
  createInitialAssetTradeDraft,
  normalizeTradeDecimal,
  projectLocalAssetPositions,
} from "./asset-trade-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;
const ASSET_ID = "62c1cf28-ea08-4f0f-b2ec-991ee889f55d";
const BUY_ID = "7744df4d-bb41-4a07-b582-a8d8f710a8af";
const SELL_ID = "d0778205-ab7c-42dd-866f-6ca7ca284103";
const BUY_AT = "2026-08-26T21:05:00.000Z";
const SELL_AT = "2026-08-26T21:06:00.000Z";

describe("asset trade form adapter", () => {
  it("creates the initial BUY draft with an optional selected asset", () => {
    expect(createInitialAssetTradeDraft(ASSET_ID)).toEqual({
      type: "BUY",
      assetId: ASSET_ID,
      quantity: "",
      settlementAmount: "",
    });
  });

  it("normalizes decimal comma without converting through number", () => {
    expect(normalizeTradeDecimal(" 10,125 ")).toBe("10.125");
    expect(normalizeTradeDecimal("10.125")).toBe("10.125");
  });

  it("creates a BUY linked to the selected asset and portfolio", () => {
    const result = createAssetTradeSnapshot(
      {
        type: "BUY",
        assetId: ASSET_ID,
        quantity: "2,5",
        settlementAmount: "1250,00",
      },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        id: BUY_ID,
        portfolioId: PORTFOLIO.id,
        type: "BUY",
        occurredAt: BUY_AT,
        settlementAmount: {
          currency: "BRL",
          minorUnits: "125000",
        },
        assetId: ASSET_ID,
        quantity: {
          scaledUnits: "2500000000000",
        },
      },
    });
  });

  it("projects positions from BUY/SELL while ignoring cash flows", () => {
    const buy = createAssetTradeSnapshot(
      {
        type: "BUY",
        assetId: ASSET_ID,
        quantity: "3",
        settlementAmount: "1500",
      },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );

    expect(buy.ok).toBe(true);
    if (!buy.ok) return;

    const cashIn = {
      id: "7694e719-5448-448a-b9b7-f51f88f56652",
      portfolioId: PORTFOLIO.id,
      type: "CASH_IN",
      occurredAt: "2026-08-26T21:05:30.000Z",
      settlementAmount: { currency: "BRL", minorUnits: "50000" },
      assetId: null,
      quantity: null,
    } as const;
    const sell = createAssetTradeSnapshot(
      {
        type: "SELL",
        assetId: ASSET_ID,
        quantity: "1,25",
        settlementAmount: "700",
      },
      PORTFOLIO,
      [buy.snapshot, cashIn],
      () => SELL_ID,
      () => SELL_AT,
    );

    expect(sell.ok).toBe(true);
    if (!sell.ok) return;

    expect(projectLocalAssetPositions(PORTFOLIO.id, [buy.snapshot, cashIn, sell.snapshot])).toEqual(
      [
        {
          assetId: ASSET_ID,
          quantity: "1.750000000000",
        },
      ],
    );
  });

  it("rejects a SELL above the position available from the existing ledger", () => {
    const buy = createAssetTradeSnapshot(
      {
        type: "BUY",
        assetId: ASSET_ID,
        quantity: "1",
        settlementAmount: "500",
      },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );

    expect(buy.ok).toBe(true);
    if (!buy.ok) return;

    const sell = createAssetTradeSnapshot(
      {
        type: "SELL",
        assetId: ASSET_ID,
        quantity: "1.5",
        settlementAmount: "750",
      },
      PORTFOLIO,
      [buy.snapshot],
      () => SELL_ID,
      () => SELL_AT,
    );

    expect(sell).toEqual({
      ok: false,
      errors: {
        quantity: "Venda maior que a posição disponível (1.000000000000).",
      },
    });
  });

  it("translates asset, quantity and settlement validation failures", () => {
    const missingAsset = createAssetTradeSnapshot(
      { type: "BUY", assetId: "", quantity: "1", settlementAmount: "100" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );
    const invalidQuantity = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "1,2,3", settlementAmount: "100" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );
    const zeroQuantity = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "0", settlementAmount: "100" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );
    const invalidAmount = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "1", settlementAmount: "abc" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );
    const zeroAmount = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "1", settlementAmount: "0" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => BUY_AT,
    );

    expect(missingAsset).toEqual({
      ok: false,
      errors: { assetId: "Selecione um ativo válido desta sessão." },
    });
    expect(invalidQuantity).toEqual({
      ok: false,
      errors: { quantity: "Informe uma quantidade válida com até 12 casas decimais." },
    });
    expect(zeroQuantity).toEqual({
      ok: false,
      errors: { quantity: "Informe uma quantidade maior que zero." },
    });
    expect(invalidAmount).toEqual({
      ok: false,
      errors: { settlementAmount: "Informe um valor monetário válido, como 1000,00." },
    });
    expect(zeroAmount).toEqual({
      ok: false,
      errors: { settlementAmount: "Informe um valor de liquidação maior que zero." },
    });
  });

  it("translates invalid generated trade identity and timestamp into form feedback", () => {
    const invalidId = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "1", settlementAmount: "100" },
      PORTFOLIO,
      [],
      () => "not-a-uuid",
      () => BUY_AT,
    );
    const invalidTimestamp = createAssetTradeSnapshot(
      { type: "BUY", assetId: ASSET_ID, quantity: "1", settlementAmount: "100" },
      PORTFOLIO,
      [],
      () => BUY_ID,
      () => "2026-08-26",
    );

    expect(invalidId).toEqual({
      ok: false,
      errors: { form: "Não foi possível registrar a transação com ativo. Tente novamente." },
    });
    expect(invalidTimestamp).toEqual({
      ok: false,
      errors: { form: "Não foi possível registrar a transação com ativo. Tente novamente." },
    });
  });
});
