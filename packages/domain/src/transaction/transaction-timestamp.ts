import { InvalidTransactionTimestampError } from "./errors";

const CANONICAL_UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export class TransactionTimestamp {
  private constructor(public readonly value: string) {}

  public static from(value: string): TransactionTimestamp {
    if (!CANONICAL_UTC_TIMESTAMP_PATTERN.test(value)) {
      throw new InvalidTransactionTimestampError(value);
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
      throw new InvalidTransactionTimestampError(value);
    }

    return new TransactionTimestamp(value);
  }

  public equals(other: TransactionTimestamp): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
