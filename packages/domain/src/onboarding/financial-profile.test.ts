import { describe, expect, it } from "vitest";

import { CurrencyMismatchError, Money } from "../financial";
import {
  DuplicateFinancialGoalError,
  FinancialGoal,
  FinancialGoalId,
  FinancialGoalType,
  FinancialHorizon,
  FinancialProfile,
  FinancialProfileId,
  InvalidEmergencyReserveTargetError,
  InvalidFinancialGoalTargetAmountError,
  InvalidFinancialGoalTargetDateError,
  InvalidFinancialGoalTypeError,
  InvalidFinancialHorizonError,
  InvalidFinancialProfileIdError,
  InvalidRiskToleranceError,
  RiskTolerance,
} from "./index";

const PROFILE_ID = "550e8400-e29b-41d4-a716-446655440070";
const GOAL_ID_A = "550e8400-e29b-41d4-a716-446655440071";
const GOAL_ID_B = "550e8400-e29b-41d4-a716-446655440072";

function goal(
  id: string,
  type: "NET_WORTH" | "PASSIVE_INCOME_MONTHLY" | "RETIREMENT" | "DATED_PURPOSE",
  amount: string,
  targetDate?: string | null,
): FinancialGoal {
  return FinancialGoal.create({
    id,
    type,
    targetAmount: Money.fromDecimal(amount, "BRL"),
    ...(targetDate === undefined ? {} : { targetDate }),
  });
}

