import { AssetClass, AssetId, AssetQuantity, type AssetClassCode } from "../asset";
import { Money } from "../financial";
import { type PortfolioId } from "../portfolio";
import { type ContributionPlan } from "./contribution-allocator";
import {
  DuplicateContributionExecutionDestinationError,
  InvalidContributionDestinationEligibilityError,
  InvalidMinimumTradableQuantityError,
  MissingContributionExecutionDestinationError,
} from "./errors";

export type ContributionExecutionDestinationInput = Readonly<{
  assetId: AssetId | string;
  assetClass: AssetClass | string;
  isEligible: boolean;
  minimumTradableQuantity: AssetQuantity | string;
}>;

export type ContributionExecutionConstraintsInput = Readonly<{
  plan: ContributionPlan;
  destinations: readonly ContributionExecutionDestinationInput[];
}>;

export type ContributionExecutionDestination = Readonly<{
  portfolioId: PortfolioId;
  assetId: AssetId;
  assetClass: AssetClass;
  allocatedAmount: Money;
  minimumTradableQuantity: AssetQuantity;
}>;

export type ContributionExecutionPlan = Readonly<{
  portfolioId: PortfolioId;
  contribution: Money;
  destinations: readonly ContributionExecutionDestination[];
  unallocatedContribution: Money;
}>;

type NormalizedContributionExecutionDestination = Readonly<{
  assetId: AssetId;
  assetClass: AssetClass;
  isEligible: boolean;
  minimumTradableQuantity: AssetQuantity;
}>;

function toAssetId(value: AssetId | string): AssetId {
  return typeof value === "string" ? AssetId.from(value) : value;
}

function toAssetClass(value: AssetClass | string): AssetClass {
  return typeof value === "string" ? AssetClass.from(value) : value;
}

function toMinimumTradableQuantity(assetId: AssetId, value: AssetQuantity | string): AssetQuantity {
  let quantity: AssetQuantity;

  try {
    quantity = typeof value === "string" ? AssetQuantity.fromDecimal(value) : value;
  } catch {
    throw new InvalidMinimumTradableQuantityError(assetId.toString(), String(value));
  }

  if (quantity.isZero()) {
    throw new InvalidMinimumTradableQuantityError(assetId.toString(), quantity.toDecimalString());
  }

  return quantity;
}

function normalizeDestinations(
  inputs: readonly ContributionExecutionDestinationInput[],
): ReadonlyMap<AssetClassCode, NormalizedContributionExecutionDestination> {
  const byAssetClass = new Map<AssetClassCode, NormalizedContributionExecutionDestination>();
  const assetIds = new Set<string>();

  for (const input of inputs) {
    const assetId = toAssetId(input.assetId);
    const assetClass = toAssetClass(input.assetClass);
    const assetIdValue = assetId.toString();

    if (assetIds.has(assetIdValue)) {
      throw new DuplicateContributionExecutionDestinationError("assetId", assetIdValue);
    }

    if (byAssetClass.has(assetClass.code)) {
      throw new DuplicateContributionExecutionDestinationError("assetClass", assetClass.code);
    }

    if (typeof input.isEligible !== "boolean") {
      throw new InvalidContributionDestinationEligibilityError(
        assetIdValue,
        String(input.isEligible),
      );
    }

    const minimumTradableQuantity = toMinimumTradableQuantity(
      assetId,
      input.minimumTradableQuantity,
    );

    assetIds.add(assetIdValue);
    byAssetClass.set(
      assetClass.code,
      Object.freeze({
        assetId,
        assetClass,
        isEligible: input.isEligible,
        minimumTradableQuantity,
      }),
    );
  }

  return byAssetClass;
}

export function applyContributionExecutionConstraints(
  input: ContributionExecutionConstraintsInput,
): ContributionExecutionPlan {
  const destinationsByClass = normalizeDestinations(input.destinations);
  const destinations: ContributionExecutionDestination[] = [];
  let blockedMinorUnits = 0n;

  for (const allocation of input.plan.allocations) {
    if (allocation.allocatedAmount.isZero()) continue;

    const destination = destinationsByClass.get(allocation.assetClass.code);

    if (destination === undefined) {
      throw new MissingContributionExecutionDestinationError(allocation.assetClass.code);
    }

    if (!destination.isEligible) {
      blockedMinorUnits += allocation.allocatedAmount.minorUnits;
      continue;
    }

    destinations.push(
      Object.freeze({
        portfolioId: input.plan.portfolioId,
        assetId: destination.assetId,
        assetClass: destination.assetClass,
        allocatedAmount: allocation.allocatedAmount,
        minimumTradableQuantity: destination.minimumTradableQuantity,
      }),
    );
  }

  return Object.freeze({
    portfolioId: input.plan.portfolioId,
    contribution: input.plan.contribution,
    destinations: Object.freeze(destinations),
    unallocatedContribution: Money.fromMinorUnits(
      input.plan.unallocatedContribution.minorUnits + blockedMinorUnits,
      input.plan.contribution.currency,
    ),
  });
}
