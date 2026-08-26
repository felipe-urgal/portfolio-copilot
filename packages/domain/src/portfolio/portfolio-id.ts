import { normalizeUuid } from "../identity/uuid";
import { InvalidPortfolioIdError } from "./errors";

export class PortfolioId {
  private constructor(public readonly value: string) {}

  public static from(value: string): PortfolioId {
    const normalized = normalizeUuid(value);

    if (normalized === null) {
      throw new InvalidPortfolioIdError(value);
    }

    return new PortfolioId(normalized);
  }

  public equals(other: PortfolioId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
