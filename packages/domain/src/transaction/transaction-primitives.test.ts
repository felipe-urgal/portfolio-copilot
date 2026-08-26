import { describe, expect, it } from "vitest";

import {
  InvalidTransactionIdError,
  InvalidTransactionTimestampError,
  InvalidTransactionTypeError,
  TransactionId,
  TransactionTimestamp,
  TransactionType,
} from "./index";

describe("TransactionId", () => {
  it("normalizes canonical UUID identities", () => {
    expect(TransactionId.from("550E8400-E29B-41D4-A716-446655440020").toString()).toBe(
      "550e8400-e29b-41d4-a716-446655440020",
    );
  });

  it("rejects malformed identities", () => {
    for (const value of ["", "TX-1", "00000000-0000-0000-0000-000000000000"]) {
      expect(() => TransactionId.from(value)).toThrowError(InvalidTransactionIdError);
    }
  });
});

describe("TransactionType", () => {
  it("normalizes the supported ledger taxonomy", () => {
    expect(TransactionType.from(" buy ").toString()).toBe("BUY");
    expect(TransactionType.from("sell").isAssetTrade()).toBe(true);
    expect(TransactionType.from("cash_in").isAssetTrade()).toBe(false);
  });

  it("rejects unsupported or premature transaction types", () => {
    for (const value of ["DIVIDEND", "FEE", "TRANSFER", ""]) {
      expect(() => TransactionType.from(value)).toThrowError(InvalidTransactionTypeError);
    }
  });
});

describe("TransactionTimestamp", () => {
  it("accepts only canonical UTC instants", () => {
    expect(TransactionTimestamp.from("2026-08-26T12:30:45.123Z").toString()).toBe(
      "2026-08-26T12:30:45.123Z",
    );
  });

  it("rejects ambiguous, offset, impossible or non-canonical timestamps", () => {
    for (const value of [
      "2026-08-26",
      "2026-08-26T12:30:45Z",
      "2026-08-26T09:30:45.123-03:00",
      "2026-02-30T12:30:45.123Z",
      "not-a-date",
    ]) {
      expect(() => TransactionTimestamp.from(value)).toThrowError(InvalidTransactionTimestampError);
    }
  });
});
