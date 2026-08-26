import { describe, expect, it } from "vitest";

import {
  createCashTransactionSnapshot,
  createInitialCashTransactionDraft,
  normalizeCashAmount,
} from "./cash-transaction-form";

const PORTFOLIO = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const TRANSACTION_ID = "7744df4d-bb41-4a07-b582-a8d8f710a8af";
const OCCURRED_AT = "2026-08-26T21:05:00.000Z";

describe("cash transaction form adapter", () => {
  it("creates the initial draft as a cash inflow", () => {
    expect(createInitialCashTransactionDraft()).toEqual({
      type: "CASH_IN",
      amount: "",
    });
  });

  it("normalizes a single decimal comma without using number conversion", () => {
    expect(normalizeCashAmount(" 1234,56 ")).toBe("1234.56");
    expect(normalizeCashAmount("1234.56")).toBe("1234.56");
  });

  it("creates a CASH_IN snapshot linked to the current portfolio", () => {
    const result = createCashTransactionSnapshot(
      { type: "CASH_IN", amount: "1234,56" },
      PORTFOLIO,
      () => TRANSACTION_ID,
      () => OCCURRED_AT,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        id: TRANSACTION_ID,
        portfolioId: PORTFOLIO.id,
        type: "CASH_IN",
        occurredAt: OCCURRED_AT,
        settlementAmount: {
          currency: "BRL",
          minorUnits: "123456",
        },
        assetId: null,
        quantity: null,
      },
    });
  });

  it("creates a CASH_OUT without inventing an asset or quantity", () => {
    const result = createCashTransactionSnapshot(
      { type: "CASH_OUT", amount: "50" },
      PORTFOLIO,
      () => TRANSACTION_ID,
      () => OCCURRED_AT,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.snapshot.type).toBe("CASH_OUT");
      expect(result.snapshot.settlementAmount.minorUnits).toBe("5000");
      expect(result.snapshot.assetId).toBeNull();
      expect(result.snapshot.quantity).toBeNull();
    }
  });

  it("translates invalid and non-positive amounts into field feedback", () => {
    const invalid = createCashTransactionSnapshot(
      { type: "CASH_IN", amount: "1,2,3" },
      PORTFOLIO,
      () => TRANSACTION_ID,
      () => OCCURRED_AT,
    );
    const zero = createCashTransactionSnapshot(
      { type: "CASH_OUT", amount: "0" },
      PORTFOLIO,
      () => TRANSACTION_ID,
      () => OCCURRED_AT,
    );

    expect(invalid).toEqual({
      ok: false,
      errors: { amount: "Informe um valor monetário válido, como 1000,00." },
    });
    expect(zero).toEqual({
      ok: false,
      errors: { amount: "Informe um valor maior que zero." },
    });
  });

  it("translates invalid generated identity and timestamp into form feedback", () => {
    const invalidId = createCashTransactionSnapshot(
      { type: "CASH_IN", amount: "100" },
      PORTFOLIO,
      () => "not-a-uuid",
      () => OCCURRED_AT,
    );
    const invalidTimestamp = createCashTransactionSnapshot(
      { type: "CASH_IN", amount: "100" },
      PORTFOLIO,
      () => TRANSACTION_ID,
      () => "2026-08-26",
    );

    expect(invalidId).toEqual({
      ok: false,
      errors: { form: "Não foi possível registrar a transação local. Tente novamente." },
    });
    expect(invalidTimestamp).toEqual({
      ok: false,
      errors: { form: "Não foi possível registrar a transação local. Tente novamente." },
    });
  });
});
