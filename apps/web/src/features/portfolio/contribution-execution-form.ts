import {
  AssetClass,
  AssetQuantity,
  DuplicateContributionExecutionDestinationError,
  InvalidAssetClassError,
  InvalidAssetIdError,
  InvalidContributionDestinationEligibilityError,
  InvalidMinimumTradableQuantityError,
  MissingContributionExecutionDestinationError,
  Money,
  PortfolioId,
  applyContributionExecutionConstraints,
  type AssetClassCode,
  type ContributionPlan,
  type MoneySnapshot,
} from "@portfolio-copilot/domain";

import {
  normalizeContributionDecimal,
  type ContributionBaselineSnapshot,
} from "./contribution-baseline-form";
import { type ContributionPolicySnapshot } from "./contribution-policy-form";
import { type LocalAssetSnapshot } from "./local-asset-form";

export type ContributionExecutionDestinationDraft = Readonly<{
  assetClass: AssetClassCode;
  assetId: string;
  isEligible: boolean | null;
  minimumTradableQuantity: string;
}>;

export type ContributionExecutionDraft = Readonly<{
  destinations: readonly ContributionExecutionDestinationDraft[];
}>;

export type ContributionExecutionRowErrors = Readonly<{
  assetId?: string;
  isEligible?: string;
  minimumTradableQuantity?: string;
}>;

export type ContributionExecutionFieldErrors = Readonly<{
  destinations?: Partial<Record<AssetClassCode, ContributionExecutionRowErrors>>;
  form?: string;
}>;

export type ContributionExecutionDestinationStatus = "EXECUTABLE" | "BLOCKED_INELIGIBLE";

export type ContributionExecutionDestinationSnapshot = Readonly<{
  assetClass: AssetClassCode;
  assetId: string;
  isEligible: boolean;
  minimumTradableQuantity: string;
  policyAllocatedAmount: MoneySnapshot;
  executionAllocatedAmount: MoneySnapshot | null;
  status: ContributionExecutionDestinationStatus;
}>;

export type ContributionExecutionSnapshot = Readonly<{
  destinations: readonly ContributionExecutionDestinationSnapshot[];
  unallocatedContribution: MoneySnapshot;
}>;

export type ContributionExecutionResult =
  | Readonly<{ ok: true; snapshot: ContributionExecutionSnapshot }>
  | Readonly<{ ok: false; errors: ContributionExecutionFieldErrors }>;

const DESTINATION_REQUIRED_ERROR = "Selecione um ativo local desta classe.";
const DESTINATION_INVALID_ERROR = "Selecione um ativo válido desta sessão e da mesma classe.";
const ELIGIBILITY_ERROR = "Informe explicitamente se este destino está elegível.";
const MINIMUM_QUANTITY_ERROR =
  "Informe uma quantidade mínima maior que zero e com até 12 casas decimais.";
const DUPLICATE_DESTINATION_ERROR =
  "Cada classe e cada ativo podem aparecer apenas uma vez como destino de execução.";
const TECHNICAL_ERROR = "Não foi possível validar os destinos locais do aporte. Tente novamente.";

function isPositiveMoney(snapshot: MoneySnapshot): boolean {
  return Money.fromSnapshot(snapshot).minorUnits > 0n;
}

function rowError(
  assetClass: AssetClassCode,
  errors: ContributionExecutionRowErrors,
): ContributionExecutionResult {
  return { ok: false, errors: { destinations: { [assetClass]: errors } } };
}

function rehydratePolicyPlan(
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
): ContributionPlan {
  const portfolioId = PortfolioId.from(baseline.targetAllocation.portfolioId);
  const policyByClass = new Map(
    policy.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
  );

  return Object.freeze({
    portfolioId,
    portfolioValue: Money.fromSnapshot(baseline.portfolioValue),
    contribution: Money.fromSnapshot(baseline.contribution),
    postContributionValue: Money.fromSnapshot(baseline.postContributionValue),
    allocations: Object.freeze(
      baseline.allocations.map((allocation) => {
        const policyAllocation = policyByClass.get(allocation.assetClass);
        if (policyAllocation === undefined) {
          throw new Error(`Missing policy allocation for ${allocation.assetClass}`);
        }

        return Object.freeze({
          portfolioId,
          assetClass: AssetClass.from(allocation.assetClass),
          currentValue: Money.fromSnapshot(allocation.currentValue),
          postContributionTargetValue: Money.fromSnapshot(allocation.postContributionTargetValue),
          postContributionNeed: Money.fromSnapshot(allocation.postContributionNeed),
          allocatedAmount: Money.fromSnapshot(policyAllocation.policyAllocatedAmount),
        });
      }),
    ),
    unallocatedContribution: Money.fromSnapshot(policy.unallocatedContribution),
  });
}

