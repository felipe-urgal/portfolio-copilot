import { AssetId, AssetQuantity } from "../asset";
import type { AssetQuantitySnapshot } from "../asset";
import { Money } from "../financial";
import type { MoneySnapshot } from "../financial";
import { PortfolioId } from "../portfolio";
import { InvalidTransactionAmountError, InvalidTransactionShapeError } from "./errors";
import { TransactionId } from "./transaction-id";
import { TransactionTimestamp } from "./transaction-timestamp";
import { TransactionType } from "./transaction-type";

export type TransactionCreationInput = Readonly<{
  id: TransactionId | string;
  portfolioId: PortfolioId | string;
  type: TransactionType | string;
  occurredAt: TransactionTimestamp | string;
  settlementAmount: Money;
  assetId?: AssetId | string | null;
  quantity?: AssetQuantity | string | null;
}>;

export type TransactionSnapshot = Readonly<{
  id: string;
  portfolioId: string;
  type: string;
  occurredAt: string;
  settlementAmount: MoneySnapshot;
  assetId: string | null;
  quantity: AssetQuantitySnapshot | null;
}>;

function toTransactionId(value: TransactionId | string): TransactionId {
  return typeof value === "string" ? TransactionId.from(value) : value;
}

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function toTransactionType(value: TransactionType | string): TransactionType {
  return typeof value === "string" ? TransactionType.from(value) : value;
}

function toTransactionTimestamp(value: TransactionTimestamp | string): TransactionTimestamp {
  return typeof value === "string" ? TransactionTimestamp.from(value) : value;
}

function toAssetId(value: AssetId | string | null | undefined): AssetId | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? AssetId.from(value) : value;
}

function toAssetQuantity(value: AssetQuantity | string | null | undefined): AssetQuantity | null {
  if (value === null || value === undefined) return null;
  return typeof value === "string" ? AssetQuantity.fromDecimal(value) : value;
}

function assertPositiveSettlementAmount(amount: Money): void {
  if (amount.isZero() || amount.isNegative()) {
    throw new InvalidTransactionAmountError(amount.toDecimalString(), amount.currency.toString());
  }
}

function assertTransactionShape(
  type: TransactionType,
  assetId: AssetId | null,
  quantity: AssetQuantity | null,
): void {
  if (type.isAssetTrade()) {
    if (assetId === null || quantity === null) {
      throw new InvalidTransactionShapeError(type.toString(), "assetId and quantity are required");
    }

    if (quantity.isZero()) {
      throw new InvalidTransactionShapeError(type.toString(), "quantity must be greater than zero");
    }

    return;
  }

  if (assetId !== null || quantity !== null) {
    throw new InvalidTransactionShapeError(
      type.toString(),
      "cash flow transactions must not contain assetId or quantity",
    );
  }
}

export class Transaction {
  private constructor(
    public readonly id: TransactionId,
    public readonly portfolioId: PortfolioId,
    public readonly type: TransactionType,
    public readonly occurredAt: TransactionTimestamp,
    public readonly settlementAmount: Money,
    public readonly assetId: AssetId | null,
    public readonly quantity: AssetQuantity | null,
  ) {}

  public static create(input: TransactionCreationInput): Transaction {
    const type = toTransactionType(input.type);
    const assetId = toAssetId(input.assetId);
    const quantity = toAssetQuantity(input.quantity);

    assertPositiveSettlementAmount(input.settlementAmount);
    assertTransactionShape(type, assetId, quantity);

    return new Transaction(
      toTransactionId(input.id),
      toPortfolioId(input.portfolioId),
      type,
      toTransactionTimestamp(input.occurredAt),
      input.settlementAmount,
      assetId,
      quantity,
    );
  }

  public static fromSnapshot(snapshot: TransactionSnapshot): Transaction {
    return Transaction.create({
      id: snapshot.id,
      portfolioId: snapshot.portfolioId,
      type: snapshot.type,
      occurredAt: snapshot.occurredAt,
      settlementAmount: Money.fromSnapshot(snapshot.settlementAmount),
      assetId: snapshot.assetId,
      quantity:
        snapshot.quantity === null ? null : AssetQuantity.fromSnapshot(snapshot.quantity),
    });
  }

  public sameIdentityAs(other: Transaction): boolean {
    return this.id.equals(other.id);
  }

  public toSnapshot(): TransactionSnapshot {
    return {
      id: this.id.toString(),
      portfolioId: this.portfolioId.toString(),
      type: this.type.toString(),
      occurredAt: this.occurredAt.toString(),
      settlementAmount: this.settlementAmount.toSnapshot(),
      assetId: this.assetId?.toString() ?? null,
      quantity: this.quantity?.toSnapshot() ?? null,
    };
  }
}
