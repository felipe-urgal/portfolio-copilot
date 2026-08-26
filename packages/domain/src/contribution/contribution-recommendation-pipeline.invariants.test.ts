import { describe, expect, it } from "vitest";

import { AllocationWeight, Money } from "../financial";
import { PortfolioId, TargetAllocation } from "../portfolio";
import { applyAssetClassConcentrationLimits } from "./asset-class-concentration-limits";
import { allocateContribution } from "./contribution-allocator";
import { applyContributionExecutionConstraints } from "./contribution-execution-constraints";
import { applyContributionPolicy } from "./contribution-policy";
import {
  buildContributionRecommendationSnapshot,
  CONTRIBUTION_RECOMMENDATION_REASON_CODES,
  type ContributionRecommendationPipelineInput,
  type ContributionRecommendationSnapshot,
} from "./contribution-recommendation-pipeline";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440060");
const ASSET_CLASSES = ["CASH", "EQUITY", "FIXED_INCOME", "REAL_ESTATE"] as const;
const ASSET_IDS = [
  "550e8400-e29b-41d4-a716-446655440061",
  "550e8400-e29b-41d4-a716-446655440062",
  "550e8400-e29b-41d4-a716-446655440063",
  "550e8400-e29b-41d4-a716-446655440064",
] as const;
const FULL_WEIGHT_UNITS = AllocationWeight.full().percentage.scaledUnits;
const CORPUS_SIZE = 512;

type RandomSource = Readonly<{
  nextInt(maxExclusive: number): number;
}>;

type Scenario = Readonly<{
  seed: number;
  input: ContributionRecommendationPipelineInput;
  diagnostic: Readonly<Record<string, unknown>>;
}>;

type Coverage = {
  zeroContribution: number;
  tinyContribution: number;
  oneClass: number;
  multipleClasses: number;
  policyAdjusted: number;
  hardExact: number;
  hardPartial: number;
  hardTotal: number;
  ineligible: number;
  executableKnownCost: number;
  blockedKnownCost: number;
};

function randomSource(seed: number): RandomSource {
  let state = seed >>> 0;

  return {
    nextInt(maxExclusive: number): number {
      if (!Number.isSafeInteger(maxExclusive) || maxExclusive <= 0) {
        throw new Error(`Invalid deterministic random bound: ${String(maxExclusive)}`);
      }

      state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
      return state % maxExclusive;
    },
  };
}

