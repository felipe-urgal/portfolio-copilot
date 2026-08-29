export type MarketDataCacheEntry<T> = Readonly<{
  value: T;
  expiresAtMs: number;
}>;

export class InvalidMarketDataCacheTtlError extends Error {
  public constructor(value: number) {
    super(`Invalid market data cache TTL: ${value}`);
    this.name = "InvalidMarketDataCacheTtlError";
  }
}

function validateTtlMs(ttlMs: number): number {
  if (!Number.isSafeInteger(ttlMs) || ttlMs <= 0) {
    throw new InvalidMarketDataCacheTtlError(ttlMs);
  }

  return ttlMs;
}

function normalizeCacheKey(key: string): string {
  const normalized = key.trim();
  if (normalized.length === 0) throw new TypeError("Market data cache key cannot be empty.");
  return normalized;
}

export class InMemoryMarketDataCache<T> {
  private readonly entries = new Map<string, MarketDataCacheEntry<T>>();

  public constructor(private readonly now: () => number = Date.now) {}

  public get(key: string): T | null {
    const normalizedKey = normalizeCacheKey(key);
    const entry = this.entries.get(normalizedKey);
    if (entry === undefined) return null;

    if (entry.expiresAtMs <= this.now()) {
      this.entries.delete(normalizedKey);
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: T, ttlMs: number): void {
    const normalizedKey = normalizeCacheKey(key);
    const currentTime = this.now();
    const expiresAtMs = currentTime + validateTtlMs(ttlMs);
    if (!Number.isSafeInteger(currentTime) || !Number.isSafeInteger(expiresAtMs)) {
      throw new TypeError("Market data cache clock must return a safe integer timestamp.");
    }

    this.entries.set(normalizedKey, Object.freeze({ value, expiresAtMs }));
  }

  public invalidate(key: string): boolean {
    return this.entries.delete(normalizeCacheKey(key));
  }

  public clear(): void {
    this.entries.clear();
  }

  public size(): number {
    return this.entries.size;
  }
}
