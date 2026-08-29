import { InvalidExternalAssetIdentifierError } from "./errors";

export type ExternalAssetIdentifierKind = "MARKET_SYMBOL" | "ISIN" | "PROVIDER_ID";

export type ExternalAssetIdentifierSnapshot =
  | Readonly<{
      kind: "MARKET_SYMBOL";
      scope: string;
      value: string;
    }>
  | Readonly<{
      kind: "ISIN";
      scope: "GLOBAL";
      value: string;
    }>
  | Readonly<{
      kind: "PROVIDER_ID";
      scope: string;
      value: string;
    }>;

const SCOPE_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,31}$/;
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const MARKET_SYMBOL_MAX_LENGTH = 64;
const PROVIDER_VALUE_MAX_LENGTH = 128;

function normalizeScope(scope: string): string {
  const normalized = scope.trim().toUpperCase();

  if (!SCOPE_PATTERN.test(normalized)) {
    throw new InvalidExternalAssetIdentifierError("scope", scope);
  }

  return normalized;
}

function normalizeMarketSymbol(symbol: string): string {
  const normalized = symbol.trim().toUpperCase();

  if (
    normalized.length === 0 ||
    normalized.length > MARKET_SYMBOL_MAX_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized) ||
    /\s/.test(normalized)
  ) {
    throw new InvalidExternalAssetIdentifierError("marketSymbol", symbol);
  }

  return normalized;
}

function normalizeProviderValue(value: string): string {
  const normalized = value.trim();

  if (
    normalized.length === 0 ||
    normalized.length > PROVIDER_VALUE_MAX_LENGTH ||
    CONTROL_CHARACTER_PATTERN.test(normalized)
  ) {
    throw new InvalidExternalAssetIdentifierError("value", value);
  }

  return normalized;
}

function hasValidIsinChecksum(value: string): boolean {
  let expanded = "";

  for (const character of value) {
    expanded +=
      character >= "0" && character <= "9"
        ? character
        : String(character.charCodeAt(0) - "A".charCodeAt(0) + 10);
  }

  let sum = 0;
  const doubleParity = expanded.length % 2;

  for (let index = 0; index < expanded.length; index += 1) {
    let digit = Number(expanded[index]);

    if (index % 2 === doubleParity) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

export class ExternalAssetIdentifier {
  private constructor(
    public readonly kind: ExternalAssetIdentifierKind,
    public readonly scope: string,
    public readonly value: string,
  ) {}

  public static marketSymbol(market: string, symbol: string): ExternalAssetIdentifier {
    return new ExternalAssetIdentifier(
      "MARKET_SYMBOL",
      normalizeScope(market),
      normalizeMarketSymbol(symbol),
    );
  }

  public static isin(value: string): ExternalAssetIdentifier {
    const normalized = value.trim().toUpperCase();

    if (!ISIN_PATTERN.test(normalized) || !hasValidIsinChecksum(normalized)) {
      throw new InvalidExternalAssetIdentifierError("isin", value);
    }

    return new ExternalAssetIdentifier("ISIN", "GLOBAL", normalized);
  }

  public static providerId(provider: string, value: string): ExternalAssetIdentifier {
    return new ExternalAssetIdentifier(
      "PROVIDER_ID",
      normalizeScope(provider),
      normalizeProviderValue(value),
    );
  }

  public key(): string {
    return `${this.kind}:${this.scope}:${this.value}`;
  }

  public equals(other: ExternalAssetIdentifier): boolean {
    return this.key() === other.key();
  }

  public toSnapshot(): ExternalAssetIdentifierSnapshot {
    if (this.kind === "ISIN") {
      return { kind: "ISIN", scope: "GLOBAL", value: this.value };
    }

    return { kind: this.kind, scope: this.scope, value: this.value };
  }
}
