import { normalizeUuid } from "../identity/uuid";
import { InvalidTransactionIdError } from "./errors";

export class TransactionId {
  private constructor(public readonly value: string) {}

  public static from(value: string): TransactionId {
    const normalized = normalizeUuid(value);

    if (normalized === null) {
      throw new InvalidTransactionIdError(value);
    }

    return new TransactionId(normalized);
  }

  public equals(other: TransactionId): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
