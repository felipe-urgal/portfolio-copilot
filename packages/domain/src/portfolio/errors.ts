export type PortfolioDomainErrorCode = "INVALID_PORTFOLIO_ID" | "INVALID_PORTFOLIO_NAME";

export class PortfolioDomainError extends Error {
  public constructor(
    public readonly code: PortfolioDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidPortfolioIdError extends PortfolioDomainError {
  public constructor(value: string) {
    super("INVALID_PORTFOLIO_ID", `Invalid portfolio id: ${JSON.stringify(value)}`);
  }
}

export class InvalidPortfolioNameError extends PortfolioDomainError {
  public constructor(value: string) {
    super("INVALID_PORTFOLIO_NAME", `Invalid portfolio name: ${JSON.stringify(value)}`);
  }
}
