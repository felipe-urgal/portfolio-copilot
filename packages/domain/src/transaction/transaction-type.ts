import { InvalidTransactionTypeError } from "./errors";

export const TRANSACTION_TYPE_CODES = ["BUY", "SELL", "CASH_IN", "CASH_OUT"] as const;

export type TransactionTypeCode = (typeof TRANSACTION_TYPE_CODES)[number];

const TRANSACTION_TYPE_SET = new Set<string>(TRANSACTION_TYPE_CODES);

export class TransactionType {
  private constructor(public readonly code: TransactionTypeCode) {}

  public static from(value: string): TransactionType {
    const normalized = value.trim().toUpperCase();

    if (!TRANSACTION_TYPE_SET.has(normalized)) {
      throw new InvalidTransactionTypeError(value);
    }

    return new TransactionType(normalized as TransactionTypeCode);
  }

  public isAssetTrade(): boolean {
    return this.code === "BUY" || this.code === "SELL";
  }

  public equals(other: TransactionType): boolean {
    return this.code === other.code;
  }

  public toString(): string {
    return this.code;
  }
}
