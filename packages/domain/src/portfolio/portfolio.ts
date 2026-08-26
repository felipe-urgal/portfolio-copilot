import { CurrencyCode } from "../financial";
import { InvalidPortfolioNameError } from "./errors";
import { PortfolioId } from "./portfolio-id";

const MAX_PORTFOLIO_NAME_LENGTH = 120;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;

export type PortfolioCreationInput = Readonly<{
  id: PortfolioId | string;
  name: string;
  referenceCurrency: CurrencyCode | string;
}>;

export type PortfolioSnapshot = Readonly<{
  id: string;
  name: string;
  referenceCurrency: string;
}>;

function normalizePortfolioName(name: string): string {
  const normalized = name.trim();

  if (
    normalized.length === 0 ||
    normalized.length > MAX_PORTFOLIO_NAME_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidPortfolioNameError(name);
  }

  return normalized;
}

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function toCurrencyCode(value: CurrencyCode | string): CurrencyCode {
  return typeof value === "string" ? CurrencyCode.from(value) : value;
}

export class Portfolio {
  private constructor(
    public readonly id: PortfolioId,
    public readonly name: string,
    public readonly referenceCurrency: CurrencyCode,
  ) {}

  public static create(input: PortfolioCreationInput): Portfolio {
    return new Portfolio(
      toPortfolioId(input.id),
      normalizePortfolioName(input.name),
      toCurrencyCode(input.referenceCurrency),
    );
  }

  public static fromSnapshot(snapshot: PortfolioSnapshot): Portfolio {
    return Portfolio.create(snapshot);
  }

  public sameIdentityAs(other: Portfolio): boolean {
    return this.id.equals(other.id);
  }

  public toSnapshot(): PortfolioSnapshot {
    return {
      id: this.id.toString(),
      name: this.name,
      referenceCurrency: this.referenceCurrency.toString(),
    };
  }
}
