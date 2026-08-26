import { describe, expect, it } from "vitest";

import {
  createInitialOnboardingState,
  normalizeUiDecimal,
  onboardingReducer,
  validateOnboardingStep,
  type IdFactory,
  type OnboardingDraft,
} from "./onboarding-form";

function deterministicIds(): IdFactory {
  let sequence = 0;

  return () => {
    sequence += 1;
    return `00000000-0000-4000-8000-${sequence.toString().padStart(12, "0")}`;
  };
}

function validDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    referenceCurrency: "BRL",
    riskTolerance: "MEDIUM",
    horizon: "LONG",
    reserveEnabled: true,
    reserveTarget: "10000,50",
    goals: [
      {
        clientId: "goal-1",
        type: "NET_WORTH",
        targetAmount: "1000000,00",
        targetDate: "2040-12-31",
      },
    ],
    ...overrides,
  };
}

describe("financial onboarding form model", () => {
  it("normalizes Brazilian decimal comma without converting money to number", () => {
    expect(normalizeUiDecimal(" 1000,50 ")).toBe("1000.50");
    expect(normalizeUiDecimal("1000.50")).toBe("1000.50");
    expect(normalizeUiDecimal("1.000,50")).toBe("1.000,50");
  });

  it("adds, edits and removes goals through the reducer", () => {
    const initial = createInitialOnboardingState();
    const added = onboardingReducer(initial, { type: "add-goal", clientId: "goal-2" });
    const edited = onboardingReducer(added, {
      type: "update-goal",
      clientId: "goal-2",
      patch: { type: "RETIREMENT", targetAmount: "2000000,00" },
    });
    const removed = onboardingReducer(edited, { type: "remove-goal", clientId: "goal-1" });

    expect(added.draft.goals).toHaveLength(2);
    expect(edited.draft.goals[1]).toMatchObject({
      clientId: "goal-2",
      type: "RETIREMENT",
      targetAmount: "2000000,00",
    });
    expect(removed.draft.goals.map((goal) => goal.clientId)).toEqual(["goal-2"]);
  });

  it("maps profile domain errors to the corresponding fields", () => {
    const result = validateOnboardingStep(
      "profile",
      validDraft({ referenceCurrency: "R$", riskTolerance: "", horizon: "" }),
      deterministicIds(),
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        "profile.referenceCurrency": "Informe um código de moeda válido com 3 letras, como BRL.",
        "profile.riskTolerance": "Selecione sua tolerância a risco.",
        "profile.horizon": "Selecione seu horizonte financeiro.",
      },
    });
  });

  it("accepts a valid profile step without creating a review snapshot early", () => {
    const result = validateOnboardingStep("profile", validDraft(), deterministicIds());

    expect(result).toEqual({ ok: true, snapshot: null });
  });

  it("maps malformed and non-positive reserve values to the reserve field", () => {
    const malformed = validateOnboardingStep(
      "reserve",
      validDraft({ reserveTarget: "dez mil" }),
      deterministicIds(),
    );
    const zero = validateOnboardingStep(
      "reserve",
      validDraft({ reserveTarget: "0,00" }),
      deterministicIds(),
    );

    expect(malformed).toMatchObject({
      ok: false,
      errors: { "reserve.target": expect.any(String) },
    });
    expect(zero).toMatchObject({
      ok: false,
      errors: { "reserve.target": expect.any(String) },
    });
  });

  it("allows the reserve target to remain pending", () => {
    const result = validateOnboardingStep(
      "reserve",
      validDraft({ reserveEnabled: false, reserveTarget: "" }),
      deterministicIds(),
    );

    expect(result).toEqual({ ok: true, snapshot: null });
  });

  it("reports missing and invalid dates for a dated-purpose goal", () => {
    const missingDate = validateOnboardingStep(
      "goals",
      validDraft({
        goals: [
          {
            clientId: "goal-trip",
            type: "DATED_PURPOSE",
            targetAmount: "50000,00",
            targetDate: "",
          },
        ],
      }),
      deterministicIds(),
    );
    const invalidDate = validateOnboardingStep(
      "goals",
      validDraft({
        goals: [
          {
            clientId: "goal-trip",
            type: "DATED_PURPOSE",
            targetAmount: "50000,00",
            targetDate: "2030-02-30",
          },
        ],
      }),
      deterministicIds(),
    );

    expect(missingDate).toMatchObject({
      ok: false,
      errors: { "goals.goal-trip.targetDate": expect.any(String) },
    });
    expect(invalidDate).toMatchObject({
      ok: false,
      errors: { "goals.goal-trip.targetDate": expect.any(String) },
    });
  });

  it("maps an invalid monetary target to the exact goal", () => {
    const result = validateOnboardingStep(
      "goals",
      validDraft({
        goals: [
          {
            clientId: "goal-a",
            type: "NET_WORTH",
            targetAmount: "abc",
            targetDate: "",
          },
          {
            clientId: "goal-b",
            type: "RETIREMENT",
            targetAmount: "2000000,00",
            targetDate: "2050-01-01",
          },
        ],
      }),
      deterministicIds(),
    );

    expect(result).toMatchObject({
      ok: false,
      errors: { "goals.goal-a.targetAmount": expect.any(String) },
    });
  });

  it("builds a domain-validated review snapshot for a complete flow", () => {
    const result = validateOnboardingStep("goals", validDraft(), deterministicIds());

    expect(result.ok).toBe(true);

    if (!result.ok || result.snapshot === null) {
      throw new Error("expected a financial profile snapshot");
    }

    expect(result.snapshot).toMatchObject({
      referenceCurrency: "BRL",
      riskTolerance: "MEDIUM",
      horizon: "LONG",
      emergencyReserveTarget: {
        currency: "BRL",
        minorUnits: "1000050",
      },
      goals: [
        {
          type: "NET_WORTH",
          targetAmount: {
            currency: "BRL",
            minorUnits: "100000000",
          },
          targetDate: "2040-12-31",
        },
      ],
    });
    expect(JSON.parse(JSON.stringify(result.snapshot))).toEqual(result.snapshot);
  });

  it("allows a valid review snapshot with no goals", () => {
    const result = validateOnboardingStep(
      "goals",
      validDraft({ goals: [], reserveEnabled: false }),
      deterministicIds(),
    );

    expect(result.ok).toBe(true);

    if (result.ok && result.snapshot !== null) {
      expect(result.snapshot.goals).toEqual([]);
      expect(result.snapshot.emergencyReserveTarget).toBeNull();
    }
  });

  it("moves to review and clears stale errors when the reducer receives a validated snapshot", () => {
    const validation = validateOnboardingStep("goals", validDraft(), deterministicIds());

    if (!validation.ok || validation.snapshot === null) {
      throw new Error("expected a valid snapshot");
    }

    const withErrors = onboardingReducer(createInitialOnboardingState(), {
      type: "validation-failed",
      errors: { "profile.horizon": "error" },
    });
    const reviewed = onboardingReducer(withErrors, {
      type: "review-ready",
      snapshot: validation.snapshot,
    });

    expect(reviewed.step).toBe("review");
    expect(reviewed.errors).toEqual({});
    expect(reviewed.snapshot).toEqual(validation.snapshot);
  });
});
