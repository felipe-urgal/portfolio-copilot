import { InvalidRiskToleranceError } from "./errors";

export const RISK_TOLERANCE_CODES = ["LOW", "MEDIUM", "HIGH"] as const;

export type RiskToleranceCode = (typeof RISK_TOLERANCE_CODES)[number];

export class RiskTolerance {
  private constructor(public readonly code: RiskToleranceCode) {}

  public static from(value: string): RiskTolerance {
    if (!(RISK_TOLERANCE_CODES as readonly string[]).includes(value)) {
      throw new InvalidRiskToleranceError(value);
    }

    return new RiskTolerance(value as RiskToleranceCode);
  }

  public equals(other: RiskTolerance): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
