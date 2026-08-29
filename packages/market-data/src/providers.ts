import type { FxSnapshot, MacroSnapshot, MarketDataCategory, PriceSnapshot } from "./snapshots";

export type MarketDataMissingResult = Readonly<{
  status: "MISSING";
  provider: string;
  reason: string;
  qualityFlags: readonly ["MISSING"];
}>;

export type MarketDataProviderErrorResult = Readonly<{
  status: "PROVIDER_ERROR";
  provider: string;
  errorCode: string;
}>;

export type MarketDataFoundResult<T> = Readonly<{
  status: "FOUND";
  provider: string;
  snapshot: T;
}>;

export type MarketDataProviderResult<T> =
  MarketDataFoundResult<T> | MarketDataMissingResult | MarketDataProviderErrorResult;

export interface PriceProvider {
  readonly name: string;
  fetchPrice(assetId: string): Promise<MarketDataProviderResult<PriceSnapshot>>;
}

export interface FxProvider {
  readonly name: string;
  fetchFx(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<MarketDataProviderResult<FxSnapshot>>;
}

export interface MacroProvider {
  readonly name: string;
  fetchMacro(indicatorId: string): Promise<MarketDataProviderResult<MacroSnapshot>>;
}

export type MarketDataFallbackTrigger = "MISSING" | "PROVIDER_ERROR";

export type MarketDataFallbackPolicy = Readonly<{
  orderedProviders: readonly string[];
  fallbackOn: readonly MarketDataFallbackTrigger[];
}>;

export type MarketDataProviderAttempt = Readonly<{
  provider: string;
  status: "FOUND" | "MISSING" | "PROVIDER_ERROR";
}>;

export type MarketDataFallbackResult<T> = Readonly<{
  result: MarketDataProviderResult<T>;
  attempts: readonly MarketDataProviderAttempt[];
}>;

export type MarketDataTelemetryEvent = Readonly<{
  category: MarketDataCategory;
  provider: string;
  status: "FOUND" | "MISSING" | "PROVIDER_ERROR";
  attempt: number;
  durationMs: number;
}>;

export interface MarketDataObserver {
  record(event: MarketDataTelemetryEvent): void;
}

export type MarketDataFallbackOptions = Readonly<{
  category: MarketDataCategory;
  observer?: MarketDataObserver;
  now?: () => number;
}>;

export class InvalidMarketDataFallbackPolicyError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = "InvalidMarketDataFallbackPolicyError";
  }
}

function normalizeProviderName(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(normalized)) {
    throw new InvalidMarketDataFallbackPolicyError(
      `Invalid provider name: ${JSON.stringify(value)}`,
    );
  }

  return normalized;
}

function normalizePolicy(policy: MarketDataFallbackPolicy): MarketDataFallbackPolicy {
  if (policy.orderedProviders.length === 0) {
    throw new InvalidMarketDataFallbackPolicyError(
      "Fallback policy requires at least one provider.",
    );
  }

  const orderedProviders = policy.orderedProviders.map(normalizeProviderName);
  if (new Set(orderedProviders).size !== orderedProviders.length) {
    throw new InvalidMarketDataFallbackPolicyError(
      "Fallback provider order cannot contain duplicates.",
    );
  }

  const fallbackOn = [...new Set(policy.fallbackOn)].sort();
  for (const trigger of fallbackOn) {
    if (trigger !== "MISSING" && trigger !== "PROVIDER_ERROR") {
      throw new InvalidMarketDataFallbackPolicyError(`Invalid fallback trigger: ${trigger}`);
    }
  }

  return Object.freeze({
    orderedProviders: Object.freeze(orderedProviders),
    fallbackOn: Object.freeze(fallbackOn),
  });
}

function recordTelemetry(
  options: MarketDataFallbackOptions | undefined,
  event: MarketDataTelemetryEvent,
): void {
  if (options?.observer === undefined) return;

  try {
    options.observer.record(event);
  } catch {
    // Observability must never turn a successful data path into a product failure.
  }
}

export function missingMarketData(provider: string, reason: string): MarketDataMissingResult {
  const normalizedReason = reason.trim();
  if (normalizedReason.length === 0)
    throw new TypeError("Missing market data reason cannot be empty.");

  return Object.freeze({
    status: "MISSING",
    provider: normalizeProviderName(provider),
    reason: normalizedReason,
    qualityFlags: Object.freeze(["MISSING"] as const),
  });
}

export function providerError(provider: string, errorCode: string): MarketDataProviderErrorResult {
  const normalizedErrorCode = errorCode.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(normalizedErrorCode)) {
    throw new TypeError(`Invalid provider error code: ${JSON.stringify(errorCode)}`);
  }

  return Object.freeze({
    status: "PROVIDER_ERROR",
    provider: normalizeProviderName(provider),
    errorCode: normalizedErrorCode,
  });
}

export function foundMarketData<T>(provider: string, snapshot: T): MarketDataFoundResult<T> {
  return Object.freeze({
    status: "FOUND",
    provider: normalizeProviderName(provider),
    snapshot,
  });
}

export async function fetchWithExplicitFallback<TProvider extends { readonly name: string }, T>(
  providers: readonly TProvider[],
  policyInput: MarketDataFallbackPolicy,
  fetcher: (provider: TProvider) => Promise<MarketDataProviderResult<T>>,
  options?: MarketDataFallbackOptions,
): Promise<MarketDataFallbackResult<T>> {
  const policy = normalizePolicy(policyInput);
  const providerEntries = providers.map(
    (provider) => [normalizeProviderName(provider.name), provider] as const,
  );
  if (
    new Set(providerEntries.map(([providerName]) => providerName)).size !== providerEntries.length
  ) {
    throw new InvalidMarketDataFallbackPolicyError(
      "Available providers cannot contain duplicate normalized names.",
    );
  }

  const providersByName = new Map(providerEntries);
  const attempts: MarketDataProviderAttempt[] = [];
  const now = options?.now ?? Date.now;
  let lastResult: MarketDataProviderResult<T> | null = null;

  for (const providerName of policy.orderedProviders) {
    const provider = providersByName.get(providerName);
    if (provider === undefined) {
      throw new InvalidMarketDataFallbackPolicyError(
        `Fallback policy references unavailable provider ${providerName}.`,
      );
    }

    const startedAt = now();
    const result = await fetcher(provider);
    const finishedAt = now();
    const resultProvider = normalizeProviderName(result.provider);
    if (resultProvider !== providerName) {
      throw new InvalidMarketDataFallbackPolicyError(
        `Provider ${providerName} returned result attributed to ${resultProvider}.`,
      );
    }

    attempts.push(Object.freeze({ provider: providerName, status: result.status }));
    lastResult = result;
    if (options !== undefined) {
      recordTelemetry(
        options,
        Object.freeze({
          category: options.category,
          provider: providerName,
          status: result.status,
          attempt: attempts.length,
          durationMs: Math.max(0, finishedAt - startedAt),
        }),
      );
    }

    if (result.status === "FOUND") break;
    if (!policy.fallbackOn.includes(result.status)) break;
  }

  if (lastResult === null) {
    throw new InvalidMarketDataFallbackPolicyError("Fallback policy executed no provider.");
  }

  return Object.freeze({ result: lastResult, attempts: Object.freeze(attempts) });
}
