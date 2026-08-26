import { AssetQuantity } from "../asset";
import type { AssetId } from "../asset";
import { PortfolioId } from "../portfolio";
import type { Transaction } from "../transaction";
import type { AssetPosition } from "./asset-position";
import { InsufficientAssetPositionError } from "./errors";

function toPortfolioId(value: PortfolioId | string): PortfolioId {
  return typeof value === "string" ? PortfolioId.from(value) : value;
}

function compareText(left: string, right: string): -1 | 0 | 1 {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function comparePositions(left: AssetPosition, right: AssetPosition): number {
  return compareText(left.assetId.toString(), right.assetId.toString());
}

function isAssetTrade(
  transaction: Transaction,
): transaction is Transaction & Readonly<{ assetId: AssetId; quantity: AssetQuantity }> {
  return transaction.type.isAssetTrade();
}

export function projectAssetPositions(
  portfolioId: PortfolioId | string,
  transactions: readonly Transaction[],
): readonly AssetPosition[] {
  const targetPortfolioId = toPortfolioId(portfolioId);
  const orderedTransactions = transactions
    .map((transaction, inputIndex) => ({ transaction, inputIndex }))
    .filter(({ transaction }) => transaction.portfolioId.equals(targetPortfolioId))
    .sort((left, right) => {
      const timestampOrder = compareText(
        left.transaction.occurredAt.toString(),
        right.transaction.occurredAt.toString(),
      );
      return timestampOrder === 0 ? left.inputIndex - right.inputIndex : timestampOrder;
    });
  const positions = new Map<string, AssetPosition>();

  for (const { transaction } of orderedTransactions) {
    if (!isAssetTrade(transaction)) continue;

    const assetKey = transaction.assetId.toString();
    const currentQuantity = positions.get(assetKey)?.quantity ?? AssetQuantity.zero();

    if (transaction.type.code === "BUY") {
      positions.set(assetKey, {
        assetId: transaction.assetId,
        quantity: AssetQuantity.fromScaledUnits(
          currentQuantity.scaledUnits + transaction.quantity.scaledUnits,
        ),
      });
      continue;
    }

    if (transaction.type.code !== "SELL") continue;

    if (transaction.quantity.compare(currentQuantity) > 0) {
      throw new InsufficientAssetPositionError(
        targetPortfolioId.toString(),
        assetKey,
        transaction.id.toString(),
        currentQuantity.toDecimalString(),
        transaction.quantity.toDecimalString(),
      );
    }

    const remainingQuantity = AssetQuantity.fromScaledUnits(
      currentQuantity.scaledUnits - transaction.quantity.scaledUnits,
    );

    if (remainingQuantity.isZero()) {
      positions.delete(assetKey);
    } else {
      positions.set(assetKey, {
        assetId: transaction.assetId,
        quantity: remainingQuantity,
      });
    }
  }

  return Array.from(positions.values()).sort(comparePositions);
}
