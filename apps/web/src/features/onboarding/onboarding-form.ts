import {
  CurrencyCode,
  FinancialGoal,
  FinancialGoalType,
  FinancialHorizon,
  FinancialProfile,
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidEmergencyReserveTargetError,
  InvalidFinancialGoalTargetAmountError,
  InvalidFinancialGoalTargetDateError,
  InvalidFinancialGoalTypeError,
  InvalidFinancialHorizonError,
  InvalidRiskToleranceError,
  Money,
  RiskTolerance,
  type FinancialGoalTypeCode,
  type FinancialHorizonCode,
  type FinancialProfileSnapshot,
  type RiskToleranceCode,
} from "@portfolio-copilot/domain";

export const ONBOARDING_STEPS = ["profile", "reserve", "goals", "review"] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type GoalDraft = Readonly<{
  clientId: string;
  type: FinancialGoalTypeCode | "";
  targetAmount: string;
  targetDate: string;
}>;

export type OnboardingDraft = Readonly<{
  referenceCurrency: string;
  riskTolerance: RiskToleranceCode | "";
  horizon: FinancialHorizonCode | "";
  reserveEnabled: boolean;
  reserveTarget: string;
  goals: readonly GoalDraft[];
}>;

export type FieldErrors = Readonly<Record<string, string>>;

export type OnboardingState = Readonly<{
  step: OnboardingStep;
  draft: OnboardingDraft;
  errors: FieldErrors;
  snapshot: FinancialProfileSnapshot | null;
}>;

export type OnboardingAction =
  | Readonly<{
      type: "update-profile";
      field: "referenceCurrency" | "riskTolerance" | "horizon";
      value: string;
    }>
  | Readonly<{ type: "toggle-reserve"; enabled: boolean }>
  | Readonly<{ type: "update-reserve"; value: string }>
  | Readonly<{ type: "add-goal"; clientId: string }>
  | Readonly<{ type: "remove-goal"; clientId: string }>
  | Readonly<{
      type: "update-goal";
      clientId: string;
      patch: Partial<Omit<GoalDraft, "clientId">>;
    }>
  | Readonly<{ type: "go-to-step"; step: OnboardingStep }>
  | Readonly<{ type: "validation-failed"; errors: FieldErrors }>
  | Readonly<{ type: "review-ready"; snapshot: FinancialProfileSnapshot }>
  | Readonly<{ type: "reset" }>;

export type IdFactory = () => string;

export type StepValidationResult =
  | Readonly<{ ok: true; snapshot: FinancialProfileSnapshot | null }>
  | Readonly<{ ok: false; errors: FieldErrors }>;

const PROFILE_CURRENCY_ERROR = "Informe um código de moeda válido com 3 letras, como BRL.";
const PROFILE_RISK_ERROR = "Selecione sua tolerância a risco.";
const PROFILE_HORIZON_ERROR = "Selecione seu horizonte financeiro.";
const RESERVE_TARGET_ERROR = "Informe uma meta de reserva positiva, como 10000,00.";
const GOAL_TYPE_ERROR = "Selecione o tipo do objetivo.";
const GOAL_AMOUNT_ERROR = "Informe um valor-alvo positivo, como 50000,00.";
const GOAL_DATE_ERROR = "Informe uma data-alvo válida no formato indicado.";

function createGoalDraft(clientId: string): GoalDraft {
  return {
    clientId,
    type: "",
    targetAmount: "",
    targetDate: "",
  };
}

export function createInitialOnboardingState(): OnboardingState {
  return {
    step: "profile",
    draft: {
      referenceCurrency: "BRL",
      riskTolerance: "",
      horizon: "",
      reserveEnabled: false,
      reserveTarget: "",
      goals: [],
    },
    errors: {},
    snapshot: null,
  };
}

function withChangedDraft(state: OnboardingState, draft: OnboardingDraft): OnboardingState {
  return {
    ...state,
    draft,
    errors: {},
    snapshot: null,
  };
}

export function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction,
): OnboardingState {
  switch (action.type) {
    case "update-profile":
      return withChangedDraft(state, {
        ...state.draft,
        [action.field]: action.value,
      } as OnboardingDraft);
    case "toggle-reserve":
      return withChangedDraft(state, {
        ...state.draft,
        reserveEnabled: action.enabled,
        reserveTarget: action.enabled ? state.draft.reserveTarget : "",
      });
    case "update-reserve":
      return withChangedDraft(state, {
        ...state.draft,
        reserveTarget: action.value,
      });
    case "add-goal":
      return withChangedDraft(state, {
        ...state.draft,
        goals: [...state.draft.goals, createGoalDraft(action.clientId)],
      });
    case "remove-goal":
      return withChangedDraft(state, {
        ...state.draft,
        goals: state.draft.goals.filter((goal) => goal.clientId !== action.clientId),
      });
    case "update-goal":
      return withChangedDraft(state, {
        ...state.draft,
        goals: state.draft.goals.map((goal) =>
          goal.clientId === action.clientId ? { ...goal, ...action.patch } : goal,
        ),
      });
    case "go-to-step":
      return {
        ...state,
        step: action.step,
        errors: {},
      };
    case "validation-failed":
      return {
        ...state,
        errors: action.errors,
      };
    case "review-ready":
      return {
        ...state,
        step: "review",
        errors: {},
        snapshot: action.snapshot,
      };
    case "reset":
      return createInitialOnboardingState();
  }
}

