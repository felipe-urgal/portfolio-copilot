import { CurrencyCode, CurrencyMismatchError, Money, type MoneySnapshot } from "../financial";
import {
  DuplicateFinancialGoalError,
  InvalidEmergencyReserveTargetError,
  InvalidFinancialGoalError,
} from "./errors";
import { FinancialGoal, type FinancialGoalSnapshot } from "./financial-goal";
import { FinancialHorizon } from "./financial-horizon";
import { FinancialProfileId } from "./financial-profile-id";
import { RiskTolerance } from "./risk-tolerance";

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
  riskTolerance: string;
  horizon: string;
  emergencyReserveTarget: MoneySnapshot | null;
  goals: readonly FinancialGoalSnapshot[];
}>;

function toFinancialProfileId(value: FinancialProfileId | string): FinancialProfileId {
  return typeof value === "string" ? FinancialProfileId.from(value) : value;
}

function toCurrencyCode(value: CurrencyCode | string): CurrencyCode {
  return typeof value === "string" ? CurrencyCode.from(value) : value;
}

function toRiskTolerance(value: RiskTolerance | string): RiskTolerance {
  return typeof value === "string" ? RiskTolerance.from(value) : value;
}

function toFinancialHorizon(value: FinancialHorizon | string): FinancialHorizon {
  return typeof value === "string" ? FinancialHorizon.from(value) : value;
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
      goals: snapshot.goals.map(FinancialGoal.fromSnapshot),
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
