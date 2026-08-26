import { describe, expect, it } from "vitest";

import {
  AllocationWeight,
  AssetClass,
  AssetId,
  AssetQuantity,
  calculateAllocationGaps,
  InstrumentType,
  Money,
  Percentage,
  PortfolioId,
  projectAssetPositions,
  TargetAllocation,
  TransactionId,
  TransactionTimestamp,
  TransactionType,
} from "./index";

describe("domain package boundary", () => {
  it("exports financial, asset, portfolio, position, contribution and transaction primitives", () => {
    expect(Money.fromDecimal("1.00", "BRL").toDecimalString()).toBe("1.00");
    expect(Percentage.fromPercent("10").toPercentString()).toBe("10.0000");
    expect(AllocationWeight.fromPercent("50").toPercentString()).toBe("50.0000");
    expect(AssetClass.from("EQUITY").toString()).toBe("EQUITY");
    expect(InstrumentType.from("ETF").toString()).toBe("ETF");
    expect(AssetId.from("550e8400-e29b-41d4-a716-446655440000").toString()).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(PortfolioId.from("550e8400-e29b-41d4-a716-446655440010").toString()).toBe(
      "550e8400-e29b-41d4-a716-446655440010",
    );
    expect(AssetQuantity.fromDecimal("0.1").toDecimalString()).toBe("0.100000000000");
    expect(TransactionId.from("550e8400-e29b-41d4-a716-446655440020").toString()).toBe(
      "550e8400-e29b-41d4-a716-446655440020",
    );
    expect(TransactionType.from("BUY").toString()).toBe("BUY");
    expect(TransactionTimestamp.from("2026-08-26T12:30:45.123Z").toString()).toBe(
      "2026-08-26T12:30:45.123Z",
    );
    expect(typeof projectAssetPositions).toBe("function");
    expect(typeof TargetAllocation.create).toBe("function");
    expect(typeof calculateAllocationGaps).toBe("function");
  });
});