function formatBasisPoints(basisPoints: number): string {
  const whole = Math.floor(basisPoints / 100);
  const fraction = String(basisPoints % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

function splitTotal(total: number, count: number, random: RandomSource): readonly number[] {
  if (count === 1) return [total];

  const raw = Array.from({ length: count }, () => random.nextInt(1_000) + 1);
  const rawTotal = raw.reduce((sum, value) => sum + value, 0);
  let assigned = 0;

  return raw.map((value, index) => {
    if (index === count - 1) return total - assigned;

    const part = Math.floor((total * value) / rawTotal);
    assigned += part;
    return part;
  });
}

function targetBasisPoints(count: number, random: RandomSource): readonly number[] {
  if (count === 1) return [10_000];

  const raw = Array.from({ length: count }, () => random.nextInt(1_000) + 1);
  const rawTotal = raw.reduce((sum, value) => sum + value, 0);
  let assigned = 0;

  return raw.map((value, index) => {
    if (index === count - 1) return 10_000 - assigned;

    const remainingBuckets = count - index - 1;
    const rawPart = Math.floor((10_000 * value) / rawTotal);
    const part = Math.max(1, Math.min(rawPart, 10_000 - assigned - remainingBuckets));
    assigned += part;
    return part;
  });
}

function contributionCentsForSeed(seed: number, random: RandomSource): number {
  const edgeContributions = [0, 1, 2, 3, 7, 10, 99, 100, 101, 999, 1_000, 1_001] as const;
  if (seed < edgeContributions.length) return edgeContributions[seed] ?? 0;
  return random.nextInt(50_001);
}

function buildScenario(seed: number): Scenario {
  const random = randomSource(seed + 1);
  const classCount = (seed % ASSET_CLASSES.length) + 1;
  const assetClasses = ASSET_CLASSES.slice(0, classCount);
  const weights = targetBasisPoints(classCount, random);
  const portfolioCents = seed < 4 ? 10_000 : 1 + random.nextInt(1_000_000);
  const contributionCents = contributionCentsForSeed(seed, random);
  const currentCents = splitTotal(portfolioCents, classCount, random);
  const targetAllocation = TargetAllocation.create({
    portfolioId: PORTFOLIO_ID,
    buckets: assetClasses.map((assetClass, index) => ({
      assetClass,
      targetWeight: formatBasisPoints(weights[index] ?? 0),
    })),
  });
  const minimumMode = seed % 4;
  const minimumCents =
    minimumMode === 0
      ? 0
      : minimumMode === 1
        ? 1
        : minimumMode === 2
          ? Math.floor(contributionCents / 4)
          : contributionCents + 1;
  const maxDestinationsPerContribution = (seed % classCount) + 1;

  const concentrationCycle = Math.floor(seed / ASSET_CLASSES.length);
  const concentrationLimits = assetClasses.flatMap((assetClass, index) => {
    const mode = (concentrationCycle + index) % 4;
    if (mode === 0) return [];
    if (mode === 1) {
      return [{ assetClass, softMaxWeight: "40", hardMaxWeight: "100" }];
    }
    if (mode === 2) {
      const hardPercent = 20 + ((seed * 7 + index * 13) % 61);
      const softPercent = Math.max(0, hardPercent - 10);
      return [
        {
          assetClass,
          softMaxWeight: String(softPercent),
          hardMaxWeight: String(hardPercent),
        },
      ];
    }

    return [{ assetClass, softMaxWeight: "0", hardMaxWeight: "0" }];
  });

  const executionDestinations = assetClasses.map((assetClass, index) => ({
    assetId: ASSET_IDS[index] ?? ASSET_IDS[0],
    assetClass,
    isEligible: (seed + index) % 5 !== 0,
    minimumTradableQuantity: index % 2 === 0 ? "1" : "0.01",
  }));

  const allocation = {
    portfolioId: PORTFOLIO_ID,
    targetAllocation,
    portfolioValue: Money.fromMinorUnits(BigInt(portfolioCents), "BRL"),
    currentValues: assetClasses.map((assetClass, index) => ({
      assetClass,
      currentValue: Money.fromMinorUnits(BigInt(currentCents[index] ?? 0), "BRL"),
    })),
    contribution: Money.fromMinorUnits(BigInt(contributionCents), "BRL"),
  };
  const policy = {
    minimumMeaningfulContribution: Money.fromMinorUnits(BigInt(minimumCents), "BRL"),
    maxDestinationsPerContribution,
  };

  const baselinePlan = allocateContribution(allocation);
  const policyPlan = applyContributionPolicy({ plan: baselinePlan, policy });
  const concentrationPlan = applyAssetClassConcentrationLimits({
    plan: policyPlan,
    limits: concentrationLimits,
  });
  const executionPlan = applyContributionExecutionConstraints({
    plan: concentrationPlan,
    destinations: executionDestinations,
  });

  const costModes: Record<string, string> = {};
  const costTaxConstraints = executionPlan.destinations.map((destination, index) => {
    const allocatedCents = Number(destination.allocatedAmount.minorUnits);
    const mode = (seed + index) % 4;
    let totalCostCents = 0;

    if (mode === 1 && allocatedCents > 1) {
      totalCostCents = 1 + random.nextInt(allocatedCents - 1);
    } else if (mode === 2) {
      totalCostCents = allocatedCents;
    } else if (mode === 3) {
      totalCostCents = allocatedCents + 1 + random.nextInt(10);
    }

    const transactionCostCents = Math.floor(totalCostCents / 2);
    const estimatedTaxImpactCents = totalCostCents - transactionCostCents;
    costModes[destination.assetClass.code] = ["ZERO", "LESS", "EQUAL", "GREATER"][mode] ?? "ZERO";

    return {
      assetId: destination.assetId,
      transactionCost: Money.fromMinorUnits(BigInt(transactionCostCents), "BRL"),
      estimatedTaxImpact: Money.fromMinorUnits(BigInt(estimatedTaxImpactCents), "BRL"),
    };
  });

  return {
    seed,
    input: {
      methodologyVersion: "portfolio-engine/invariant-corpus-v1",
      allocation,
      policy,
      concentrationLimits,
      executionDestinations,
      costTaxConstraints,
    },
    diagnostic: {
      seed,
      classCount,
      portfolioCents,
      contributionCents,
      targetBasisPoints: weights,
      currentCents,
      minimumCents,
      maxDestinationsPerContribution,
      concentrationLimits,
      eligibility: executionDestinations.map((destination) => ({
        assetClass: destination.assetClass,
        isEligible: destination.isEligible,
      })),
      costModes,
    },
  };
}

function cents(value: string, currency = "BRL"): bigint {
  return Money.fromDecimal(value, currency).minorUnits;
}

function maximumAllowedMinorUnits(
  postContributionMinorUnits: bigint,
  hardMaxWeightPercent: string,
): bigint {
  const hardMaxWeight = AllocationWeight.fromPercent(hardMaxWeightPercent);
  return (postContributionMinorUnits * hardMaxWeight.percentage.scaledUnits) / FULL_WEIGHT_UNITS;
}

function assertReasonCodeOrder(snapshot: ContributionRecommendationSnapshot): void {
  const rank = new Map(
    CONTRIBUTION_RECOMMENDATION_REASON_CODES.map((reasonCode, index) => [reasonCode, index]),
  );

  for (const decision of snapshot.decisions) {
    const ranks = decision.reasonCodes.map((reasonCode) => rank.get(reasonCode) ?? -1);
    expect(ranks).toEqual([...ranks].sort((left, right) => left - right));
  }
}

function assertScenarioInvariants(
  scenario: Scenario,
  snapshot: ContributionRecommendationSnapshot,
  coverage: Coverage,
): void {
  const contribution = cents(snapshot.contribution, snapshot.currency);
  const totalInvestable = cents(snapshot.totalInvestableAmount, snapshot.currency);
  const totalConsumedCost = cents(snapshot.totalConsumedKnownCost, snapshot.currency);
  const unallocated = cents(snapshot.unallocatedContribution, snapshot.currency);

  expect(totalInvestable + totalConsumedCost + unallocated).toBe(contribution);
  expect(totalInvestable).toBeGreaterThanOrEqual(0n);
  expect(totalConsumedCost).toBeGreaterThanOrEqual(0n);
  expect(unallocated).toBeGreaterThanOrEqual(0n);

  const cashRemainders = [
    snapshot.cashRemainder.afterAllocator,
    snapshot.cashRemainder.afterPolicy,
    snapshot.cashRemainder.afterConcentration,
    snapshot.cashRemainder.afterExecution,
    snapshot.cashRemainder.afterCosts,
  ].map((value) => cents(value, snapshot.currency));

  for (let index = 1; index < cashRemainders.length; index += 1) {
    expect(cashRemainders[index]).toBeGreaterThanOrEqual(cashRemainders[index - 1] ?? 0n);
  }
  expect(cashRemainders.at(-1)).toBe(unallocated);

  const orderedClasses = snapshot.decisions.map((decision) => decision.assetClass);
  expect(orderedClasses).toEqual([...orderedClasses].sort());
  assertReasonCodeOrder(snapshot);

  let decisionsInvestable = 0n;
  let decisionsConsumedCost = 0n;
  const postContribution = cents(snapshot.postContributionValue, snapshot.currency);

  for (const decision of snapshot.decisions) {
    const currentValue = cents(decision.currentValue, snapshot.currency);
    const concentrationAllocated = cents(decision.concentrationAllocatedAmount, snapshot.currency);
    const concentrationBlocked = cents(decision.concentrationBlockedAmount, snapshot.currency);
    const totalKnownCost = cents(decision.totalKnownCost, snapshot.currency);
    const consumedKnownCost = cents(decision.consumedKnownCost, snapshot.currency);
    const investable = cents(decision.investableAmount, snapshot.currency);

    expect(concentrationAllocated).toBeGreaterThanOrEqual(0n);
    expect(concentrationBlocked).toBeGreaterThanOrEqual(0n);
    expect(totalKnownCost).toBeGreaterThanOrEqual(0n);
    expect(consumedKnownCost).toBeGreaterThanOrEqual(0n);
    expect(investable).toBeGreaterThanOrEqual(0n);
    expect(consumedKnownCost).toBeLessThanOrEqual(concentrationAllocated);

    if (decision.status === "EXECUTABLE") {
      expect(investable).toBeGreaterThan(0n);
      expect(investable + consumedKnownCost).toBe(concentrationAllocated);
      if (consumedKnownCost > 0n) coverage.executableKnownCost += 1;
    } else {
      expect(investable).toBe(0n);
    }

    if (decision.status === "BLOCKED_INELIGIBLE") {
      coverage.ineligible += 1;
      expect(decision.executionEligible).toBe(false);
    }

    if (decision.status === "BLOCKED_KNOWN_COSTS") {
      coverage.blockedKnownCost += 1;
      expect(consumedKnownCost).toBe(0n);
      expect(totalKnownCost).toBeGreaterThanOrEqual(concentrationAllocated);
    }

    if (decision.reasonCodes.includes("CONTRIBUTION_POLICY_ADJUSTED")) {
      coverage.policyAdjusted += 1;
    }

    if (decision.hardMaxWeightPercent !== null) {
      const maximumAllowed = maximumAllowedMinorUnits(
        postContribution,
        decision.hardMaxWeightPercent,
      );
      const projected = currentValue + concentrationAllocated;

      if (concentrationAllocated > 0n) {
        expect(projected).toBeLessThanOrEqual(maximumAllowed);
      }

      if (projected === maximumAllowed && concentrationAllocated > 0n) coverage.hardExact += 1;
      if (concentrationBlocked > 0n && concentrationAllocated > 0n) coverage.hardPartial += 1;
      if (concentrationBlocked > 0n && concentrationAllocated === 0n) coverage.hardTotal += 1;
    }

    decisionsInvestable += investable;
    decisionsConsumedCost += consumedKnownCost;
  }

  expect(decisionsInvestable).toBe(totalInvestable);
  expect(decisionsConsumedCost).toBe(totalConsumedCost);

  const repeated = buildContributionRecommendationSnapshot(scenario.input);
  expect(repeated).toEqual(snapshot);
  const serialized = JSON.stringify(snapshot);
  expect(JSON.stringify(repeated)).toBe(serialized);
  expect(JSON.parse(serialized)).toEqual(snapshot);

  if (scenario.input.allocation.contribution.isZero()) coverage.zeroContribution += 1;
  if (
    scenario.input.allocation.contribution.minorUnits > 0n &&
    scenario.input.allocation.contribution.minorUnits <= 7n
  ) {
    coverage.tinyContribution += 1;
  }
  if (scenario.input.allocation.targetAllocation.buckets.length === 1) coverage.oneClass += 1;
  if (scenario.input.allocation.targetAllocation.buckets.length > 1) coverage.multipleClasses += 1;
}

describe("contribution recommendation pipeline invariants", () => {
  it(`holds across ${CORPUS_SIZE} deterministic scenarios`, () => {
    const coverage: Coverage = {
      zeroContribution: 0,
      tinyContribution: 0,
      oneClass: 0,
      multipleClasses: 0,
      policyAdjusted: 0,
      hardExact: 0,
      hardPartial: 0,
      hardTotal: 0,
      ineligible: 0,
      executableKnownCost: 0,
      blockedKnownCost: 0,
    };

    for (let seed = 0; seed < CORPUS_SIZE; seed += 1) {
      const scenario = buildScenario(seed);

      try {
        const snapshot = buildContributionRecommendationSnapshot(scenario.input);
        assertScenarioInvariants(scenario, snapshot, coverage);
      } catch (error) {
        throw new Error(`Invariant corpus failed for ${JSON.stringify(scenario.diagnostic)}`, {
          cause: error,
        });
      }
    }

    expect(coverage.zeroContribution).toBeGreaterThan(0);
    expect(coverage.tinyContribution).toBeGreaterThan(0);
    expect(coverage.oneClass).toBeGreaterThan(0);
    expect(coverage.multipleClasses).toBeGreaterThan(0);
    expect(coverage.policyAdjusted).toBeGreaterThan(0);
    expect(coverage.hardExact).toBeGreaterThan(0);
    expect(coverage.hardPartial).toBeGreaterThan(0);
    expect(coverage.hardTotal).toBeGreaterThan(0);
    expect(coverage.ineligible).toBeGreaterThan(0);
    expect(coverage.executableKnownCost).toBeGreaterThan(0);
    expect(coverage.blockedKnownCost).toBeGreaterThan(0);
  });
});
