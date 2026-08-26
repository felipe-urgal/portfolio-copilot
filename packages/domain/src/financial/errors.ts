export type FinancialDomainErrorCode =
  | "INVALID_DECIMAL"
  | "INVALID_CURRENCY_CODE"
  | "CURRENCY_MISMATCH"
  | "INVALID_FINANCIAL_SNAPSHOT"
  | "ALLOCATION_WEIGHT_OUT_OF_RANGE";

export class FinancialDomainError extends Error {
  public constructor(
    public readonly code: FinancialDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidDecimalError extends FinancialDomainError {
  public constructor(value: string) {
    super("INVALID_DECIMAL", `Invalid decimal value: ${JSON.stringify(value)}`);
  }
}

export class InvalidCurrencyCodeError extends FinancialDomainError {
  public constructor(currency: string) {
    super(
      "INVALID_CURRENCY_CODE",
      `Currency code must contain exactly three ASCII letters: ${JSON.stringify(currency)}`,
    );
  }
}

export class CurrencyMismatchError extends FinancialDomainError {
  public constructor(leftCurrency: string, rightCurrency: string) {
    super(
      "CURRENCY_MISMATCH",
      `Cannot operate on different currencies: ${leftCurrency} and ${rightCurrency}`,
    );
  }
}

export class InvalidFinancialSnapshotError extends FinancialDomainError {
  public constructor(field: string, value: string) {
    super(
      "INVALID_FINANCIAL_SNAPSHOT",
      `Invalid financial snapshot field ${field}: ${JSON.stringify(value)}`,
    );
  }
}

export class AllocationWeightOutOfRangeError extends FinancialDomainError {
  public constructor(value: string) {
    super(
      "ALLOCATION_WEIGHT_OUT_OF_RANGE",
      `Allocation weight must be between 0% and 100% inclusive: ${JSON.stringify(value)}`,
    );
  }
}
