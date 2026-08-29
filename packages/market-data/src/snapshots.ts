import { AssetId, CurrencyCode } from "@portfolio-copilot/domain";

export type MarketDataCategory = "PRICE" | "FX" | "MACRO";
export type MarketDataQualityFlag = "STALE" | "CONFLICT";

export type MarketDataProvenanceInput = Readonly<{
  provider: string;
  sourceId?: string | null;
  sourceUrl?: string | null;
  rawIdentifier?: string | null;
  normalizationVersion: string;
}>;

export type MarketDataProvenance = Readonly<{
  provider: string;
  sourceId: string | null;
  sourceUrl: string | null;
  rawIdentifier: string | null;
  normalizationVersion: string;
}>;

export type PriceSnapshot = Readonly<{
  category: "PRICE";
  assetId: string;
  price: string;
  currency: string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenance;
  qualityFlags: readonly MarketDataQualityFlag[];
}>;

export type FxSnapshot = Readonly<{
  category: "FX";
  baseCurrency: string;
  quoteCurrency: string;
  rate: string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenance;
  qualityFlags: readonly MarketDataQualityFlag[];
}>;

export type MacroSnapshot = Readonly<{
  category: "MACRO";
  indicatorId: string;
  value: string;
  unit: string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenance;
  qualityFlags: readonly MarketDataQualityFlag[];
}>;

export type MaterialMarketDataSnapshot = PriceSnapshot | FxSnapshot | MacroSnapshot;

export type PriceSnapshotInput = Readonly<{
  assetId: AssetId | string;
  price: string;
  currency: CurrencyCode | string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenanceInput;
  qualityFlags?: readonly MarketDataQualityFlag[];
}>;

export type FxSnapshotInput = Readonly<{
  baseCurrency: CurrencyCode | string;
  quoteCurrency: CurrencyCode | string;
  rate: string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenanceInput;
  qualityFlags?: readonly MarketDataQualityFlag[];
}>;

export type MacroSnapshotInput = Readonly<{
  indicatorId: string;
  value: string;
  unit: string;
  asOf: string;
  retrievedAt: string;
  provenance: MarketDataProvenanceInput;
  qualityFlags?: readonly MarketDataQualityFlag[];
}>;

export class InvalidMarketDataSnapshotError extends Error {
  public constructor(
    public readonly field: string,
    public readonly value: unknown,
  ) {
    super(`Invalid market data snapshot field ${field}: ${JSON.stringify(value)}`);
    this.name = "InvalidMarketDataSnapshotError";
  }
}

const CANONICAL_UTC_INSTANT_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const PROVIDER_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,63}$/;
const NORMALIZATION_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const IDENTIFIER_PATTERN = /^[A-Z0-9][A-Z0-9._:-]{0,127}$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MAX_TEXT_LENGTH = 512;
const MAX_DECIMAL_LENGTH = 128;
const MAX_DECIMAL_SCALE = 18;

function normalizeInstant(field: string, value: string): string {
  const normalized = value.trim();
  const parsed = new Date(normalized);
  if (
    !CANONICAL_UTC_INSTANT_PATTERN.test(normalized) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== normalized
  ) {
    throw new InvalidMarketDataSnapshotError(field, value);
  }

  return normalized;
}

function normalizeOptionalText(field: string, value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > MAX_TEXT_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidMarketDataSnapshotError(field, value);
  }

  return normalized;
}

function normalizeProvider(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!PROVIDER_PATTERN.test(normalized)) {
    throw new InvalidMarketDataSnapshotError("provenance.provider", value);
  }

  return normalized;
}

function normalizeSourceUrl(value: string | null | undefined): string | null {
  const normalized = normalizeOptionalText("provenance.sourceUrl", value);
  if (normalized === null) return null;

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new InvalidMarketDataSnapshotError("provenance.sourceUrl", value);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new InvalidMarketDataSnapshotError("provenance.sourceUrl", value);
  }

  return parsed.toString();
}

function normalizeProvenance(input: MarketDataProvenanceInput): MarketDataProvenance {
  const normalizationVersion = input.normalizationVersion.trim();
  if (!NORMALIZATION_VERSION_PATTERN.test(normalizationVersion)) {
    throw new InvalidMarketDataSnapshotError(
      "provenance.normalizationVersion",
      input.normalizationVersion,
    );
  }

  return Object.freeze({
    provider: normalizeProvider(input.provider),
    sourceId: normalizeOptionalText("provenance.sourceId", input.sourceId),
    sourceUrl: normalizeSourceUrl(input.sourceUrl),
    rawIdentifier: normalizeOptionalText("provenance.rawIdentifier", input.rawIdentifier),
    normalizationVersion,
  });
}

