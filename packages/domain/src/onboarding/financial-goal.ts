import { Money, type MoneySnapshot } from "../financial";
import { normalizeUuid } from "../identity/uuid";
import {
  InvalidFinancialGoalIdError,
  InvalidFinancialGoalTargetAmountError,
  InvalidFinancialGoalTargetDateError,
  InvalidFinancialGoalTypeError,
} from "./errors";

export const FINANCIAL_GOAL_TYPES = [
  "NET_WORTH",
  "PASSIVE_INCOME_MONTHLY",
  "RETIREMENT",
  "DATED_PURPOSE",
] as const;

export type FinancialGoalTypeCode = (typeof FINANCIAL_GOAL_TYPES)[number];

export class FinancialGoalId {
  private constructor(public readonly value: string) {}

  public static from(value: string): FinancialGoalId {
    const normalized = normalizeUuid(value);

    if (normalized === null) {
      throw new InvalidFinancialGoalIdError(value);
    }

    return new FinancialGoalId(normalized);
  }

  public equals(other: FinancialGoalId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}

export class FinancialGoalType {
  private constructor(public readonly code: FinancialGoalTypeCode) {}

  public static from(value: string): FinancialGoalType {
    if (!(FINANCIAL_GOAL_TYPES as readonly string[]).includes(value)) {
      throw new InvalidFinancialGoalTypeError(value);
    }

    return new FinancialGoalType(value as FinancialGoalTypeCode);
  }

  public equals(other: FinancialGoalType): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}

export type FinancialGoalCreationInput = Readonly<{
  id: FinancialGoalId | string;
  type: FinancialGoalType | FinancialGoalTypeCode;
  targetAmount: Money;
  targetDate?: string | null;
}>;

export type FinancialGoalSnapshot = Readonly<{
  id: string;
  type: FinancialGoalTypeCode;
  targetAmount: MoneySnapshot;
  targetDate: string | null;
}>;

const CANONICAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeTargetDate(
  goalType: FinancialGoalType,
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) {
    if (goalType.code === "DATED_PURPOSE") {
      throw new InvalidFinancialGoalTargetDateError(goalType.code, null);
    }

    return null;
  }

  if (goalType.code === "NET_WORTH" || goalType.code === "PASSIVE_INCOME_MONTHLY") {
    throw new InvalidFinancialGoalTargetDateError(goalType.code, value);
  }

  if (!CANONICAL_DATE_PATTERN.test(value)) {
    throw new InvalidFinancialGoalTargetDateError(goalType.code, value);
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new InvalidFinancialGoalTargetDateError(goalType.code, value);
  }

  return value;
}

function normalizeTargetAmount(value: Money): Money {
  if (!(value instanceof Money) || value.isNegative() || value.isZero()) {
    throw new InvalidFinancialGoalTargetAmountError(String(value));
  }

  return value;
}

function toFinancialGoalId(value: FinancialGoalId | string): FinancialGoalId {
  return value instanceof FinancialGoalId ? value : FinancialGoalId.from(String(value));
}

function toFinancialGoalType(value: FinancialGoalType | FinancialGoalTypeCode): FinancialGoalType {
  return value instanceof FinancialGoalType ? value : FinancialGoalType.from(String(value));
}

export class FinancialGoal {
  private constructor(
    public readonly id: FinancialGoalId,
    public readonly type: FinancialGoalType,
    public readonly targetAmount: Money,
    public readonly targetDate: string | null,
  ) {}

  public static create(input: FinancialGoalCreationInput): FinancialGoal {
    const type = toFinancialGoalType(input.type);

    return new FinancialGoal(
      toFinancialGoalId(input.id),
      type,
      normalizeTargetAmount(input.targetAmount),
      normalizeTargetDate(type, input.targetDate),
    );
  }

  public static fromSnapshot(snapshot: FinancialGoalSnapshot): FinancialGoal {
    return FinancialGoal.create({
      id: snapshot.id,
      type: snapshot.type,
      targetAmount: Money.fromSnapshot(snapshot.targetAmount),
      targetDate: snapshot.targetDate,
    });
  }

  public sameIdentityAs(other: FinancialGoal): boolean {
    return this.id.equals(other.id);
  }

  public toSnapshot(): FinancialGoalSnapshot {
    return {
      id: this.id.toString(),
      type: this.type.code,
      targetAmount: this.targetAmount.toSnapshot(),
      targetDate: this.targetDate,
    };
  }
}
