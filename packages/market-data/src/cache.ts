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

export class InMemoryMarketDataCache<T> {
  private readonly entries = new Map<string, MarketDataCacheEntry<T>>();

  public constructor(private readonly now: () => number = Date.now) {}

  public get(key: string): T | null {
    const entry = this.entries.get(key);
    if (entry === undefined) return null;

    if (entry.expiresAtMs <= this.now()) {
      this.entries.delete(key);
      return null;
    }

    return entry.value;
  }

  public set(key: string, value: T, ttlMs: number): void {
    const normalizedKey = key.trim();
    if (normalizedKey.length === 0) throw new TypeError("Market data cache key cannot be empty.");

    this.entries.set(normalizedKey, Object.freeze({ value, expiresAtMs: this.now() + validateTtlMs(ttlMs) }));
  }

  public invalidate(key: string): boolean {
    return this.entries.delete(key.trim());
  }

  public clear(): void {
    this.entries.clear();
  }

  public size(): number {
    return this.entries.size;
  }
}
