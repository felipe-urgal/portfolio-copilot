import { describe, expect, it } from "vitest";

import { Money } from "../financial";
import { Transaction } from "../transaction";
import {
  DuplicateTransactionInPositionProjectionError,
  InsufficientAssetPositionError,
  projectAssetPositions,
} from "./index";

const PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const SECOND_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440011";
const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const SECOND_ASSET_ID = "550e8400-e29b-41d4-a716-446655440001";
const EARLY_TIMESTAMP = "2026-08-26T12:00:00.000Z";
const LATE_TIMESTAMP = "2026-08-26T13:00:00.000Z";

function transactionId(suffix: number): string {
  return `550e8400-e29b-41d4-a716-44665544${suffix.toString().padStart(4, "0")}`;
}

type TradeInput = Readonly<{
  id?: string;
  portfolioId?: string;
  assetId?: string;
  type?: "BUY" | "SELL";
  quantity?: string;
  occurredAt?: string;
}>;

function createTrade(input: TradeInput = {}): Transaction {
  return Transaction.create({
    id: input.id ?? transactionId(20),
    portfolioId: input.portfolioId ?? PORTFOLIO_ID,
    type: input.type ?? "BUY",
    occurredAt: input.occurredAt ?? EARLY_TIMESTAMP,
    settlementAmount: Money.fromDecimal("100.00", "BRL"),
    assetId: input.assetId ?? ASSET_ID,
    quantity: input.quantity ?? "1",
  });
}

function createCashFlow(type: "CASH_IN" | "CASH_OUT", id: string): Transaction {
  return Transaction.create({
    id,
    portfolioId: PORTFOLIO_ID,
    type,
    occurredAt: EARLY_TIMESTAMP,
    settlementAmount: Money.fromDecimal("100.00", "BRL"),
  });
}

function snapshot(positions: ReturnType<typeof projectAssetPositions>) {
  return positions.map((position) => ({
    assetId: position.assetId.toString(),
    quantity: position.quantity.toDecimalString(),
  }));
}

