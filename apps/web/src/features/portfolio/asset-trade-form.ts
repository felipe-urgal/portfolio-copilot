import {
  AssetId,
  AssetQuantity,
  InsufficientAssetPositionError,
  InvalidAssetIdError,
  InvalidAssetQuantityError,
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidPortfolioIdError,
  InvalidTransactionAmountError,
  InvalidTransactionIdError,
  InvalidTransactionShapeError,
  InvalidTransactionTimestampError,
  InvalidTransactionTypeError,
  Money,
  PortfolioId,
  Transaction,
  TransactionId,
  TransactionTimestamp,
  TransactionType,
  projectAssetPositions,
  type PortfolioSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";

export const ASSET_TRADE_TYPES = ["BUY", "SELL"] as const;

export type AssetTradeType = (typeof ASSET_TRADE_TYPES)[number];

export type AssetTradeDraft = Readonly<{
  type: AssetTradeType;
  assetId: string;
  quantity: string;
  settlementAmount: string;
}>;

export type AssetTradeFieldErrors = Readonly<{
  assetId?: string;
  quantity?: string;
  settlementAmount?: string;
  form?: string;
}>;

export type AssetTradeCreationResult =
  | Readonly<{ ok: true; snapshot: TransactionSnapshot }>
  | Readonly<{ ok: false; errors: AssetTradeFieldErrors }>;

export type LocalAssetPositionSnapshot = Readonly<{
  assetId: string;
  quantity: string;
}>;

export type TradeTransactionIdFactory = () => string;
export type TradeTransactionTimestampFactory = () => string;

const ASSET_ERROR = "Selecione um ativo válido desta sessão.";
const QUANTITY_ERROR = "Informe uma quantidade válida com até 12 casas decimais.";
const QUANTITY_POSITIVE_ERROR = "Informe uma quantidade maior que zero.";
const AMOUNT_FORMAT_ERROR = "Informe um valor monetário válido, como 1000,00.";
const AMOUNT_POSITIVE_ERROR = "Informe um valor de liquidação maior que zero.";
const TECHNICAL_ERROR = "Não foi possível registrar a transação com ativo. Tente novamente.";

export function createInitialAssetTradeDraft(assetId = ""): AssetTradeDraft {
  return {
    type: "BUY",
    assetId,
    quantity: "",
    settlementAmount: "",
  };
}

export function normalizeTradeDecimal(value: string): string {
  const normalized = value.trim();
  const commaIndex = normalized.indexOf(",");

  if (commaIndex === -1 || normalized.includes(".")) {
    return normalized;
  }

  return `${normalized.slice(0, commaIndex)}.${normalized.slice(commaIndex + 1)}`;
}

export function projectLocalAssetPositions(
  portfolioId: string,
  snapshots: readonly TransactionSnapshot[],
): readonly LocalAssetPositionSnapshot[] {
  const transactions = snapshots.map((snapshot) => Transaction.fromSnapshot(snapshot));

  return projectAssetPositions(portfolioId, transactions).map((position) => ({
    assetId: position.assetId.toString(),
    quantity: position.quantity.toDecimalString(),
  }));
}

export function createAssetTradeSnapshot(
  draft: AssetTradeDraft,
  portfolio: PortfolioSnapshot,
  existingTransactions: readonly TransactionSnapshot[],
  idFactory: TradeTransactionIdFactory,
  timestampFactory: TradeTransactionTimestampFactory,
): AssetTradeCreationResult {
  try {
    const id = TransactionId.from(idFactory());
    const portfolioId = PortfolioId.from(portfolio.id);
    const type = TransactionType.from(draft.type);
    const occurredAt = TransactionTimestamp.from(timestampFactory());
    const assetId = AssetId.from(draft.assetId);
    const quantity = AssetQuantity.fromDecimal(normalizeTradeDecimal(draft.quantity));
    const settlementAmount = Money.fromDecimal(
      normalizeTradeDecimal(draft.settlementAmount),
      portfolio.referenceCurrency,
    );
    const transaction = Transaction.create({
      id,
      portfolioId,
      type,
      occurredAt,
      settlementAmount,
      assetId,
      quantity,
    });
    const historicalTransactions = existingTransactions.map((snapshot) =>
      Transaction.fromSnapshot(snapshot),
    );

    projectAssetPositions(portfolioId, [...historicalTransactions, transaction]);

    return {
      ok: true,
      snapshot: transaction.toSnapshot(),
    };
  } catch (error) {
    if (error instanceof InvalidAssetIdError) {
      return { ok: false, errors: { assetId: ASSET_ERROR } };
    }

    if (error instanceof InvalidAssetQuantityError) {
      return { ok: false, errors: { quantity: QUANTITY_ERROR } };
    }

    if (error instanceof InvalidTransactionShapeError) {
      return { ok: false, errors: { quantity: QUANTITY_POSITIVE_ERROR } };
    }

    if (error instanceof InvalidDecimalError) {
      return { ok: false, errors: { settlementAmount: AMOUNT_FORMAT_ERROR } };
    }

    if (error instanceof InvalidTransactionAmountError) {
      return { ok: false, errors: { settlementAmount: AMOUNT_POSITIVE_ERROR } };
    }

    if (error instanceof InsufficientAssetPositionError) {
      return {
        ok: false,
        errors: {
          quantity: `Venda maior que a posição disponível (${error.availableQuantity}).`,
        },
      };
    }

    if (
      error instanceof InvalidTransactionIdError ||
      error instanceof InvalidTransactionTimestampError ||
      error instanceof InvalidTransactionTypeError ||
      error instanceof InvalidPortfolioIdError ||
      error instanceof InvalidCurrencyCodeError
    ) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
