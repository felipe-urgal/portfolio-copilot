"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import {
  getBrowserFinancialProfileStorage,
  readFinancialProfileFromStorage,
  removeFinancialProfileFromStorage,
  writeFinancialProfileToStorage,
} from "@/lib/financial-profile-storage";

export type FinancialSessionState = Readonly<{
  financialProfile: FinancialProfileSnapshot | null;
}>;

export type FinancialSessionAction =
  | Readonly<{
      type: "publish-financial-profile";
      snapshot: FinancialProfileSnapshot;
    }>
  | Readonly<{ type: "clear-financial-profile" }>;

export type FinancialProfilePersistenceStatus = "memory-only" | "persisted" | "unavailable";

export type FinancialSessionContextValue = Readonly<{
  financialProfile: FinancialProfileSnapshot | null;
  persistenceStatus: FinancialProfilePersistenceStatus;
  publishFinancialProfile: (snapshot: FinancialProfileSnapshot) => void;
  persistFinancialProfile: () => boolean;
  removePersistedFinancialProfile: () => boolean;
  clearFinancialProfile: () => void;
}>;

type FinancialSessionProviderProps = Readonly<{
  children: ReactNode;
  initialFinancialProfile?: FinancialProfileSnapshot | null;
  initialPersistenceStatus?: FinancialProfilePersistenceStatus;
}>;

const FinancialSessionContext = createContext<FinancialSessionContextValue | null>(null);

export function financialSessionReducer(
  state: FinancialSessionState,
  action: FinancialSessionAction,
): FinancialSessionState {
  switch (action.type) {
    case "publish-financial-profile":
      return { financialProfile: action.snapshot };
    case "clear-financial-profile":
      return state.financialProfile === null ? state : { financialProfile: null };
  }
}

export function FinancialSessionProvider({
  children,
  initialFinancialProfile = null,
  initialPersistenceStatus = "memory-only",
}: FinancialSessionProviderProps) {
  const [state, dispatch] = useReducer(financialSessionReducer, {
    financialProfile: initialFinancialProfile,
  });
  const [persistenceStatus, setPersistenceStatus] =
    useState<FinancialProfilePersistenceStatus>(initialPersistenceStatus);

  useEffect(() => {
    if (initialFinancialProfile !== null) return;

    let active = true;

    queueMicrotask(() => {
      if (!active) return;

      const storage = getBrowserFinancialProfileStorage();
      if (storage === null) {
        setPersistenceStatus("unavailable");
        return;
      }

      const result = readFinancialProfileFromStorage(storage);
      if (!active) return;

      if (result.status === "loaded") {
        dispatch({ type: "publish-financial-profile", snapshot: result.snapshot });
        setPersistenceStatus("persisted");
        return;
      }

      setPersistenceStatus(result.status === "unavailable" ? "unavailable" : "memory-only");
    });

    return () => {
      active = false;
    };
  }, [initialFinancialProfile]);

  const publishFinancialProfile = useCallback((snapshot: FinancialProfileSnapshot) => {
    const storage = getBrowserFinancialProfileStorage();

    if (storage === null) {
      setPersistenceStatus("unavailable");
    } else {
      const removed = removeFinancialProfileFromStorage(storage);
      setPersistenceStatus(removed ? "memory-only" : "unavailable");
    }

    dispatch({ type: "publish-financial-profile", snapshot });
  }, []);

  const persistFinancialProfile = useCallback((): boolean => {
    if (state.financialProfile === null) return false;

    const storage = getBrowserFinancialProfileStorage();
    if (storage === null) {
      setPersistenceStatus("unavailable");
      return false;
    }

    const persisted = writeFinancialProfileToStorage(storage, state.financialProfile);
    setPersistenceStatus(persisted ? "persisted" : "unavailable");
    return persisted;
  }, [state.financialProfile]);

  const removePersistedFinancialProfile = useCallback((): boolean => {
    const storage = getBrowserFinancialProfileStorage();
    if (storage === null) {
      setPersistenceStatus("unavailable");
      return false;
    }

    const removed = removeFinancialProfileFromStorage(storage);
    setPersistenceStatus(removed ? "memory-only" : "unavailable");
    return removed;
  }, []);

  const clearFinancialProfile = useCallback(() => {
    const storage = getBrowserFinancialProfileStorage();

    if (storage === null) {
      setPersistenceStatus("unavailable");
    } else {
      const removed = removeFinancialProfileFromStorage(storage);
      setPersistenceStatus(removed ? "memory-only" : "unavailable");
    }

    dispatch({ type: "clear-financial-profile" });
  }, []);

  const value = useMemo<FinancialSessionContextValue>(
    () => ({
      financialProfile: state.financialProfile,
      persistenceStatus,
      publishFinancialProfile,
      persistFinancialProfile,
      removePersistedFinancialProfile,
      clearFinancialProfile,
    }),
    [
      clearFinancialProfile,
      persistFinancialProfile,
      persistenceStatus,
      publishFinancialProfile,
      removePersistedFinancialProfile,
      state.financialProfile,
    ],
  );

  return (
    <FinancialSessionContext.Provider value={value}>{children}</FinancialSessionContext.Provider>
  );
}

export function useFinancialSession(): FinancialSessionContextValue {
  const context = useContext(FinancialSessionContext);

  if (context === null) {
    throw new Error("useFinancialSession must be used within FinancialSessionProvider");
  }

  return context;
}