describe("financial onboarding", () => {
  it.each(["SHORT", "MEDIUM", "LONG"] as const)("supports %s financial horizon", (horizon) => {
    expect(FinancialHorizon.from(horizon).toString()).toBe(horizon);
  });

  it.each(["LOW", "MEDIUM", "HIGH"] as const)("supports %s risk tolerance", (riskTolerance) => {
    expect(RiskTolerance.from(riskTolerance).toString()).toBe(riskTolerance);
  });

  it("rejects unknown horizon and risk tolerance with typed errors", () => {
    expect(() => FinancialHorizon.from("UNKNOWN")).toThrow(InvalidFinancialHorizonError);
    expect(() => RiskTolerance.from("UNKNOWN")).toThrow(InvalidRiskToleranceError);
  });

  it("validates profile and goal identities as canonical UUIDs", () => {
    expect(FinancialProfileId.from(PROFILE_ID.toUpperCase()).toString()).toBe(PROFILE_ID);
    expect(FinancialGoalId.from(GOAL_ID_A.toUpperCase()).toString()).toBe(GOAL_ID_A);
    expect(() => FinancialProfileId.from("profile-1")).toThrow(InvalidFinancialProfileIdError);
  });

  it("represents a positive emergency reserve target without storing its current balance", () => {
    const profile = FinancialProfile.create({
      id: PROFILE_ID,
      referenceCurrency: "BRL",
      riskTolerance: "MEDIUM",
      horizon: "LONG",
      emergencyReserveTarget: Money.fromDecimal("30000.00", "BRL"),
      goals: [],
    });

    expect(profile.emergencyReserveTarget?.toDecimalString()).toBe("30000.00");
    expect(profile.toSnapshot().emergencyReserveTarget).toEqual({
      currency: "BRL",
      minorUnits: "3000000",
    });
  });

  it("allows the reserve target to remain explicitly unconfigured", () => {
    const profile = FinancialProfile.create({
      id: PROFILE_ID,
      referenceCurrency: "BRL",
      riskTolerance: "LOW",
      horizon: "SHORT",
      emergencyReserveTarget: null,
      goals: [],
    });

    expect(profile.emergencyReserveTarget).toBeNull();
    expect(profile.toSnapshot().emergencyReserveTarget).toBeNull();
  });

  it("rejects zero, negative and malformed reserve targets", () => {
    const base = {
      id: PROFILE_ID,
      referenceCurrency: "BRL",
      riskTolerance: "MEDIUM",
      horizon: "MEDIUM",
      goals: [],
    } as const;

    expect(() =>
      FinancialProfile.create({ ...base, emergencyReserveTarget: Money.zero("BRL") }),
    ).toThrow(InvalidEmergencyReserveTargetError);
    expect(() =>
      FinancialProfile.create({
        ...base,
        emergencyReserveTarget: Money.fromDecimal("-0.01", "BRL"),
      }),
    ).toThrow(InvalidEmergencyReserveTargetError);
    expect(() =>
      FinancialProfile.create({ ...base, emergencyReserveTarget: {} as Money }),
    ).toThrow(InvalidEmergencyReserveTargetError);
  });

  it("rejects a reserve target in a different currency", () => {
    expect(() =>
      FinancialProfile.create({
        id: PROFILE_ID,
        referenceCurrency: "BRL",
        riskTolerance: "MEDIUM",
        horizon: "LONG",
        emergencyReserveTarget: Money.fromDecimal("1000.00", "USD"),
        goals: [],
      }),
    ).toThrow(CurrencyMismatchError);
  });

  it("supports goals with and without target dates and requires one for dated purpose", () => {
    const netWorth = goal(GOAL_ID_A, "NET_WORTH", "1000000.00", "2040-12-31");
    const retirement = goal(GOAL_ID_B, "RETIREMENT", "2000000.00");
    const datedPurpose = FinancialGoal.create({
      id: "550e8400-e29b-41d4-a716-446655440073",
      type: "DATED_PURPOSE",
      targetAmount: Money.fromDecimal("80000.00", "BRL"),
      targetDate: "2030-06-30",
    });

    expect(netWorth.targetDate).toBe("2040-12-31");
    expect(retirement.targetDate).toBeNull();
    expect(datedPurpose.targetDate).toBe("2030-06-30");
  });

  it("keeps passive-income cadence explicit in the goal taxonomy", () => {
    expect(FinancialGoalType.from("PASSIVE_INCOME_MONTHLY").toString()).toBe(
      "PASSIVE_INCOME_MONTHLY",
    );
  });

  it("rejects invalid goal types, non-positive amounts and invalid target-date semantics", () => {
    expect(() => FinancialGoalType.from("PASSIVE_INCOME")).toThrow(InvalidFinancialGoalTypeError);
    expect(() =>
      FinancialGoal.create({
        id: GOAL_ID_A,
        type: "NET_WORTH",
        targetAmount: Money.zero("BRL"),
      }),
    ).toThrow(InvalidFinancialGoalTargetAmountError);
    expect(() =>
      FinancialGoal.create({
        id: GOAL_ID_A,
        type: "NET_WORTH",
        targetAmount: {} as Money,
      }),
    ).toThrow(InvalidFinancialGoalTargetAmountError);
    expect(() =>
      FinancialGoal.create({
        id: GOAL_ID_A,
        type: "DATED_PURPOSE",
        targetAmount: Money.fromDecimal("1.00", "BRL"),
      }),
    ).toThrow(InvalidFinancialGoalTargetDateError);
    expect(() =>
      FinancialGoal.create({
        id: GOAL_ID_A,
        type: "RETIREMENT",
        targetAmount: Money.fromDecimal("1.00", "BRL"),
        targetDate: "2030-02-30",
      }),
    ).toThrow(InvalidFinancialGoalTargetDateError);
  });

  it("rejects goal currency mismatch and duplicate normalized goal identities", () => {
    const usdGoal = FinancialGoal.create({
      id: GOAL_ID_A,
      type: "NET_WORTH",
      targetAmount: Money.fromDecimal("100.00", "USD"),
    });

    expect(() =>
      FinancialProfile.create({
        id: PROFILE_ID,
        referenceCurrency: "BRL",
        riskTolerance: "MEDIUM",
        horizon: "LONG",
        goals: [usdGoal],
      }),
    ).toThrow(CurrencyMismatchError);

    expect(() =>
      FinancialProfile.create({
        id: PROFILE_ID,
        referenceCurrency: "BRL",
        riskTolerance: "MEDIUM",
        horizon: "LONG",
        goals: [
          goal(GOAL_ID_A, "NET_WORTH", "100.00"),
          goal(GOAL_ID_A, "RETIREMENT", "200.00"),
        ],
      }),
    ).toThrow(DuplicateFinancialGoalError);
  });

  it("serializes deterministically and round-trips without bigint or domain classes", () => {
    const profile = FinancialProfile.create({
      id: PROFILE_ID,
      referenceCurrency: "BRL",
      riskTolerance: "HIGH",
      horizon: "LONG",
      emergencyReserveTarget: Money.fromDecimal("25000.00", "BRL"),
      goals: [
        goal(GOAL_ID_B, "RETIREMENT", "2000000.00", "2045-12-31"),
        goal(GOAL_ID_A, "NET_WORTH", "1000000.00"),
      ],
    });

    const snapshot = profile.toSnapshot();
    const hydrated = FinancialProfile.fromSnapshot(snapshot);

    expect(snapshot.goals.map((item) => item.id)).toEqual([GOAL_ID_A, GOAL_ID_B]);
    expect(hydrated.toSnapshot()).toEqual(snapshot);
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot);
    expect(JSON.stringify(hydrated.toSnapshot())).toBe(JSON.stringify(snapshot));
  });

  it("copies and orders the goals array instead of sharing caller mutation", () => {
    const goals = [
      goal(GOAL_ID_B, "RETIREMENT", "200.00"),
      goal(GOAL_ID_A, "NET_WORTH", "100.00"),
    ];
    const profile = FinancialProfile.create({
      id: PROFILE_ID,
      referenceCurrency: "BRL",
      riskTolerance: "MEDIUM",
      horizon: "MEDIUM",
      goals,
    });

    goals.push(
      goal(
        "550e8400-e29b-41d4-a716-446655440073",
        "DATED_PURPOSE",
        "300.00",
        "2030-01-01",
      ),
    );

    expect(profile.goals).toHaveLength(2);
    expect(profile.goals.map((item) => item.id.toString())).toEqual([GOAL_ID_A, GOAL_ID_B]);
    expect(Object.isFrozen(profile.goals)).toBe(true);
  });

  it("keeps distinct profiles independent even with equivalent configuration", () => {
    const input = {
      referenceCurrency: "BRL",
      riskTolerance: "MEDIUM",
      horizon: "LONG",
      goals: [goal(GOAL_ID_A, "NET_WORTH", "1000000.00")],
    } as const;
    const left = FinancialProfile.create({ ...input, id: PROFILE_ID });
    const right = FinancialProfile.create({
      ...input,
      id: "550e8400-e29b-41d4-a716-446655440074",
    });

    expect(left.sameIdentityAs(right)).toBe(false);
    expect(left.toSnapshot().goals).toEqual(right.toSnapshot().goals);
  });
});
