import type {
  MarketDataCategory,
  MarketDataQualityFlag,
  MaterialMarketDataSnapshot,
} from "./snapshots";

export type MarketDataFreshnessConfig = Readonly<Record<MarketDataCategory, number>>;

export type MarketDataFreshness = Readonly<{
  status: "FRESH" | "STALE" | "FUTURE";
  ageMs: number;
  maxAgeMs: number;
}>;

export class InvalidMarketDataFreshnessPolicyError extends Error {
  public constructor(category: MarketDataCategory, value: number) {
    super(`Invalid freshness max age for ${category}: ${value}`);
    this.name = "InvalidMarketDataFreshnessPolicyError";
  }
}

function validateMaxAge(category: MarketDataCategory, value: number): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new InvalidMarketDataFreshnessPolicyError(category, value);
  }

  return value;
}

export class MarketDataFreshnessPolicy {
  private readonly maxAgeMs: MarketDataFreshnessConfig;

  private constructor(config: MarketDataFreshnessConfig) {
    this.maxAgeMs = Object.freeze({
      PRICE: validateMaxAge("PRICE", config.PRICE),
      FX: validateMaxAge("FX", config.FX),
      MACRO: validateMaxAge("MACRO", config.MACRO),
    });
  }

  public static create(config: MarketDataFreshnessConfig): MarketDataFreshnessPolicy {
    return new MarketDataFreshnessPolicy(config);
  }

  public maxAgeFor(category: MarketDataCategory): number {
    return this.maxAgeMs[category];
  }

  public evaluate(
    snapshot: MaterialMarketDataSnapshot,
    now: string | Date = new Date(),
  ): MarketDataFreshness {
    const nowMs = typeof now === "string" ? Date.parse(now) : now.getTime();
    if (!Number.isFinite(nowMs)) throw new TypeError("Invalid freshness reference time.");

    const asOfMs = Date.parse(snapshot.asOf);
    const ageMs = nowMs - asOfMs;
    const maxAgeMs = this.maxAgeFor(snapshot.category);

    return Object.freeze({
      status: ageMs < 0 ? "FUTURE" : ageMs <= maxAgeMs ? "FRESH" : "STALE",
      ageMs,
      maxAgeMs,
    });
  }

  public flagsFor(
    snapshot: MaterialMarketDataSnapshot,
    now: string | Date = new Date(),
  ): readonly MarketDataQualityFlag[] {
    const flags = new Set(snapshot.qualityFlags);
    const freshness = this.evaluate(snapshot, now);
    if (freshness.status === "STALE") flags.add("STALE");
    if (freshness.status === "FUTURE") flags.add("CONFLICT");

    return Object.freeze([...flags].sort());
  }
}
