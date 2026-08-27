import {
  AssetClass,
  AssetId,
  AssetQuantity,
  CurrencyMismatchError,
  DuplicateContributionCostConstraintError,
  InvalidAssetIdError,
  InvalidContributionCostAmountError,
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidPortfolioIdError,
  Money,
  NegativeAllocationValueError,
  PortfolioId,
  UnknownContributionCostConstraintDestinationError,
  applyContributionCostTaxConstraints,
  type ContributionExecutionPlan,
  type MoneySnapshot,
} from "@portfolio-copilot/domain";

import {
  normalizeContributionDecimal,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import { type ContributionExecutionSnapshot } from "./contribution-execution-form";

export type ContributionCostRowDraft = Readonly<{
  assetId: string;
  transactionCost: string;
  estimatedTaxImpact: string;
}>;

export type ContributionCostDraft = Readonly<{
  rows: readonly ContributionCostRowDraft[];
}>;

export type ContributionCostRowErrors = Readonly<{
  transactionCost?: string;
  estimatedTaxImpact?: string;
}>;

export type ContributionCostFieldErrors = Readonly<{
  rows?: Readonly<Record<string, ContributionCostRowErrors>>;
  form?: string;
}>;

export type ContributionCostDestinationStatus = "EXECUTABLE" | "BLOCKED_KNOWN_COSTS";

export type ContributionCostDestinationSnapshot = Readonly<{
  assetId: string;
  assetClass: ContributionExecutionSnapshot["destinations"][number]["assetClass"];
  grossAllocatedAmount: MoneySnapshot;
  transactionCost: MoneySnapshot;
  estimatedTaxImpact: MoneySnapshot;
  totalKnownCost: MoneySnapshot;
  investableAmount: MoneySnapshot;
  status: ContributionCostDestinationStatus;
}>;

export type ContributionCostSnapshot = Readonly<{
  destinations: readonly ContributionCostDestinationSnapshot[];
  unallocatedContribution: MoneySnapshot;
}>;

export type ContributionCostResult =
  | Readonly<{ ok: true; snapshot: ContributionCostSnapshot }>
  | Readonly<{ ok: false; errors: ContributionCostFieldErrors }>;

const COST_FORMAT_ERROR = "Informe um valor monetário válido ou deixe em branco para zero.";
const COST_NEGATIVE_ERROR = "O valor informado não pode ser negativo.";
const UNKNOWN_DESTINATION_ERROR = "A configuração referencia um destino que não está executável.";
const DUPLICATE_DESTINATION_ERROR =
  "Cada destino executável pode ter no máximo uma configuração de custos.";
const TECHNICAL_ERROR =
  "Não foi possível aplicar os custos conhecidos do aporte. Tente novamente.";

function executableDestinations(execution: ContributionExecutionSnapshot) {
  return execution.destinations.filter(
    (destination) =>
      destination.status === "EXECUTABLE" && destination.executionAllocatedAmount !== null,
  );
}

function rehydrateExecutionPlan(
  baseline: ContributionBaselineSnapshot,
  execution: ContributionExecutionSnapshot,
): ContributionExecutionPlan {
  const portfolioId = PortfolioId.from(baseline.targetAllocation.portfolioId);

  return Object.freeze({
    portfolioId,
    contribution: Money.fromSnapshot(baseline.contribution),
    destinations: Object.freeze(
      executableDestinations(execution).map((destination) =>
        Object.freeze({
          portfolioId,
          assetId: AssetId.from(destination.assetId),
          assetClass: AssetClass.from(destination.assetClass),
          allocatedAmount: Money.fromSnapshot(destination.executionAllocatedAmount!),
          minimumTradableQuantity: AssetQuantity.fromDecimal(destination.minimumTradableQuantity),
        }),
      ),
    ),
    unallocatedContribution: Money.fromSnapshot(execution.unallocatedContribution),
  });
}

function rowError(assetId: string, errors: ContributionCostRowErrors): ContributionCostResult {
  return { ok: false, errors: { rows: { [assetId]: errors } } };
}

function parseOptionalMoney(value: string, currency: string): Money {
  if (value.trim() === "") return Money.zero(currency);
  return Money.fromDecimal(normalizeContributionDecimal(value), currency);
}

export function createInitialContributionCostDraft(
  execution: ContributionExecutionSnapshot,
): ContributionCostDraft {
  return {
    rows: executableDestinations(execution).map((destination) => ({
      assetId: destination.assetId,
      transactionCost: "",
      estimatedTaxImpact: "",
    })),
  };
}

export function createContributionCostSnapshot(
  draft: ContributionCostDraft,
  baseline: ContributionBaselineSnapshot,
  execution: ContributionExecutionSnapshot,
): ContributionCostResult {
  const currency = baseline.contribution.currency;
  const constraints: Array<{
    assetId: string;
    transactionCost: Money;
    estimatedTaxImpact: Money;
  }> = [];

  for (const row of draft.rows) {
    if (row.transactionCost.trim() === "" && row.estimatedTaxImpact.trim() === "") continue;

    let transactionCost: Money;
    try {
      transactionCost = parseOptionalMoney(row.transactionCost, currency);
    } catch (error) {
      if (error instanceof InvalidDecimalError) {
        return rowError(row.assetId, { transactionCost: COST_FORMAT_ERROR });
      }
      if (error instanceof InvalidCurrencyCodeError) {
        return { ok: false, errors: { form: TECHNICAL_ERROR } };
      }
      throw error;
    }

    let estimatedTaxImpact: Money;
    try {
      estimatedTaxImpact = parseOptionalMoney(row.estimatedTaxImpact, currency);
    } catch (error) {
      if (error instanceof InvalidDecimalError) {
        return rowError(row.assetId, { estimatedTaxImpact: COST_FORMAT_ERROR });
      }
      if (error instanceof InvalidCurrencyCodeError) {
        return { ok: false, errors: { form: TECHNICAL_ERROR } };
      }
      throw error;
    }

    constraints.push({ assetId: row.assetId, transactionCost, estimatedTaxImpact });
  }

  try {
    const executionPlan = rehydrateExecutionPlan(baseline, execution);
    const adjustedPlan = applyContributionCostTaxConstraints({ plan: executionPlan, constraints });

    return {
      ok: true,
      snapshot: {
        destinations: adjustedPlan.destinations.map((destination) => ({
          assetId: destination.assetId.toString(),
          assetClass: destination.assetClass.code,
          grossAllocatedAmount: destination.allocatedAmount.toSnapshot(),
          transactionCost: destination.transactionCost.toSnapshot(),
          estimatedTaxImpact: destination.estimatedTaxImpact.toSnapshot(),
          totalKnownCost: destination.totalKnownCost.toSnapshot(),
          investableAmount: destination.investableAmount.toSnapshot(),
          status: destination.status,
        })),
        unallocatedContribution: adjustedPlan.unallocatedContribution.toSnapshot(),
      },
    };
  } catch (error) {
    if (error instanceof DuplicateContributionCostConstraintError) {
      return { ok: false, errors: { form: DUPLICATE_DESTINATION_ERROR } };
    }

    if (error instanceof UnknownContributionCostConstraintDestinationError) {
      const row = draft.rows.find((candidate) => candidate.assetId === error.assetId);
      if (row === undefined) return { ok: false, errors: { form: TECHNICAL_ERROR } };
      const field =
        row.transactionCost.trim() !== "" ? "transactionCost" : "estimatedTaxImpact";
      return rowError(error.assetId, { [field]: UNKNOWN_DESTINATION_ERROR });
    }

    if (error instanceof InvalidContributionCostAmountError) {
      return rowError(error.assetId, { [error.field]: COST_FORMAT_ERROR });
    }

    if (error instanceof NegativeAllocationValueError) {
      const [field, assetId] = error.field.split(":", 2);
      if (
        assetId !== undefined &&
        (field === "transactionCost" || field === "estimatedTaxImpact")
      ) {
        return rowError(assetId, { [field]: COST_NEGATIVE_ERROR });
      }
    }

    if (
      error instanceof CurrencyMismatchError ||
      error instanceof InvalidAssetIdError ||
      error instanceof InvalidPortfolioIdError ||
      error instanceof InvalidCurrencyCodeError
    ) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
