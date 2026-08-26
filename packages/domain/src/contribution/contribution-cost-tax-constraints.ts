import { AssetId } from "../asset";
import { CurrencyMismatchError, Money } from "../financial";
import {
  type ContributionExecutionDestination,
  type ContributionExecutionPlan,
} from "./contribution-execution-constraints";
import {
  DuplicateContributionCostConstraintError,
  NegativeAllocationValueError,
  UnknownContributionCostConstraintDestinationError,
} from "./errors";

export const CONTRIBUTION_COST_DESTINATION_STATUSES = [
  "EXECUTABLE",
  "BLOCKED_KNOWN_COSTS",
] as const;

export type ContributionCostDestinationStatus =
  (typeof CONTRIBUTION_COST_DESTINATION_STATUSES)[number];

export type ContributionCostTaxConstraintInput = Readonly<{
  assetId: AssetId | string;
  transactionCost: Money;
  estimatedTaxImpact: Money;
}>;

export type ContributionCostTaxConstraintsInput = Readonly<{
  plan: ContributionExecutionPlan;
  constraints: readonly ContributionCostTaxConstraintInput[];
}>;

export type ContributionCostAdjustedDestination = ContributionExecutionDestination &
  Readonly<{
    transactionCost: Money;
    estimatedTaxImpact: Money;
    totalKnownCost: Money;
    investableAmount: Money;
    status: ContributionCostDestinationStatus;
  }>;

export type ContributionCostAdjustedPlan = Omit<ContributionExecutionPlan, "destinations"> &
  Readonly<{
    destinations: readonly ContributionCostAdjustedDestination[];
  }>;

type NormalizedContributionCostTaxConstraint = Readonly<{
  assetId: AssetId;
  transactionCost: Money;
  estimatedTaxImpact: Money;
}>;

function toAssetId(value: AssetId | string): AssetId {
  return typeof value === "string" ? AssetId.from(value) : value;
}

function validateCost(
  plan: ContributionExecutionPlan,
  assetId: AssetId,
  field: "transactionCost" | "estimatedTaxImpact",
  value: Money,
): void {
  if (value.isNegative()) {
    throw new NegativeAllocationValueError(
      `${field}:${assetId.toString()}`,
      value.toDecimalString(),
      value.currency.code,
    );
  }

  if (!value.currency.equals(plan.contribution.currency)) {
    throw new CurrencyMismatchError(plan.contribution.currency.code, value.currency.code);
  }
}

function normalizeConstraints(
  plan: ContributionExecutionPlan,
  inputs: readonly ContributionCostTaxConstraintInput[],
): ReadonlyMap<string, NormalizedContributionCostTaxConstraint> {
  const destinationIds = new Set(plan.destinations.map((destination) => destination.assetId.toString()));
  const constraintsByAssetId = new Map<string, NormalizedContributionCostTaxConstraint>();

  for (const input of inputs) {
    const assetId = toAssetId(input.assetId);
    const assetIdValue = assetId.toString();

    if (constraintsByAssetId.has(assetIdValue)) {
      throw new DuplicateContributionCostConstraintError(assetIdValue);
    }

    if (!destinationIds.has(assetIdValue)) {
      throw new UnknownContributionCostConstraintDestinationError(assetIdValue);
    }

    validateCost(plan, assetId, "transactionCost", input.transactionCost);
    validateCost(plan, assetId, "estimatedTaxImpact", input.estimatedTaxImpact);

    constraintsByAssetId.set(
      assetIdValue,
      Object.freeze({
        assetId,
        transactionCost: input.transactionCost,
        estimatedTaxImpact: input.estimatedTaxImpact,
      }),
    );
  }

  return constraintsByAssetId;
}

export function applyContributionCostTaxConstraints(
  input: ContributionCostTaxConstraintsInput,
): ContributionCostAdjustedPlan {
  const constraintsByAssetId = normalizeConstraints(input.plan, input.constraints);
  let newlyBlockedMinorUnits = 0n;

  const destinations = input.plan.destinations.map<ContributionCostAdjustedDestination>((destination) => {
    const constraint = constraintsByAssetId.get(destination.assetId.toString());
    const transactionCost =
      constraint?.transactionCost ?? Money.zero(input.plan.contribution.currency);
    const estimatedTaxImpact =
      constraint?.estimatedTaxImpact ?? Money.zero(input.plan.contribution.currency);
    const totalKnownCost = transactionCost.add(estimatedTaxImpact);
    const isBlocked = totalKnownCost.compare(destination.allocatedAmount) >= 0;
    const investableAmount = isBlocked
      ? Money.zero(input.plan.contribution.currency)
      : destination.allocatedAmount.subtract(totalKnownCost);

    if (isBlocked) {
      newlyBlockedMinorUnits += destination.allocatedAmount.minorUnits;
    }

    return Object.freeze({
      ...destination,
      transactionCost,
      estimatedTaxImpact,
      totalKnownCost,
      investableAmount,
      status: isBlocked ? "BLOCKED_KNOWN_COSTS" : "EXECUTABLE",
    });
  });

  return Object.freeze({
    ...input.plan,
    destinations: Object.freeze(destinations),
    unallocatedContribution: Money.fromMinorUnits(
      input.plan.unallocatedContribution.minorUnits + newlyBlockedMinorUnits,
      input.plan.contribution.currency,
    ),
  });
}
