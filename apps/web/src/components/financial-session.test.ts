import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { financialSessionReducer } from "./financial-session";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "3000000" },
  goals: [],
};

describe("financialSessionReducer", () => {
  it("publishes the final validated profile snapshot as the shared session source", () => {
    const result = financialSessionReducer(
      { financialProfile: null },
      { type: "publish-financial-profile", snapshot: PROFILE },
    );

    expect(result.financialProfile).toBe(PROFILE);
  });

  it("clears the shared profile without inventing a replacement state", () => {
    const result = financialSessionReducer(
      { financialProfile: PROFILE },
      { type: "clear-financial-profile" },
    );

    expect(result).toEqual({ financialProfile: null });
  });
});