describe("projectAssetPositions", () => {
  it("returns no positions for a portfolio without transactions", () => {
    expect(projectAssetPositions(PORTFOLIO_ID, [])).toEqual([]);
  });

  it("projects one buy using AssetId and exact AssetQuantity precision", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ quantity: "0.123456789012" }),
    ]);

    expect(snapshot(result)).toEqual([{ assetId: ASSET_ID, quantity: "0.123456789012" }]);
  });

  it("adds multiple buys of the same asset without floating-point drift", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ id: transactionId(20), quantity: "0.1" }),
      createTrade({ id: transactionId(21), quantity: "0.000000000001" }),
      createTrade({ id: transactionId(22), quantity: "0.2" }),
    ]);

    expect(snapshot(result)).toEqual([{ assetId: ASSET_ID, quantity: "0.300000000001" }]);
  });

  it("rejects duplicate transaction identities instead of double-applying ledger facts", () => {
    const transaction = createTrade({ id: transactionId(20), quantity: "2" });

    expect(() => projectAssetPositions(PORTFOLIO_ID, [transaction, transaction])).toThrowError(
      DuplicateTransactionInPositionProjectionError,
    );
  });

  it("subtracts a partial sell from the current position", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ id: transactionId(20), quantity: "10" }),
      createTrade({
        id: transactionId(21),
        type: "SELL",
        quantity: "2.5",
        occurredAt: LATE_TIMESTAMP,
      }),
    ]);

    expect(snapshot(result)).toEqual([{ assetId: ASSET_ID, quantity: "7.500000000000" }]);
  });

  it("removes a fully sold asset from the current open-position projection", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ id: transactionId(20), quantity: "10" }),
      createTrade({
        id: transactionId(21),
        type: "SELL",
        quantity: "10",
        occurredAt: LATE_TIMESTAMP,
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("rejects a sell that would make the position negative", () => {
    const transactions = [
      createTrade({ id: transactionId(20), quantity: "2" }),
      createTrade({
        id: transactionId(21),
        type: "SELL",
        quantity: "3",
        occurredAt: LATE_TIMESTAMP,
      }),
    ];

    expect(() => projectAssetPositions(PORTFOLIO_ID, transactions)).toThrowError(
      InsufficientAssetPositionError,
    );

    try {
      projectAssetPositions(PORTFOLIO_ID, transactions);
    } catch (error) {
      expect(error).toMatchObject({
        code: "INSUFFICIENT_ASSET_POSITION",
        portfolioId: PORTFOLIO_ID,
        assetId: ASSET_ID,
        transactionId: transactionId(21),
        availableQuantity: "2.000000000000",
        requestedQuantity: "3.000000000000",
      });
    }
  });

  it("projects multiple assets independently and returns them ordered by AssetId", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ id: transactionId(20), assetId: SECOND_ASSET_ID, quantity: "4" }),
      createTrade({ id: transactionId(21), assetId: ASSET_ID, quantity: "2" }),
    ]);

    expect(snapshot(result)).toEqual([
      { assetId: ASSET_ID, quantity: "2.000000000000" },
      { assetId: SECOND_ASSET_ID, quantity: "4.000000000000" },
    ]);
  });

  it("isolates transactions by PortfolioId before applying position rules", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createTrade({ id: transactionId(20), quantity: "2" }),
      createTrade({
        id: transactionId(21),
        portfolioId: SECOND_PORTFOLIO_ID,
        type: "SELL",
        quantity: "999",
        occurredAt: LATE_TIMESTAMP,
      }),
    ]);

    expect(snapshot(result)).toEqual([{ assetId: ASSET_ID, quantity: "2.000000000000" }]);
  });

  it("ignores CASH_IN and CASH_OUT for asset positions", () => {
    const result = projectAssetPositions(PORTFOLIO_ID, [
      createCashFlow("CASH_IN", transactionId(20)),
      createTrade({ id: transactionId(21), quantity: "3" }),
      createCashFlow("CASH_OUT", transactionId(22)),
    ]);

    expect(snapshot(result)).toEqual([{ assetId: ASSET_ID, quantity: "3.000000000000" }]);
  });

  it("uses occurredAt chronology and preserves input order when timestamps are equal", () => {
    const buy = createTrade({ id: transactionId(20), quantity: "5", occurredAt: EARLY_TIMESTAMP });
    const sell = createTrade({
      id: transactionId(21),
      type: "SELL",
      quantity: "2",
      occurredAt: LATE_TIMESTAMP,
    });

    expect(snapshot(projectAssetPositions(PORTFOLIO_ID, [sell, buy]))).toEqual([
      { assetId: ASSET_ID, quantity: "3.000000000000" },
    ]);

    const sameTimeBuy = createTrade({
      id: transactionId(22),
      quantity: "2",
      occurredAt: EARLY_TIMESTAMP,
    });
    const sameTimeSell = createTrade({
      id: transactionId(23),
      type: "SELL",
      quantity: "1",
      occurredAt: EARLY_TIMESTAMP,
    });

    expect(snapshot(projectAssetPositions(PORTFOLIO_ID, [sameTimeBuy, sameTimeSell]))).toEqual([
      { assetId: ASSET_ID, quantity: "1.000000000000" },
    ]);
    expect(() => projectAssetPositions(PORTFOLIO_ID, [sameTimeSell, sameTimeBuy])).toThrowError(
      InsufficientAssetPositionError,
    );
  });

  it("is reproducible when executed repeatedly with the same input sequence", () => {
    const transactions = [
      createTrade({ id: transactionId(20), assetId: SECOND_ASSET_ID, quantity: "1.5" }),
      createTrade({ id: transactionId(21), assetId: ASSET_ID, quantity: "2.25" }),
    ];

    expect(snapshot(projectAssetPositions(PORTFOLIO_ID, transactions))).toEqual(
      snapshot(projectAssetPositions(PORTFOLIO_ID, transactions)),
    );
  });
});
