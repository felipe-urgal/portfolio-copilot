import {
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidPortfolioIdError,
  InvalidTransactionAmountError,
  InvalidTransactionIdError,
  InvalidTransactionTimestampError,
  InvalidTransactionTypeError,
  Money,
  PortfolioId,
  Transaction,
  TransactionId,
  TransactionTimestamp,
  TransactionType,
  type PortfolioSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";

export const CASH_TRANSACTION_TYPES = ["CASH_IN", "CASH_OUT"] as const;

export type CashTransactionType = (typeof CASH_TRANSACTION_TYPES)[number];

export type CashTransactionDraft = Readonly<{
  type: CashTransactionType;
  amount: string;
}>;

export type CashTransactionFieldErrors = Readonly<{
  amount?: string;
  form?: string;
}>;

export type CashTransactionCreationResult =
  | Readonly<{ ok: true; snapshot: TransactionSnapshot }>
  | Readonly<{ ok: false; errors: CashTransactionFieldErrors }>;

export type TransactionIdFactory = () => string;
export type TransactionTimestampFactory = () => string;

const AMOUNT_FORMAT_ERROR = "Informe um valor monetário válido, como 1000,00.";
const AMOUNT_POSITIVE_ERROR = "Informe um valor maior que zero.";
const TECHNICAL_ERROR = "Não foi possível registrar a transação local. Tente novamente.";

export function createInitialCashTransactionDraft(): CashTransactionDraft {
  return {
    type: "CASH_IN",
    amount: "",
  };
}

export function normalizeCashAmount(value: string): string {
  const normalized = value.trim();
  const commaIndex = normalized.indexOf(",");

  if (commaIndex === -1 || normalized.includes(".")) {
    return normalized;
  }

  return `${normalized.slice(0, commaIndex)}.${normalized.slice(commaIndex + 1)}`;
}

export function createCashTransactionSnapshot(
  draft: CashTransactionDraft,
  portfolio: PortfolioSnapshot,
  idFactory: TransactionIdFactory,
  timestampFactory: TransactionTimestampFactory,
): CashTransactionCreationResult {
  try {
    const id = TransactionId.from(idFactory());
    const portfolioId = PortfolioId.from(portfolio.id);
    const type = TransactionType.from(draft.type);
    const occurredAt = TransactionTimestamp.from(timestampFactory());
    const settlementAmount = Money.fromDecimal(
      normalizeCashAmount(draft.amount),
      portfolio.referenceCurrency,
    );
    const transaction = Transaction.create({
      id,
      portfolioId,
      type,
      occurredAt,
      settlementAmount,
    });

    return {
      ok: true,
      snapshot: transaction.toSnapshot(),
    };
  } catch (error) {
    if (error instanceof InvalidDecimalError) {
      return { ok: false, errors: { amount: AMOUNT_FORMAT_ERROR } };
    }

    if (error instanceof InvalidTransactionAmountError) {
      return { ok: false, errors: { amount: AMOUNT_POSITIVE_ERROR } };
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
