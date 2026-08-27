import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import {
  FINANCIAL_PROFILE_STORAGE_KEY,
  FINANCIAL_PROFILE_STORAGE_VERSION,
  type FinancialProfileStorage,
  readFinancialProfileFromStorage,
  removeFinancialProfileFromStorage,
  writeFinancialProfileToStorage,
} from "./financial-profile-storage";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "3000000" },
  goals: [
    {
      id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
      type: "RETIREMENT",
      targetAmount: { currency: "BRL", minorUnits: "100000000" },
      targetDate: null,
    },
  ],
};

function createMemoryStorage(initialValue?: string): {
  storage: FinancialProfileStorage;
  values: Map<string, string>;
} {
  const values = new Map<string, string>();

  if (initialValue !== undefined) {
    values.set(FINANCIAL_PROFILE_STORAGE_KEY, initialValue);
  }

  return {
    values,
    storage: {
      getItem(key) {
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        values.set(key, value);
      },
      removeItem(key) {
        values.delete(key);
      },
    },
  };
}

describe("financial profile local storage adapter", () => {
  it("writes a versioned envelope and reloads a domain-validated snapshot", () => {
    const { storage, values } = createMemoryStorage();

    expect(writeFinancialProfileToStorage(storage, PROFILE)).toBe(true);

    const raw = values.get(FINANCIAL_PROFILE_STORAGE_KEY);
    expect(raw).toBeDefined();
    expect(JSON.parse(raw ?? "null")).toEqual({
      version: FINANCIAL_PROFILE_STORAGE_VERSION,
      snapshot: PROFILE,
    });
    expect(readFinancialProfileFromStorage(storage)).toEqual({
      status: "loaded",
      snapshot: PROFILE,
    });
  });

  it("treats an empty storage as absence instead of inventing a profile", () => {
    const { storage } = createMemoryStorage();

    expect(readFinancialProfileFromStorage(storage)).toEqual({ status: "empty" });
  });

  it("removes malformed JSON instead of exposing partial data", () => {
    const { storage, values } = createMemoryStorage("{not-json");

    expect(readFinancialProfileFromStorage(storage)).toEqual({ status: "invalid" });
    expect(values.has(FINANCIAL_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it("removes an incompatible storage version", () => {
    const { storage, values } = createMemoryStorage(
      JSON.stringify({ version: FINANCIAL_PROFILE_STORAGE_VERSION + 1, snapshot: PROFILE }),
    );

    expect(readFinancialProfileFromStorage(storage)).toEqual({ status: "invalid" });
    expect(values.has(FINANCIAL_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it("revalidates the snapshot through the domain and removes invalid financial data", () => {
    const invalidProfile: FinancialProfileSnapshot = {
      ...PROFILE,
      goals: [
        {
          ...PROFILE.goals[0]!,
          targetAmount: { currency: "USD", minorUnits: "100000000" },
        },
      ],
    };
    const { storage, values } = createMemoryStorage(
      JSON.stringify({ version: FINANCIAL_PROFILE_STORAGE_VERSION, snapshot: invalidProfile }),
    );

    expect(readFinancialProfileFromStorage(storage)).toEqual({ status: "invalid" });
    expect(values.has(FINANCIAL_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it("removes an explicitly persisted profile", () => {
    const { storage, values } = createMemoryStorage();
    expect(writeFinancialProfileToStorage(storage, PROFILE)).toBe(true);

    expect(removeFinancialProfileFromStorage(storage)).toBe(true);
    expect(values.has(FINANCIAL_PROFILE_STORAGE_KEY)).toBe(false);
  });

  it("degrades to unavailable when browser storage operations fail", () => {
    const storage: FinancialProfileStorage = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    };

    expect(readFinancialProfileFromStorage(storage)).toEqual({ status: "unavailable" });
    expect(writeFinancialProfileToStorage(storage, PROFILE)).toBe(false);
    expect(removeFinancialProfileFromStorage(storage)).toBe(false);
  });
});
