import {
  ASSET_CLASS_CODES,
  AllocationTotalMismatchError,
  AllocationWeightOutOfRangeError,
  ContributionAllocatorPortfolioMismatchError,
  CurrencyMismatchError,
  DuplicateCurrentAllocationBucketError,
  DuplicateTargetAllocationBucketError,
  InvalidCurrencyCodeError,
  InvalidDecimalError,
  InvalidPortfolioIdError,
  InvalidTargetAllocationTotalWeightError,
  Money,
  NegativeAllocationValueError,
  TargetAllocation,
  ZeroTargetAllocationWeightError,
  allocateContribution,
  type AssetClassCode,
  type MoneySnapshot,
  type PortfolioSnapshot,
  type TargetAllocationSnapshot,
} from "@portfolio-copilot/domain";

export type ContributionClassDraft = Readonly<{
  assetClass: AssetClassCode;
  targetWeight: string;
  currentValue: string;
}>;

export type ContributionBaselineDraft = Readonly<{
  portfolioValue: string;
  contribution: string;
  rows: readonly ContributionClassDraft[];
}>;

export type ContributionBaselineFieldErrors = Readonly<{
  portfolioValue?: string;
  contribution?: string;
  targetAllocation?: string;
  currentValues?: string;
  form?: string;
}>;

export type ContributionAllocationSnapshot = Readonly<{
  assetClass: AssetClassCode;
  targetWeightPercent: string;
  currentValue: MoneySnapshot;
  postContributionTargetValue: MoneySnapshot;
  postContributionNeed: MoneySnapshot;
  allocatedAmount: MoneySnapshot;
}>;

export type ContributionBaselineSnapshot = Readonly<{
  targetAllocation: TargetAllocationSnapshot;
  portfolioValue: MoneySnapshot;
  contribution: MoneySnapshot;
  postContributionValue: MoneySnapshot;
  allocations: readonly ContributionAllocationSnapshot[];
  unallocatedContribution: MoneySnapshot;
}>;

export type ContributionBaselineResult =
  | Readonly<{ ok: true; snapshot: ContributionBaselineSnapshot }>
  | Readonly<{ ok: false; errors: ContributionBaselineFieldErrors }>;

const TARGET_FORMAT_ERROR =
  "Revise os pesos-alvo. Use percentuais entre 0 e 100 e deixe classes fora do alvo em branco.";
const TARGET_DUPLICATE_ERROR = "A mesma classe econômica não pode aparecer duas vezes no alvo.";
const TARGET_ZERO_ERROR = "Pesos-alvo preenchidos precisam ser maiores que zero.";
const PORTFOLIO_VALUE_ERROR = "Informe o valor total atual como valor monetário válido.";
const CONTRIBUTION_ERROR = "Informe o aporte como valor monetário válido; zero é permitido.";
const CURRENT_VALUES_ERROR = "Revise os valores atuais declarados por classe econômica.";
const TECHNICAL_ERROR = "Não foi possível calcular o baseline local do aporte. Tente novamente.";

export function createInitialContributionBaselineDraft(): ContributionBaselineDraft {
  return {
    portfolioValue: "",
    contribution: "",
    rows: ASSET_CLASS_CODES.map((assetClass) => ({
      assetClass,
      targetWeight: "",
      currentValue: "",
    })),
  };
}

export function normalizeContributionDecimal(value: string): string {
  const normalized = value.trim();
  const commaIndex = normalized.indexOf(",");

  if (commaIndex === -1 || normalized.includes(".")) {
    return normalized;
  }

  return `${normalized.slice(0, commaIndex)}.${normalized.slice(commaIndex + 1)}`;
}

function targetAllocationError(error: unknown): ContributionBaselineResult | null {
  if (error instanceof InvalidDecimalError || error instanceof AllocationWeightOutOfRangeError) {
    return { ok: false, errors: { targetAllocation: TARGET_FORMAT_ERROR } };
  }

  if (error instanceof DuplicateTargetAllocationBucketError) {
    return { ok: false, errors: { targetAllocation: TARGET_DUPLICATE_ERROR } };
  }

  if (error instanceof ZeroTargetAllocationWeightError) {
    return { ok: false, errors: { targetAllocation: TARGET_ZERO_ERROR } };
  }

  if (error instanceof InvalidTargetAllocationTotalWeightError) {
    return {
      ok: false,
      errors: {
        targetAllocation: `A soma dos pesos-alvo deve ser exatamente 100% (atual: ${error.totalPercent}%).`,
      },
    };
  }

  if (error instanceof InvalidPortfolioIdError) {
    return { ok: false, errors: { form: TECHNICAL_ERROR } };
  }

  return null;
}

