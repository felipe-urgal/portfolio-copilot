import { describe, expect, it } from "vitest";

import { InvalidFinancialSnapshotError, Percentage } from "./index";

describe("Percentage", () => {
  it("keeps four decimal places of percentage precision without floats", () => {
    const percentage = Percentage.fromPercent("22.1234");

    expect(percentage.scaledUnits).toBe(221234n);
    expect(percentage.toPercentString()).toBe("22.1234");
  });

  it("rounds half away from zero deterministically", () => {
    expect(Percentage.fromPercent("22.12344").toPercentString()).toBe("22.1234");
    expect(Percentage.fromPercent("22.12345").toPercentString()).toBe("22.1235");
    expect(Percentage.fromPercent("-22.12345").toPercentString()).toBe("-22.1235");
  });

  it("allows signed and greater-than-100 values because returns are not allocation weights", () => {
    expect(Percentage.fromPercent("-25").toPercentString()).toBe("-25.0000");
    expect(Percentage.fromPercent("150").toPercentString()).toBe("150.0000");
  });

  it("supports exact addition, subtraction and comparison", () => {
    const left = Percentage.fromPercent("12.3456");
    const right = Percentage.fromPercent("7.6544");

    expect(left.add(right).toPercentString()).toBe("20.0000");
    expect(left.subtract(right).toPercentString()).toBe("4.6912");
    expect(left.compare(right)).toBe(1);
    expect(right.compare(left)).toBe(-1);
    expect(left.compare(left)).toBe(0);
  });

  it("serializes integer scaled units rather than floating-point values", () => {
    const original = Percentage.fromPercent("-12.3456");
    const snapshot = original.toSnapshot();
    const restored = Percentage.fromSnapshot(snapshot);

    expect(snapshot).toEqual({ scaledUnits: "-123456" });
    expect(restored.equals(original)).toBe(true);
  });

  it("rejects malformed snapshots with a typed financial error", () => {
    expect(() => Percentage.fromSnapshot({ scaledUnits: "12.34" })).toThrowError(
      InvalidFinancialSnapshotError,
    );
  });
});
