import { normalizeUuid } from "../identity/uuid";
import { InvalidFinancialProfileIdError } from "./errors";

export class FinancialProfileId {
  private constructor(public readonly value: string) {}

  public static from(value: string): FinancialProfileId {
    const normalized = normalizeUuid(value);

    if (normalized === null) {
      throw new InvalidFinancialProfileIdError(value);
    }

    return new FinancialProfileId(normalized);
  }

  public equals(other: FinancialProfileId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
