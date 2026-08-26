import { describe, expect, it } from "vitest";

import {
  DuplicateTargetAllocationBucketError,
  InvalidTargetAllocationTotalWeightError,
  TargetAllocation,
  ZeroTargetAllocationWeightError,
} from "./index";

const FIRST_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const SECOND_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440011";

describe("TargetAllocation", () => {
  it("creates a complete allocation with one bucket", () => {
    const allocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "FIXED_INCOME", targetWeight: "100" }],
    });

    expect(allocation.portfolioId.toString()).toBe(FIRST_PORTFOLIO_ID);
    expect(allocation.buckets).toHaveLength(1);
    expect(allocation.targetWeightFor("FIXED_INCOME").toPercentString()).toBe("100.0000");
    expect(allocation.targetWeightFor("EQUITY").toPercentString()).toBe("0.0000");
    expect(Object.isFrozen(allocation.buckets)).toBe(true);
    expect(Object.isFrozen(allocation.buckets[0])).toBe(true);
  });

  it("rejects an empty allocation", () => {
    expect(() =>
      TargetAllocation.create({
        portfolioId: FIRST_PORTFOLIO_ID,
        buckets: [],
      }),
    ).toThrowError(InvalidTargetAllocationTotalWeightError);
  });

  it("accepts multiple buckets whose exact weights total 100%", () => {
    const allocation = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "REAL_ESTATE", targetWeight: "10" },
        { assetClass: "FIXED_INCOME", targetWeight: "45.1234" },
        { assetClass: "EQUITY", targetWeight: "44.8766" },
      ],
    });

    expect(allocation.toSnapshot().buckets).toEqual([
      { assetClass: "EQUITY", targetWeightPercent: "44.8766" },
      { assetClass: "FIXED_INCOME", targetWeightPercent: "45.1234" },
      { assetClass: "REAL_ESTATE", targetWeightPercent: "10.0000" },
    ]);
  });

  it("rejects a total below 100%", () => {
    expect(() =>
      TargetAllocation.create({
        portfolioId: FIRST_PORTFOLIO_ID,
        buckets: [{ assetClass: "EQUITY", targetWeight: "99.9999" }],
      }),
    ).toThrowError(InvalidTargetAllocationTotalWeightError);
  });

  it("rejects a total above 100%", () => {
    expect(() =>
      TargetAllocation.create({
        portfolioId: FIRST_PORTFOLIO_ID,
        buckets: [
          { assetClass: "FIXED_INCOME", targetWeight: "60" },
          { assetClass: "EQUITY", targetWeight: "40.0001" },
        ],
      }),
    ).toThrowError(InvalidTargetAllocationTotalWeightError);
  });

  it("rejects duplicate asset-class buckets after normalization", () => {
    expect(() =>
      TargetAllocation.create({
        portfolioId: FIRST_PORTFOLIO_ID,
        buckets: [
          { assetClass: "equity", targetWeight: "50" },
          { assetClass: "EQUITY", targetWeight: "50" },
        ],
      }),
    ).toThrowError(DuplicateTargetAllocationBucketError);
  });

  it("rejects an explicit zero-weight bucket", () => {
    expect(() =>
      TargetAllocation.create({
        portfolioId: FIRST_PORTFOLIO_ID,
        buckets: [
          { assetClass: "FIXED_INCOME", targetWeight: "100" },
          { assetClass: "EQUITY", targetWeight: "0" },
        ],
      }),
    ).toThrowError(ZeroTargetAllocationWeightError);
  });

  it("keeps allocations for different portfolios distinct", () => {
    const first = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });
    const second = TargetAllocation.create({
      portfolioId: SECOND_PORTFOLIO_ID,
      buckets: [{ assetClass: "EQUITY", targetWeight: "100" }],
    });

    expect(first.portfolioId.equals(second.portfolioId)).toBe(false);
    expect(first.toSnapshot().buckets).toEqual(second.toSnapshot().buckets);
  });

  it("round-trips through a deterministic snapshot", () => {
    const original = TargetAllocation.create({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "REAL_ESTATE", targetWeight: "10" },
        { assetClass: "EQUITY", targetWeight: "45" },
        { assetClass: "FIXED_INCOME", targetWeight: "45" },
      ],
    });

    const snapshot = original.toSnapshot();
    const restored = TargetAllocation.fromSnapshot(snapshot);

    expect(snapshot).toEqual({
      portfolioId: FIRST_PORTFOLIO_ID,
      buckets: [
        { assetClass: "EQUITY", targetWeightPercent: "45.0000" },
        { assetClass: "FIXED_INCOME", targetWeightPercent: "45.0000" },
        { assetClass: "REAL_ESTATE", targetWeightPercent: "10.0000" },
      ],
    });
    expect(restored.toSnapshot()).toEqual(snapshot);
  });
});
