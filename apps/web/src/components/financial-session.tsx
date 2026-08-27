"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

export type FinancialSessionState = Readonly<{
  financialProfile: FinancialProfileSnapshot | null;
}>;

export type FinancialSessionAction =
  | Readonly<{
      type: "publish-financial-profile";
      snapshot: FinancialProfileSnapshot;
    }>
  | Readonly<{ type: "clear-financial-profile" }>;

export type FinancialSessionContextValue = Readonly<{
  financialProfile: FinancialProfileSnapshot | null;
  publishFinancialProfile: (snapshot: FinancialProfileSnapshot) => void;
  clearFinancialProfile: () => void;
}>;

type FinancialSessionProviderProps = Readonly<{
  children: ReactNode;
  initialFinancialProfile?: FinancialProfileSnapshot | null;
}>;

const FinancialSessionContext =
  createContext<FinancialSessionContextValue | null>(null);

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
}: FinancialSessionProviderProps) {
  const [state, dispatch] = useReducer(financialSessionReducer, {
    financialProfile: initialFinancialProfile,
  });

  const publishFinancialProfile = useCallback(
    (snapshot: FinancialProfileSnapshot) => {
      dispatch({ type: "publish-financial-profile", snapshot });
    },
    [],
  );

  const clearFinancialProfile = useCallback(() => {
    dispatch({ type: "clear-financial-profile" });
  }, []);

  const value = useMemo<FinancialSessionContextValue>(
    () => ({
      financialProfile: state.financialProfile,
      publishFinancialProfile,
      clearFinancialProfile,
    }),
    [clearFinancialProfile, publishFinancialProfile, state.financialProfile],
  );

  return (
    <FinancialSessionContext.Provider value={value}>
      {children}
    </FinancialSessionContext.Provider>
  );
}

export function useFinancialSession(): FinancialSessionContextValue {
  const context = useContext(FinancialSessionContext);

  if (context === null) {
    throw new Error(
      "useFinancialSession must be used within FinancialSessionProvider",
    );
  }

  return context;
}