export function normalizeUiDecimal(value: string): string {
  const normalized = value.trim();
  const commaIndex = normalized.indexOf(",");

  if (commaIndex === -1 || normalized.includes(".")) {
    return normalized;
  }

  return `${normalized.slice(0, commaIndex)}.${normalized.slice(commaIndex + 1)}`;
}

function validateProfileFields(draft: OnboardingDraft): Record<string, string> {
  const errors: Record<string, string> = {};

  try {
    CurrencyCode.from(draft.referenceCurrency);
  } catch (error) {
    if (error instanceof InvalidCurrencyCodeError) {
      errors["profile.referenceCurrency"] = PROFILE_CURRENCY_ERROR;
    } else {
      throw error;
    }
  }

  try {
    RiskTolerance.from(draft.riskTolerance);
  } catch (error) {
    if (error instanceof InvalidRiskToleranceError) {
      errors["profile.riskTolerance"] = PROFILE_RISK_ERROR;
    } else {
      throw error;
    }
  }

  try {
    FinancialHorizon.from(draft.horizon);
  } catch (error) {
    if (error instanceof InvalidFinancialHorizonError) {
      errors["profile.horizon"] = PROFILE_HORIZON_ERROR;
    } else {
      throw error;
    }
  }

  return errors;
}

function buildReserveTarget(
  draft: OnboardingDraft,
  idFactory: IdFactory,
): { target: Money | null; errors: Record<string, string> } {
  if (!draft.reserveEnabled) {
    return { target: null, errors: {} };
  }

  let target: Money;

  try {
    target = Money.fromDecimal(normalizeUiDecimal(draft.reserveTarget), draft.referenceCurrency);
  } catch (error) {
    if (error instanceof InvalidDecimalError || error instanceof InvalidCurrencyCodeError) {
      return {
        target: null,
        errors: { "reserve.target": RESERVE_TARGET_ERROR },
      };
    }

    throw error;
  }

  try {
    FinancialProfile.create({
      id: idFactory(),
      referenceCurrency: draft.referenceCurrency,
      riskTolerance: draft.riskTolerance,
      horizon: draft.horizon,
      emergencyReserveTarget: target,
      goals: [],
    });
  } catch (error) {
    if (error instanceof InvalidEmergencyReserveTargetError) {
      return {
        target: null,
        errors: { "reserve.target": RESERVE_TARGET_ERROR },
      };
    }

    throw error;
  }

  return { target, errors: {} };
}

function buildGoals(
  draft: OnboardingDraft,
  idFactory: IdFactory,
): { goals: FinancialGoal[]; errors: Record<string, string> } {
  const goals: FinancialGoal[] = [];
  const errors: Record<string, string> = {};

  for (const draftGoal of draft.goals) {
    const prefix = `goals.${draftGoal.clientId}`;
    let type: FinancialGoalType | null = null;
    let targetAmount: Money | null = null;

    try {
      type = FinancialGoalType.from(draftGoal.type);
    } catch (error) {
      if (error instanceof InvalidFinancialGoalTypeError) {
        errors[`${prefix}.type`] = GOAL_TYPE_ERROR;
      } else {
        throw error;
      }
    }

    try {
      targetAmount = Money.fromDecimal(
        normalizeUiDecimal(draftGoal.targetAmount),
        draft.referenceCurrency,
      );
    } catch (error) {
      if (error instanceof InvalidDecimalError || error instanceof InvalidCurrencyCodeError) {
        errors[`${prefix}.targetAmount`] = GOAL_AMOUNT_ERROR;
      } else {
        throw error;
      }
    }

    if (type === null || targetAmount === null) {
      continue;
    }

    const targetDate = draftGoal.targetDate.trim();
    const baseInput = {
      id: idFactory(),
      type,
      targetAmount,
    } as const;

    try {
      goals.push(
        FinancialGoal.create(targetDate.length === 0 ? baseInput : { ...baseInput, targetDate }),
      );
    } catch (error) {
      if (error instanceof InvalidFinancialGoalTargetAmountError) {
        errors[`${prefix}.targetAmount`] = GOAL_AMOUNT_ERROR;
      } else if (error instanceof InvalidFinancialGoalTargetDateError) {
        errors[`${prefix}.targetDate`] = GOAL_DATE_ERROR;
      } else {
        throw error;
      }
    }
  }

  return { goals, errors };
}

export function validateOnboardingStep(
  step: Exclude<OnboardingStep, "review">,
  draft: OnboardingDraft,
  idFactory: IdFactory,
): StepValidationResult {
  const profileErrors = validateProfileFields(draft);

  if (Object.keys(profileErrors).length > 0) {
    return { ok: false, errors: profileErrors };
  }

  if (step === "profile") {
    return { ok: true, snapshot: null };
  }

  const reserve = buildReserveTarget(draft, idFactory);

  if (Object.keys(reserve.errors).length > 0) {
    return { ok: false, errors: reserve.errors };
  }

  if (step === "reserve") {
    return { ok: true, snapshot: null };
  }

  const goalResult = buildGoals(draft, idFactory);

  if (Object.keys(goalResult.errors).length > 0) {
    return { ok: false, errors: goalResult.errors };
  }

  const profile = FinancialProfile.create({
    id: idFactory(),
    referenceCurrency: draft.referenceCurrency,
    riskTolerance: draft.riskTolerance,
    horizon: draft.horizon,
    emergencyReserveTarget: reserve.target,
    goals: goalResult.goals,
  });

  return {
    ok: true,
    snapshot: profile.toSnapshot(),
  };
}
