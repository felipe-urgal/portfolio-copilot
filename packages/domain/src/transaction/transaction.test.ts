import { describe, expect, it } from "vitest";

import { InvalidAssetIdError } from "../asset";
import { Money } from "../financial";
import { InvalidPortfolioIdError } from "../portfolio";
import { InvalidTransactionAmountError, InvalidTransactionShapeError, Transaction } from "./index";

const TRANSACTION_ID = "550e8400-e29b-41d4-a716-446655440020";
const SECOND_TRANSACTION_ID = "550e8400-e29b-41d4-a716-446655440021";
const PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const OCCURRED_AT = "2026-08-26T12:30:45.123Z";

function createTrade(type: "BUY" | "SELL", id = TRANSACTION_ID): Transaction {
  return Transaction.create({
    id,
    portfolioId: PORTFOLIO_ID,
    type,
    occurredAt: OCCURRED_AT,
    settlementAmount: Money.fromDecimal("1234.56", "BRL"),
    assetId: ASSET_ID,
    quantity: "10.00000001",
  });
}

describe("Transaction", () => {
  it("creates valid BUY and SELL facts with positive absolute values", () => {
    const buy = createTrade("BUY");
    const sell = createTrade("SELL", SECOND_TRANSACTION_ID);

    expect(buy.type.toString()).toBe("BUY");
    expect(buy.assetId?.toString()).toBe(ASSET_ID);
    expect(buy.quantity?.toDecimalString()).toBe("10.000000010000");
    expect(buy.settlementAmount.toDecimalString()).toBe("1234.56");
    expect(sell.type.toString()).toBe("SELL");
    expect(buy.sameIdentityAs(sell)).toBe(false);
  });

  it("creates cash flows without pretending they are asset trades", () => {
    for (const type of ["CASH_IN", "CASH_OUT"] as const) {
      const transaction = Transaction.create({
        id: type === "CASH_IN" ? TRANSACTION_ID : SECOND_TRANSACTION_ID,
        portfolioId: PORTFOLIO_ID,
        type,
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("1000.00", "BRL"),
      });

      expect(transaction.assetId).toBeNull();
      expect(transaction.quantity).toBeNull();
      expect(transaction.type.toString()).toBe(type);
    }
  });

  it("rejects incomplete trades and asset fields on cash flows", () => {
    expect(() =>
      Transaction.create({
        id: TRANSACTION_ID,
        portfolioId: PORTFOLIO_ID,
        type: "BUY",
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("100.00", "BRL"),
        assetId: ASSET_ID,
      }),
    ).toThrowError(InvalidTransactionShapeError);

    expect(() =>
      Transaction.create({
        id: TRANSACTION_ID,
        portfolioId: PORTFOLIO_ID,
        type: "SELL",
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("100.00", "BRL"),
        assetId: ASSET_ID,
        quantity: "0",
      }),
    ).toThrowError(InvalidTransactionShapeError);

    expect(() =>
      Transaction.create({
        id: TRANSACTION_ID,
        portfolioId: PORTFOLIO_ID,
        type: "CASH_IN",
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("100.00", "BRL"),
        assetId: ASSET_ID,
        quantity: "1",
      }),
    ).toThrowError(InvalidTransactionShapeError);
  });

  it("rejects zero or negative settlement amounts", () => {
    for (const amount of ["0.00", "-0.01"]) {
      expect(() =>
        Transaction.create({
          id: TRANSACTION_ID,
          portfolioId: PORTFOLIO_ID,
          type: "CASH_IN",
          occurredAt: OCCURRED_AT,
          settlementAmount: Money.fromDecimal(amount, "BRL"),
        }),
      ).toThrowError(InvalidTransactionAmountError);
    }
  });

  it("validates portfolio and asset identities instead of accepting external symbols", () => {
    expect(() =>
      Transaction.create({
        id: TRANSACTION_ID,
        portfolioId: "CARTEIRA-1",
        type: "CASH_IN",
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("100.00", "BRL"),
      }),
    ).toThrowError(InvalidPortfolioIdError);

    expect(() =>
      Transaction.create({
        id: TRANSACTION_ID,
        portfolioId: PORTFOLIO_ID,
        type: "BUY",
        occurredAt: OCCURRED_AT,
        settlementAmount: Money.fromDecimal("100.00", "BRL"),
        assetId: "ITUB4",
        quantity: "1",
      }),
    ).toThrowError(InvalidAssetIdError);
  });

  it("round-trips through a deterministic snapshot with no derived holdings", () => {
    const original = createTrade("BUY");
    const snapshot = original.toSnapshot();
    const restored = Transaction.fromSnapshot(snapshot);

    expect(snapshot).toEqual({
      id: TRANSACTION_ID,
      portfolioId: PORTFOLIO_ID,
      type: "BUY",
      occurredAt: OCCURRED_AT,
      settlementAmount: { currency: "BRL", minorUnits: "123456" },
      assetId: ASSET_ID,
      quantity: { scaledUnits: "10000000010000" },
    });
    expect(Object.keys(snapshot).sort()).toEqual(
      ["assetId", "id", "occurredAt", "portfolioId", "quantity", "settlementAmount", "type"].sort(),
    );
    expect(restored.sameIdentityAs(original)).toBe(true);
    expect(restored.toSnapshot()).toEqual(snapshot);
  });
});
