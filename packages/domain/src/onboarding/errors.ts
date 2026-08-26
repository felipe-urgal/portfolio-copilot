export type OnboardingDomainErrorCode =
  | "INVALID_FINANCIAL_PROFILE_ID"
  | "INVALID_RISK_TOLERANCE"
  | "INVALID_FINANCIAL_HORIZON"
  | "INVALID_EMERGENCY_RESERVE_TARGET"
  | "INVALID_FINANCIAL_GOAL_ID"
  | "INVALID_FINANCIAL_GOAL_TYPE"
  | "INVALID_FINANCIAL_GOAL"
  | "INVALID_FINANCIAL_GOAL_TARGET_AMOUNT"
  | "INVALID_FINANCIAL_GOAL_TARGET_DATE"
  | "DUPLICATE_FINANCIAL_GOAL";

export class OnboardingDomainError extends Error {
  public constructor(
    public readonly code: OnboardingDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidFinancialProfileIdError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_FINANCIAL_PROFILE_ID", `Invalid financial profile id: ${JSON.stringify(value)}`);
  }
}

export class InvalidRiskToleranceError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_RISK_TOLERANCE", `Invalid risk tolerance: ${JSON.stringify(value)}`);
  }
}

export class InvalidFinancialHorizonError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_FINANCIAL_HORIZON", `Invalid financial horizon: ${JSON.stringify(value)}`);
  }
}

export class InvalidEmergencyReserveTargetError extends OnboardingDomainError {
  public constructor(value: string) {
    super(
      "INVALID_EMERGENCY_RESERVE_TARGET",
      `Emergency reserve target must be a positive Money value: ${JSON.stringify(value)}`,
    );
  }
}

export class InvalidFinancialGoalIdError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_FINANCIAL_GOAL_ID", `Invalid financial goal id: ${JSON.stringify(value)}`);
  }
}

export class InvalidFinancialGoalTypeError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_FINANCIAL_GOAL_TYPE", `Invalid financial goal type: ${JSON.stringify(value)}`);
  }
}

export class InvalidFinancialGoalError extends OnboardingDomainError {
  public constructor(value: string) {
    super("INVALID_FINANCIAL_GOAL", `Invalid financial goal: ${JSON.stringify(value)}`);
  }
}

export class InvalidFinancialGoalTargetAmountError extends OnboardingDomainError {
  public constructor(value: string) {
    super(
      "INVALID_FINANCIAL_GOAL_TARGET_AMOUNT",
      `Financial goal target amount must be a positive Money value: ${JSON.stringify(value)}`,
    );
  }
}

export class InvalidFinancialGoalTargetDateError extends OnboardingDomainError {
  public constructor(
    public readonly goalType: string,
    value: string | null,
  ) {
    super(
      "INVALID_FINANCIAL_GOAL_TARGET_DATE",
      `Invalid target date for financial goal ${goalType}: ${JSON.stringify(value)}`,
    );
  }
}

export class DuplicateFinancialGoalError extends OnboardingDomainError {
  public constructor(public readonly goalId: string) {
    super("DUPLICATE_FINANCIAL_GOAL", `Duplicate financial goal id: ${goalId}`);
  }
}