function moneyFieldError(
  error: unknown,
  field: "portfolioValue" | "contribution",
): ContributionBaselineResult | null {
  if (error instanceof InvalidDecimalError) {
    return {
      ok: false,
      errors: {
        [field]: field === "portfolioValue" ? PORTFOLIO_VALUE_ERROR : CONTRIBUTION_ERROR,
      },
    };
  }

  if (error instanceof InvalidCurrencyCodeError) {
    return { ok: false, errors: { form: TECHNICAL_ERROR } };
  }

  return null;
}

export function createContributionBaselineSnapshot(
  draft: ContributionBaselineDraft,
  portfolio: PortfolioSnapshot,
): ContributionBaselineResult {
  let targetAllocation: TargetAllocation;

  try {
    targetAllocation = TargetAllocation.create({
      portfolioId: portfolio.id,
      buckets: draft.rows
        .filter((row) => row.targetWeight.trim() !== "")
        .map((row) => ({
          assetClass: row.assetClass,
          targetWeight: normalizeContributionDecimal(row.targetWeight),
        })),
    });
  } catch (error) {
    const translated = targetAllocationError(error);
    if (translated !== null) return translated;
    throw error;
  }

  let portfolioValue: Money;

  try {
    portfolioValue = Money.fromDecimal(
      normalizeContributionDecimal(draft.portfolioValue),
      portfolio.referenceCurrency,
    );
  } catch (error) {
    const translated = moneyFieldError(error, "portfolioValue");
    if (translated !== null) return translated;
    throw error;
  }

  let contribution: Money;

  try {
    contribution = Money.fromDecimal(
      normalizeContributionDecimal(draft.contribution),
      portfolio.referenceCurrency,
    );
  } catch (error) {
    const translated = moneyFieldError(error, "contribution");
    if (translated !== null) return translated;
    throw error;
  }

  const currentValues = [];

  for (const row of draft.rows) {
    if (row.currentValue.trim() === "") continue;

    try {
      currentValues.push({
        assetClass: row.assetClass,
        currentValue: Money.fromDecimal(
          normalizeContributionDecimal(row.currentValue),
          portfolio.referenceCurrency,
        ),
      });
    } catch (error) {
      if (error instanceof InvalidDecimalError) {
        return { ok: false, errors: { currentValues: CURRENT_VALUES_ERROR } };
      }

      if (error instanceof InvalidCurrencyCodeError) {
        return { ok: false, errors: { form: TECHNICAL_ERROR } };
      }

      throw error;
    }
  }

  try {
    const plan = allocateContribution({
      portfolioId: portfolio.id,
      targetAllocation,
      portfolioValue,
      currentValues,
      contribution,
    });

    return {
      ok: true,
      snapshot: {
        targetAllocation: targetAllocation.toSnapshot(),
        portfolioValue: plan.portfolioValue.toSnapshot(),
        contribution: plan.contribution.toSnapshot(),
        postContributionValue: plan.postContributionValue.toSnapshot(),
        allocations: plan.allocations.map((allocation) => ({
          assetClass: allocation.assetClass.code,
          targetWeightPercent: targetAllocation
            .targetWeightFor(allocation.assetClass)
            .toPercentString(),
          currentValue: allocation.currentValue.toSnapshot(),
          postContributionTargetValue: allocation.postContributionTargetValue.toSnapshot(),
          postContributionNeed: allocation.postContributionNeed.toSnapshot(),
          allocatedAmount: allocation.allocatedAmount.toSnapshot(),
        })),
        unallocatedContribution: plan.unallocatedContribution.toSnapshot(),
      },
    };
  } catch (error) {
    if (error instanceof AllocationTotalMismatchError) {
      return {
        ok: false,
        errors: {
          currentValues: `Os valores atuais somam ${error.bucketTotal} ${error.currency}, mas o valor total informado é ${error.declaredTotal} ${error.currency}.`,
        },
      };
    }

    if (error instanceof DuplicateCurrentAllocationBucketError) {
      return {
        ok: false,
        errors: { currentValues: "A mesma classe econômica não pode ter dois valores atuais." },
      };
    }

    if (error instanceof NegativeAllocationValueError) {
      if (error.field === "portfolioValue") {
        return { ok: false, errors: { portfolioValue: "O valor total atual não pode ser negativo." } };
      }

      if (error.field === "contribution") {
        return { ok: false, errors: { contribution: "O aporte não pode ser negativo." } };
      }

      return {
        ok: false,
        errors: { currentValues: "Valores atuais por classe não podem ser negativos." },
      };
    }

    if (
      error instanceof ContributionAllocatorPortfolioMismatchError ||
      error instanceof CurrencyMismatchError ||
      error instanceof InvalidPortfolioIdError
    ) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