function normalizeQualityFlags(
  flags: readonly MarketDataQualityFlag[] | undefined,
): readonly MarketDataQualityFlag[] {
  const normalized = new Set<MarketDataQualityFlag>();
  for (const flag of flags ?? []) {
    if (flag !== "STALE" && flag !== "CONFLICT") {
      throw new InvalidMarketDataSnapshotError("qualityFlags", flag);
    }
    normalized.add(flag);
  }

  return Object.freeze([...normalized].sort());
}

function normalizePositiveDecimal(field: string, value: string): string {
  const normalized = normalizeDecimal(field, value);
  const unsigned = normalized.startsWith("-") ? normalized.slice(1) : normalized;
  const significant = unsigned.replace(".", "").replace(/^0+/, "");
  if (normalized.startsWith("-") || significant.length === 0) {
    throw new InvalidMarketDataSnapshotError(field, value);
  }

  return normalized;
}

function normalizeDecimal(field: string, value: string): string {
  const trimmed = value.trim();
  if (
    trimmed.length === 0 ||
    trimmed.length > MAX_DECIMAL_LENGTH ||
    !/^-?\d+(?:\.\d+)?$/.test(trimmed)
  ) {
    throw new InvalidMarketDataSnapshotError(field, value);
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [integerPart = "0", fractionalPart = ""] = unsigned.split(".");
  if (fractionalPart.length > MAX_DECIMAL_SCALE) {
    throw new InvalidMarketDataSnapshotError(field, value);
  }

  const integer = integerPart.replace(/^0+(?=\d)/, "");
  const fraction = fractionalPart.replace(/0+$/, "");
  const magnitude = fraction.length > 0 ? `${integer}.${fraction}` : integer;

  if (negative && magnitude !== "0") return `-${magnitude}`;
  return magnitude;
}

function normalizeIndicatorId(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new InvalidMarketDataSnapshotError("indicatorId", value);
  }

  return normalized;
}

function normalizeUnit(value: string): string {
  const normalized = normalizeOptionalText("unit", value);
  if (normalized === null) {
    throw new InvalidMarketDataSnapshotError("unit", value);
  }

  return normalized;
}

function normalizeTimes(asOfInput: string, retrievedAtInput: string): Readonly<{
  asOf: string;
  retrievedAt: string;
}> {
  const asOf = normalizeInstant("asOf", asOfInput);
  const retrievedAt = normalizeInstant("retrievedAt", retrievedAtInput);
  if (retrievedAt < asOf) {
    throw new InvalidMarketDataSnapshotError("retrievedAt", retrievedAtInput);
  }

  return { asOf, retrievedAt };
}

export function createPriceSnapshot(input: PriceSnapshotInput): PriceSnapshot {
  const assetId = typeof input.assetId === "string" ? AssetId.from(input.assetId) : input.assetId;
  const currency =
    typeof input.currency === "string" ? CurrencyCode.from(input.currency) : input.currency;
  const times = normalizeTimes(input.asOf, input.retrievedAt);

  return Object.freeze({
    category: "PRICE",
    assetId: assetId.toString(),
    price: normalizePositiveDecimal("price", input.price),
    currency: currency.code,
    ...times,
    provenance: normalizeProvenance(input.provenance),
    qualityFlags: normalizeQualityFlags(input.qualityFlags),
  });
}

export function createFxSnapshot(input: FxSnapshotInput): FxSnapshot {
  const baseCurrency =
    typeof input.baseCurrency === "string" ? CurrencyCode.from(input.baseCurrency) : input.baseCurrency;
  const quoteCurrency =
    typeof input.quoteCurrency === "string"
      ? CurrencyCode.from(input.quoteCurrency)
      : input.quoteCurrency;
  if (baseCurrency.equals(quoteCurrency)) {
    throw new InvalidMarketDataSnapshotError("currencyPair", [baseCurrency.code, quoteCurrency.code]);
  }
  const times = normalizeTimes(input.asOf, input.retrievedAt);

  return Object.freeze({
    category: "FX",
    baseCurrency: baseCurrency.code,
    quoteCurrency: quoteCurrency.code,
    rate: normalizePositiveDecimal("rate", input.rate),
    ...times,
    provenance: normalizeProvenance(input.provenance),
    qualityFlags: normalizeQualityFlags(input.qualityFlags),
  });
}

export function createMacroSnapshot(input: MacroSnapshotInput): MacroSnapshot {
  const times = normalizeTimes(input.asOf, input.retrievedAt);

  return Object.freeze({
    category: "MACRO",
    indicatorId: normalizeIndicatorId(input.indicatorId),
    value: normalizeDecimal("value", input.value),
    unit: normalizeUnit(input.unit),
    ...times,
    provenance: normalizeProvenance(input.provenance),
    qualityFlags: normalizeQualityFlags(input.qualityFlags),
  });
}
