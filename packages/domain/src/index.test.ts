import { describe, expect, it } from "vitest";

import { AllocationWeight, AssetClass, AssetId, Money, Percentage } from "./index";

describe("domain package boundary", () => {
  it("exports the fundamental financial and asset value objects", () => {
    expect(Money.fromDecimal("1.00", "BRL").toDecimalString()).toBe("1.00");
    expect(Percentage.fromPercent("10").toPercentString()).toBe("10.0000");
    expect(AllocationWeight.fromPercent("50").toPercentString()).toBe("50.0000");
    expect(AssetClass.from("EQUITY").toString()).toBe("EQUITY");
    expect(AssetId.from("550e8400-e29b-41d4-a716-446655440000").toString()).toBe(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });
});
