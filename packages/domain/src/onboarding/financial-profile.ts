import { CurrencyCode, CurrencyMismatchError, Money, type MoneySnapshot } from "../financial";
import {
  DuplicateFinancialGoalError,
  InvalidEmergencyReserveTargetError,
  InvalidFinancialGoalError,
} from "./errors";
import { FinancialGoal, type FinancialGoalSnapshot } from "./financial-goal";
import { FinancialHorizon, type FinancialHorizonCode } from "./financial-horizon";
import { FinancialProfileId } from "./financial-profile-id";
import { RiskTolerance, type RiskToleranceCode } from "./risk-tolerance";

export type FinancialProfileCreationInput = Readonly<{
  id: FinancialProfileId | string;
  referenceCurrency: CurrencyCode | string;
  riskTolerance: RiskTolerance | string;
  horizon: FinancialHorizon | string;
  emergencyReserveTarget?: Money | null;
  goals: readonly FinancialGoal[];
}>;

export type FinancialProfileSnapshot = Readonly<{
  id: string;
  referenceCurrency: string;
  riskTolerance: RiskToleranceCode;
  horizon: FinancialHorizonCode;
  emergencyReserveTarget: MoneySnapshot | null;
  goals: readonly FinancialGoalSnapshot[];
}>;

function toFinancialProfileId(value: FinancialProfileId | string): FinancialProfileId {
  return value instanceof FinancialProfileId ? value : FinancialProfileId.from(String(value));
}

function toCurrencyCode(value: CurrencyCode | string): CurrencyCode {
  return value instanceof CurrencyCode ? value : CurrencyCode.from(String(value));
}

function toRiskTolerance(value: RiskTolerance | string): RiskTolerance {
  return value instanceof RiskTolerance ? value : RiskTolerance.from(String(value));
}

function toFinancialHorizon(value: FinancialHorizon | string): FinancialHorizon {
  return value instanceof FinancialHorizon ? value : FinancialHorizon.from(String(value));
}

function assertCurrency(referenceCurrency: CurrencyCode, money: Money): void {
  if (!referenceCurrency.equals(money.currency)) {
    throw new CurrencyMismatchError(referenceCurrency.code, money.currency.code);
  }
}

function normalizeEmergencyReserveTarget(
  value: Money | null | undefined,
  referenceCurrency: CurrencyCode,
): Money | null {
  if (value === null || value === undefined) return null;

  if (!(value instanceof Money) || value.isNegative() || value.isZero()) {
    throw new InvalidEmergencyReserveTargetError(String(value));
  }

  assertCurrency(referenceCurrency, value);
  return value;
}

function normalizeGoals(
  goals: readonly FinancialGoal[],
  referenceCurrency: CurrencyCode,
): readonly FinancialGoal[] {
  if (!Array.isArray(goals)) {
    throw new InvalidFinancialGoalError(String(goals));
  }

  const goalIds = new Set<string>();
  const normalized = goals.map((goal) => {
    if (!(goal instanceof FinancialGoal)) {
      throw new InvalidFinancialGoalError(String(goal));
    }

    const goalId = goal.id.toString();

    if (goalIds.has(goalId)) {
      throw new DuplicateFinancialGoalError(goalId);
    }

    assertCurrency(referenceCurrency, goal.targetAmount);
    goalIds.add(goalId);
    return goal;
  });

  normalized.sort((left, right) => left.id.toString().localeCompare(right.id.toString()));
  return Object.freeze(normalized);
}

export class FinancialProfile {
  private constructor(
    public readonly id: FinancialProfileId,
    public readonly referenceCurrency: CurrencyCode,
    public readonly riskTolerance: RiskTolerance,
    public readonly horizon: FinancialHorizon,
    public readonly emergencyReserveTarget: Money | null,
    public readonly goals: readonly FinancialGoal[],
  ) {}

  public static create(input: FinancialProfileCreationInput): FinancialProfile {
    const referenceCurrency = toCurrencyCode(input.referenceCurrency);

    return new FinancialProfile(
      toFinancialProfileId(input.id),
      referenceCurrency,
      toRiskTolerance(input.riskTolerance),
      toFinancialHorizon(input.horizon),
      normalizeEmergencyReserveTarget(input.emergencyReserveTarget, referenceCurrency),
      normalizeGoals(input.goals, referenceCurrency),
    );
  }

  public static fromSnapshot(snapshot: FinancialProfileSnapshot): FinancialProfile {
    return FinancialProfile.create({
      id: snapshot.id,
      referenceCurrency: snapshot.referenceCurrency,
      riskTolerance: snapshot.riskTolerance,
      horizon: snapshot.horizon,
      emergencyReserveTarget:
        snapshot.emergencyReserveTarget === null
          ? null
          : Money.fromSnapshot(snapshot.emergencyReserveTarget),
      goals: snapshot.goals.map((goal) => FinancialGoal.fromSnapshot(goal)),
    });
  }

  public sameIdentityAs(other: FinancialProfile): boolean {
    return this.id.equals(other.id);
  }

  public toSnapshot(): FinancialProfileSnapshot {
    return {
      id: this.id.toString(),
      referenceCurrency: this.referenceCurrency.code,
      riskTolerance: this.riskTolerance.code,
      horizon: this.horizon.code,
      emergencyReserveTarget: this.emergencyReserveTarget?.toSnapshot() ?? null,
      goals: this.goals.map((goal) => goal.toSnapshot()),
    };
  }
}
