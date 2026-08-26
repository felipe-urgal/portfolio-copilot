import { describe, expect, it } from "vitest";

import { AllocationWeight, AllocationWeightOutOfRangeError, Percentage } from "./index";

describe("AllocationWeight", () => {
  it("accepts the inclusive 0% and 100% boundaries", () => {
    expect(AllocationWeight.zero().toPercentString()).toBe("0.0000");
    expect(AllocationWeight.full().toPercentString()).toBe("100.0000");
  });

  it("accepts valid fractional weights", () => {
    expect(AllocationWeight.fromPercent("22.5").toPercentString()).toBe("22.5000");
  });

  it("rejects values below 0%", () => {
    expect(() => AllocationWeight.fromPercent("-0.0001")).toThrowError(
      AllocationWeightOutOfRangeError,
    );
  });

  it("rejects values above 100% before precision rounding can hide them", () => {
    expect(() => AllocationWeight.fromPercent("100.00001")).toThrowError(
      AllocationWeightOutOfRangeError,
    );
    expect(() => AllocationWeight.fromPercent("100.1")).toThrowError(
      AllocationWeightOutOfRangeError,
    );
  });

  it("allows signed zero but normalizes it to zero", () => {
    expect(AllocationWeight.fromPercent("-0.0000").toPercentString()).toBe("0.0000");
  });

  it("rejects an out-of-range Percentage when converting", () => {
    expect(() => AllocationWeight.fromPercentage(Percentage.fromPercent("120"))).toThrowError(
      AllocationWeightOutOfRangeError,
    );
  });

  it("compares weights deterministically", () => {
    const lower = AllocationWeight.fromPercent("30");
    const higher = AllocationWeight.fromPercent("70");

    expect(lower.compare(higher)).toBe(-1);
    expect(higher.compare(lower)).toBe(1);
    expect(lower.equals(AllocationWeight.fromPercent("30.0000"))).toBe(true);
  });
});
