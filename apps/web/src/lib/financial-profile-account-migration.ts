import { FinancialProfile, type FinancialProfileSnapshot } from "@portfolio-copilot/domain";

export type FinancialProfileRelation =
  | "none"
  | "local-only"
  | "account-only"
  | "aligned"
  | "conflict";

export type FinancialProfileDifferenceKey =
  | "profileIdentity"
  | "referenceCurrency"
  | "riskTolerance"
  | "horizon"
  | "emergencyReserveTarget"
  | "goals";

export type FinancialProfileComparison = Readonly<{
  relation: FinancialProfileRelation;
  differences: readonly FinancialProfileDifferenceKey[];
}>;

export type FinancialProfileMigrationPlan = Readonly<{
  outcome: "create" | "unchanged" | "replace" | "conflict";
  snapshot: FinancialProfileSnapshot;
}>;

export function canonicalFinancialProfileSnapshot(
  snapshot: FinancialProfileSnapshot,
): FinancialProfileSnapshot {
  return FinancialProfile.fromSnapshot(snapshot).toSnapshot();
}

function serialized(value: unknown): string {
  return JSON.stringify(value);
}

export function compareFinancialProfiles(
  localProfile: FinancialProfileSnapshot | null,
  accountProfile: FinancialProfileSnapshot | null,
): FinancialProfileComparison {
  if (localProfile === null && accountProfile === null) {
    return { relation: "none", differences: [] };
  }

  if (localProfile === null) {
    return { relation: "account-only", differences: [] };
  }

  if (accountProfile === null) {
    return { relation: "local-only", differences: [] };
  }

  const local = canonicalFinancialProfileSnapshot(localProfile);
  const account = canonicalFinancialProfileSnapshot(accountProfile);
  const differences: FinancialProfileDifferenceKey[] = [];

  if (local.id !== account.id) differences.push("profileIdentity");
  if (local.referenceCurrency !== account.referenceCurrency) differences.push("referenceCurrency");
  if (local.riskTolerance !== account.riskTolerance) differences.push("riskTolerance");
  if (local.horizon !== account.horizon) differences.push("horizon");
  if (serialized(local.emergencyReserveTarget) !== serialized(account.emergencyReserveTarget)) {
    differences.push("emergencyReserveTarget");
  }
  if (serialized(local.goals) !== serialized(account.goals)) differences.push("goals");

  return {
    relation: differences.length === 0 ? "aligned" : "conflict",
    differences,
  };
}

export function planFinancialProfileMigration(
  localProfile: FinancialProfileSnapshot,
  accountProfile: FinancialProfileSnapshot | null,
  replaceRequested = false,
): FinancialProfileMigrationPlan {
  const snapshot = canonicalFinancialProfileSnapshot(localProfile);
  const comparison = compareFinancialProfiles(snapshot, accountProfile);

  if (comparison.relation === "local-only") return { outcome: "create", snapshot };
  if (comparison.relation === "aligned") return { outcome: "unchanged", snapshot };
  if (replaceRequested) return { outcome: "replace", snapshot };

  return { outcome: "conflict", snapshot };
}
