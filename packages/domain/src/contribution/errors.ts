export type ContributionDomainErrorCode =
  | "ALLOCATION_GAP_PORTFOLIO_MISMATCH"
  | "CONTRIBUTION_ALLOCATOR_PORTFOLIO_MISMATCH"
  | "DUPLICATE_CURRENT_ALLOCATION_BUCKET"
  | "NEGATIVE_ALLOCATION_VALUE"
  | "ALLOCATION_TOTAL_MISMATCH"
  | "INVALID_MAX_DESTINATIONS_PER_CONTRIBUTION"
  | "DUPLICATE_CONTRIBUTION_EXECUTION_DESTINATION"
  | "INVALID_MINIMUM_TRADABLE_QUANTITY"
  | "INVALID_CONTRIBUTION_DESTINATION_ELIGIBILITY"
  | "MISSING_CONTRIBUTION_EXECUTION_DESTINATION";

export class ContributionDomainError extends Error {
  public constructor(
    public readonly code: ContributionDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class AllocationGapPortfolioMismatchError extends ContributionDomainError {
  public constructor(
    public readonly targetPortfolioId: string,
    public readonly currentPortfolioId: string,
  ) {
    super(
      "ALLOCATION_GAP_PORTFOLIO_MISMATCH",
      `Cannot calculate allocation gaps across portfolios: target ${targetPortfolioId}, current ${currentPortfolioId}`,
    );
  }
}

export class ContributionAllocatorPortfolioMismatchError extends ContributionDomainError {
  public constructor(
    public readonly targetPortfolioId: string,
    public readonly currentPortfolioId: string,
  ) {
    super(
      "CONTRIBUTION_ALLOCATOR_PORTFOLIO_MISMATCH",
      `Cannot allocate a contribution across portfolios: target ${targetPortfolioId}, current ${currentPortfolioId}`,
    );
  }
}

export class DuplicateCurrentAllocationBucketError extends ContributionDomainError {
  public constructor(public readonly assetClass: string) {
    super(
      "DUPLICATE_CURRENT_ALLOCATION_BUCKET",
      `Duplicate current allocation bucket for asset class: ${assetClass}`,
    );
  }
}

export class NegativeAllocationValueError extends ContributionDomainError {
  public constructor(
    public readonly field: string,
    public readonly value: string,
    public readonly currency: string,
  ) {
    super(
      "NEGATIVE_ALLOCATION_VALUE",
      `Allocation value must be non-negative for ${field}: ${value} ${currency}`,
    );
  }
}

export class AllocationTotalMismatchError extends ContributionDomainError {
  public constructor(
    public readonly portfolioId: string,
    public readonly declaredTotal: string,
    public readonly bucketTotal: string,
    public readonly currency: string,
  ) {
    super(
      "ALLOCATION_TOTAL_MISMATCH",
      `Current allocation buckets for portfolio ${portfolioId} total ${bucketTotal} ${currency}, expected ${declaredTotal} ${currency}`,
    );
  }
}

export class InvalidMaxDestinationsPerContributionError extends ContributionDomainError {
  public constructor(public readonly value: number) {
    super(
      "INVALID_MAX_DESTINATIONS_PER_CONTRIBUTION",
      `maxDestinationsPerContribution must be a positive safe integer: ${String(value)}`,
    );
  }
}

export class DuplicateContributionExecutionDestinationError extends ContributionDomainError {
  public constructor(
    public readonly field: "assetId" | "assetClass",
    public readonly value: string,
  ) {
    super(
      "DUPLICATE_CONTRIBUTION_EXECUTION_DESTINATION",
      `Duplicate contribution execution destination ${field}: ${value}`,
    );
  }
}

export class InvalidMinimumTradableQuantityError extends ContributionDomainError {
  public constructor(
    public readonly assetId: string,
    public readonly value: string,
  ) {
    super(
      "INVALID_MINIMUM_TRADABLE_QUANTITY",
      `Minimum tradable quantity for asset ${assetId} must be greater than zero and use a valid asset quantity: ${JSON.stringify(value)}`,
    );
  }
}

export class InvalidContributionDestinationEligibilityError extends ContributionDomainError {
  public constructor(
    public readonly assetId: string,
    public readonly value: string,
  ) {
    super(
      "INVALID_CONTRIBUTION_DESTINATION_ELIGIBILITY",
      `Contribution destination eligibility for asset ${assetId} must be boolean: ${JSON.stringify(value)}`,
    );
  }
}

export class MissingContributionExecutionDestinationError extends ContributionDomainError {
  public constructor(public readonly assetClass: string) {
    super(
      "MISSING_CONTRIBUTION_EXECUTION_DESTINATION",
      `Missing contribution execution destination for positive allocation in asset class: ${assetClass}`,
    );
  }
}
