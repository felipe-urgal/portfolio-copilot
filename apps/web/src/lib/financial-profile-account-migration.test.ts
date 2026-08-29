import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import {
  canonicalFinancialProfileSnapshot,
  compareFinancialProfiles,
  planFinancialProfileMigration,
} from "./financial-profile-account-migration";

const LOCAL_PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "3000000" },
  goals: [
    {
      id: "7744df4d-bb41-4a07-b582-a8d8f710a8af",
      type: "DATED_PURPOSE",
      targetAmount: { currency: "BRL", minorUnits: "5000000" },
      targetDate: "2030-12-31",
    },
    {
      id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
      type: "NET_WORTH",
      targetAmount: { currency: "BRL", minorUnits: "100000000" },
      targetDate: null,
    },
  ],
};

const CANONICAL_LOCAL_PROFILE = canonicalFinancialProfileSnapshot(LOCAL_PROFILE);

describe("financial profile account migration", () => {
  it("compares canonical snapshots instead of incoming goal order", () => {
    const reordered: FinancialProfileSnapshot = {
      ...CANONICAL_LOCAL_PROFILE,
      goals: [...CANONICAL_LOCAL_PROFILE.goals].reverse(),
    };

    expect(compareFinancialProfiles(reordered, CANONICAL_LOCAL_PROFILE)).toEqual({
      relation: "aligned",
      differences: [],
    });
  });

  it("keeps local-only and account-only states explicit", () => {
    expect(compareFinancialProfiles(CANONICAL_LOCAL_PROFILE, null)).toEqual({
      relation: "local-only",
      differences: [],
    });
    expect(compareFinancialProfiles(null, CANONICAL_LOCAL_PROFILE)).toEqual({
      relation: "account-only",
      differences: [],
    });
  });

  it("reports deterministic conflict fields without exposing values", () => {
    const accountProfile: FinancialProfileSnapshot = {
      ...CANONICAL_LOCAL_PROFILE,
      id: "a49503f0-27d2-4f4d-8248-2c48d95765e0",
      referenceCurrency: "USD",
      riskTolerance: "HIGH",
      emergencyReserveTarget: null,
      goals: [],
    };

    expect(compareFinancialProfiles(CANONICAL_LOCAL_PROFILE, accountProfile)).toEqual({
      relation: "conflict",
      differences: [
        "profileIdentity",
        "referenceCurrency",
        "riskTolerance",
        "emergencyReserveTarget",
        "goals",
      ],
    });
  });

  it("creates when the account has no profile and is idempotent when already aligned", () => {
    expect(planFinancialProfileMigration(CANONICAL_LOCAL_PROFILE, null).outcome).toBe("create");
    expect(
      planFinancialProfileMigration(CANONICAL_LOCAL_PROFILE, CANONICAL_LOCAL_PROFILE).outcome,
    ).toBe("unchanged");
  });

  it("blocks conflicting replacement unless it is explicitly requested", () => {
    const accountProfile: FinancialProfileSnapshot = {
      ...CANONICAL_LOCAL_PROFILE,
      riskTolerance: "HIGH",
    };

    expect(planFinancialProfileMigration(CANONICAL_LOCAL_PROFILE, accountProfile).outcome).toBe(
      "conflict",
    );
    expect(
      planFinancialProfileMigration(CANONICAL_LOCAL_PROFILE, accountProfile, true).outcome,
    ).toBe("replace");
  });
});
