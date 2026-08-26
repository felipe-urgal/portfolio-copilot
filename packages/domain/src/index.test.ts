import { describe, expect, it } from "vitest";

import { AllocationWeight, Money, Percentage } from "./index";

describe("domain package boundary", () => {
  it("exports the fundamental financial value objects", () => {
    expect(Money.fromDecimal("1.00", "BRL").toDecimalString()).toBe("1.00");
    expect(Percentage.fromPercent("10").toPercentString()).toBe("10.0000");
    expect(AllocationWeight.fromPercent("50").toPercentString()).toBe("50.0000");
  });
});