export function createInitialContributionExecutionDraft(
  policy: ContributionPolicySnapshot,
): ContributionExecutionDraft {
  return {
    destinations: policy.allocations
      .filter((allocation) => isPositiveMoney(allocation.policyAllocatedAmount))
      .map((allocation) => ({
        assetClass: allocation.assetClass,
        assetId: "",
        isEligible: null,
        minimumTradableQuantity: "",
      })),
  };
}

export function createContributionExecutionSnapshot(
  draft: ContributionExecutionDraft,
  baseline: ContributionBaselineSnapshot,
  policy: ContributionPolicySnapshot,
  assets: readonly LocalAssetSnapshot[],
): ContributionExecutionResult {
  const selectedAssets = new Map<string, LocalAssetSnapshot>();
  const destinations: Array<{
    assetId: string;
    assetClass: string;
    isEligible: boolean;
    minimumTradableQuantity: string;
  }> = [];

  for (const row of draft.destinations) {
    if (row.assetId.trim() === "") continue;

    const asset = assets.find((candidate) => candidate.id === row.assetId);
    if (asset === undefined || asset.assetClass !== row.assetClass) {
      return rowError(row.assetClass, { assetId: DESTINATION_INVALID_ERROR });
    }

    selectedAssets.set(row.assetClass, asset);
    destinations.push({
      assetId: asset.id,
      assetClass: asset.assetClass,
      isEligible: row.isEligible as boolean,
      minimumTradableQuantity: normalizeContributionDecimal(row.minimumTradableQuantity),
    });
  }

  try {
    const policyPlan = rehydratePolicyPlan(baseline, policy);
    const executionPlan = applyContributionExecutionConstraints({
      plan: policyPlan,
      destinations,
    });
    const executableByClass = new Map(
      executionPlan.destinations.map((destination) => [destination.assetClass.code, destination] as const),
    );
    const policyByClass = new Map(
      policy.allocations.map((allocation) => [allocation.assetClass, allocation] as const),
    );

    return {
      ok: true,
      snapshot: {
        destinations: policyPlan.allocations
          .filter((allocation) => !allocation.allocatedAmount.isZero())
          .map((allocation) => {
            const assetClass = allocation.assetClass.code;
            const row = draft.destinations.find((candidate) => candidate.assetClass === assetClass);
            const asset = selectedAssets.get(assetClass);
            const policyAllocation = policyByClass.get(assetClass);

            if (row === undefined || asset === undefined || policyAllocation === undefined) {
              throw new Error(`Missing validated execution input for ${assetClass}`);
            }

            const executable = executableByClass.get(assetClass);
            const minimumTradableQuantity =
              executable?.minimumTradableQuantity ??
              AssetQuantity.fromDecimal(
                normalizeContributionDecimal(row.minimumTradableQuantity),
              );

            return {
              assetClass,
              assetId: asset.id,
              isEligible: row.isEligible === true,
              minimumTradableQuantity: minimumTradableQuantity.toDecimalString(),
              policyAllocatedAmount: policyAllocation.policyAllocatedAmount,
              executionAllocatedAmount: executable?.allocatedAmount.toSnapshot() ?? null,
              status: executable === undefined ? "BLOCKED_INELIGIBLE" : "EXECUTABLE",
            };
          }),
        unallocatedContribution: executionPlan.unallocatedContribution.toSnapshot(),
      },
    };
  } catch (error) {
    if (error instanceof MissingContributionExecutionDestinationError) {
      return rowError(error.assetClass as AssetClassCode, { assetId: DESTINATION_REQUIRED_ERROR });
    }

    if (error instanceof InvalidContributionDestinationEligibilityError) {
      const row = draft.destinations.find((candidate) => candidate.assetId === error.assetId);
      if (row !== undefined) return rowError(row.assetClass, { isEligible: ELIGIBILITY_ERROR });
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    if (error instanceof InvalidMinimumTradableQuantityError) {
      const row = draft.destinations.find((candidate) => candidate.assetId === error.assetId);
      if (row !== undefined) {
        return rowError(row.assetClass, { minimumTradableQuantity: MINIMUM_QUANTITY_ERROR });
      }
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    if (error instanceof DuplicateContributionExecutionDestinationError) {
      return { ok: false, errors: { form: DUPLICATE_DESTINATION_ERROR } };
    }

    if (error instanceof InvalidAssetIdError || error instanceof InvalidAssetClassError) {
      return { ok: false, errors: { form: TECHNICAL_ERROR } };
    }

    throw error;
  }
}
