export type TransactionDomainErrorCode =
  | "INVALID_ASSET_QUANTITY"
  | "INVALID_TRANSACTION_ID"
  | "INVALID_TRANSACTION_TYPE"
  | "INVALID_TRANSACTION_TIMESTAMP"
  | "INVALID_TRANSACTION_AMOUNT"
  | "INVALID_TRANSACTION_SHAPE";

export class TransactionDomainError extends Error {
  public constructor(
    public readonly code: TransactionDomainErrorCode,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidAssetQuantityError extends TransactionDomainError {
  public constructor(value: string) {
    super("INVALID_ASSET_QUANTITY", `Invalid asset quantity: ${JSON.stringify(value)}`);
  }
}

export class InvalidTransactionIdError extends TransactionDomainError {
  public constructor(value: string) {
    super("INVALID_TRANSACTION_ID", `Invalid transaction id: ${JSON.stringify(value)}`);
  }
}

export class InvalidTransactionTypeError extends TransactionDomainError {
  public constructor(value: string) {
    super("INVALID_TRANSACTION_TYPE", `Invalid transaction type: ${JSON.stringify(value)}`);
  }
}

export class InvalidTransactionTimestampError extends TransactionDomainError {
  public constructor(value: string) {
    super("INVALID_TRANSACTION_TIMESTAMP", `Invalid transaction timestamp: ${JSON.stringify(value)}`);
  }
}

export class InvalidTransactionAmountError extends TransactionDomainError {
  public constructor(value: string, currency: string) {
    super(
      "INVALID_TRANSACTION_AMOUNT",
      `Transaction settlement amount must be positive: ${JSON.stringify(value)} ${currency}`,
    );
  }
}

export class InvalidTransactionShapeError extends TransactionDomainError {
  public constructor(type: string, reason: string) {
    super("INVALID_TRANSACTION_SHAPE", `Invalid ${type} transaction: ${reason}`);
  }
}
