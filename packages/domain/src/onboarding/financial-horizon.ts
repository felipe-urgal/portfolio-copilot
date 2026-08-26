import { InvalidFinancialHorizonError } from "./errors";

export const FINANCIAL_HORIZON_CODES = ["SHORT", "MEDIUM", "LONG"] as const;

export type FinancialHorizonCode = (typeof FINANCIAL_HORIZON_CODES)[number];

export class FinancialHorizon {
  private constructor(public readonly code: FinancialHorizonCode) {}

  public static from(value: string): FinancialHorizon {
    if (!(FINANCIAL_HORIZON_CODES as readonly string[]).includes(value)) {
      throw new InvalidFinancialHorizonError(value);
    }

    return new FinancialHorizon(value as FinancialHorizonCode);
  }

  public equals(other: FinancialHorizon): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
