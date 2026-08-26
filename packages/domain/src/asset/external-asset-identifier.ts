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
const MARKET_SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9._-]{0,31}$/;
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/;

function normalizeScope(scope: string): string {
  const normalized = scope.trim().toUpperCase();

  if (!SCOPE_PATTERN.test(normalized)) {
    throw new InvalidExternalAssetIdentifierError("scope", scope);
  }

  return normalized;
}

function normalizeProviderValue(value: string): string {
  const normalized = value.trim();

  if (normalized.length === 0 || normalized.length > 128 || /[\u0000-\u001f\u007f]/.test(normalized)) {
    throw new InvalidExternalAssetIdentifierError("value", value);
  }

  return normalized;
}

export class ExternalAssetIdentifier {
  private constructor(
    public readonly kind: ExternalAssetIdentifierKind,
    public readonly scope: string,
    public readonly value: string,
  ) {}

  public static marketSymbol(market: string, symbol: string): ExternalAssetIdentifier {
    const normalizedSymbol = symbol.trim().toUpperCase();

    if (!MARKET_SYMBOL_PATTERN.test(normalizedSymbol)) {
      throw new InvalidExternalAssetIdentifierError("marketSymbol", symbol);
    }

    return new ExternalAssetIdentifier("MARKET_SYMBOL", normalizeScope(market), normalizedSymbol);
  }

  public static isin(value: string): ExternalAssetIdentifier {
    const normalized = value.trim().toUpperCase();

    if (!ISIN_PATTERN.test(normalized)) {
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
