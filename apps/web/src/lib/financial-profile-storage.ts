import { FinancialProfile, type FinancialProfileSnapshot } from "@portfolio-copilot/domain";

export const FINANCIAL_PROFILE_STORAGE_KEY = "portfolio-copilot.financial-profile";
export const FINANCIAL_PROFILE_STORAGE_VERSION = 1;

export type FinancialProfileStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type FinancialProfileStorageReadResult =
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "loaded"; snapshot: FinancialProfileSnapshot }>
  | Readonly<{ status: "invalid" }>
  | Readonly<{ status: "unavailable" }>;

type FinancialProfileStorageEnvelope = Readonly<{
  version: typeof FINANCIAL_PROFILE_STORAGE_VERSION;
  snapshot: FinancialProfileSnapshot;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredSnapshot(raw: string): FinancialProfileSnapshot | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isRecord(parsed) || parsed.version !== FINANCIAL_PROFILE_STORAGE_VERSION) return null;
    if (!("snapshot" in parsed)) return null;

    return FinancialProfile.fromSnapshot(parsed.snapshot as FinancialProfileSnapshot).toSnapshot();
  } catch {
    return null;
  }
}

function removeInvalidValue(storage: FinancialProfileStorage): FinancialProfileStorageReadResult {
  try {
    storage.removeItem(FINANCIAL_PROFILE_STORAGE_KEY);
    return { status: "invalid" };
  } catch {
    return { status: "unavailable" };
  }
}

export function readFinancialProfileFromStorage(
  storage: FinancialProfileStorage,
): FinancialProfileStorageReadResult {
  let raw: string | null;

  try {
    raw = storage.getItem(FINANCIAL_PROFILE_STORAGE_KEY);
  } catch {
    return { status: "unavailable" };
  }

  if (raw === null) return { status: "empty" };

  const snapshot = parseStoredSnapshot(raw);
  if (snapshot === null) return removeInvalidValue(storage);

  return { status: "loaded", snapshot };
}

export function writeFinancialProfileToStorage(
  storage: FinancialProfileStorage,
  snapshot: FinancialProfileSnapshot,
): boolean {
  try {
    const validatedSnapshot = FinancialProfile.fromSnapshot(snapshot).toSnapshot();
    const envelope: FinancialProfileStorageEnvelope = {
      version: FINANCIAL_PROFILE_STORAGE_VERSION,
      snapshot: validatedSnapshot,
    };

    storage.setItem(FINANCIAL_PROFILE_STORAGE_KEY, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeFinancialProfileFromStorage(storage: FinancialProfileStorage): boolean {
  try {
    storage.removeItem(FINANCIAL_PROFILE_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function getBrowserFinancialProfileStorage(): FinancialProfileStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
