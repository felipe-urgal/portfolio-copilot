export type PortfolioDomainErrorCode =
  | "INVALID_PORTFOLIO_ID"
  | "INVALID_PORTFOLIO_NAME"
  | "DUPLICATE_TARGET_ALLOCATION_BUCKET"
  | "ZERO_TARGET_ALLOCATION_WEIGHT"
  | "INVALID_TARGET_ALLOCATION_TOTAL_WEIGHT";

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

export class DuplicateTargetAllocationBucketError extends PortfolioDomainError {
  public constructor(public readonly assetClass: string) {
    super(
      "DUPLICATE_TARGET_ALLOCATION_BUCKET",
      `Duplicate target allocation bucket for asset class: ${assetClass}`,
    );
  }
}

export class ZeroTargetAllocationWeightError extends PortfolioDomainError {
  public constructor(public readonly assetClass: string) {
    super(
      "ZERO_TARGET_ALLOCATION_WEIGHT",
      `Target allocation bucket must have a positive weight: ${assetClass}`,
    );
  }
}

export class InvalidTargetAllocationTotalWeightError extends PortfolioDomainError {
  public constructor(public readonly totalPercent: string) {
    super(
      "INVALID_TARGET_ALLOCATION_TOTAL_WEIGHT",
      `Target allocation weights must total exactly 100%: ${totalPercent}%`,
    );
  }
}
