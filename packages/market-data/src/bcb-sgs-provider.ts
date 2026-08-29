import { CurrencyCode } from "@portfolio-copilot/domain";

import {
  foundMarketData,
  missingMarketData,
  providerError,
  type FxProvider,
  type MacroProvider,
  type MarketDataProviderResult,
} from "./providers";
import {
  createFxSnapshot,
  createMacroSnapshot,
  type FxSnapshot,
  type MacroSnapshot,
} from "./snapshots";

export const BCB_SGS_PROVIDER_NAME = "BCB_SGS";
export const BCB_SGS_BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

export const BCB_SGS_SELIC_TARGET = Object.freeze({
  indicatorId: "BCB:SELIC_TARGET",
  seriesCode: 432,
  unit: "percent-per-year",
});

export const BCB_SGS_USD_BRL_SALE = Object.freeze({
  baseCurrency: "USD",
  quoteCurrency: "BRL",
  seriesCode: 1,
});

export type BcbSgsMacroSeriesDefinition = Readonly<{
  indicatorId: string;
  seriesCode: number;
  unit: string;
}>;

export type BcbSgsFxSeriesDefinition = Readonly<{
  baseCurrency: string;
  quoteCurrency: string;
  seriesCode: number;
}>;

export type MarketDataHttpResponse = Readonly<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export type MarketDataHttpClient = (url: string) => Promise<MarketDataHttpResponse>;

const BCB_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const NORMALIZATION_VERSION = "bcb-sgs-v1";

function validateSeriesCode(seriesCode: number): number {
  if (!Number.isSafeInteger(seriesCode) || seriesCode <= 0) {
    throw new TypeError(`Invalid BCB SGS series code: ${seriesCode}`);
  }

  return seriesCode;
}

function normalizeIndicatorId(indicatorId: string): string {
  const normalized = indicatorId.trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._:-]{0,127}$/.test(normalized)) {
    throw new TypeError(`Invalid BCB SGS indicator id: ${JSON.stringify(indicatorId)}`);
  }

  return normalized;
}

function normalizeUnit(unit: string): string {
  const normalized = unit.trim();
  if (normalized.length === 0) throw new TypeError("BCB SGS unit cannot be empty.");
  return normalized;
}

function bcbSgsLatestUrl(seriesCode: number): string {
  return `${BCB_SGS_BASE_URL}.${validateSeriesCode(seriesCode)}/dados/ultimos/1?formato=json`;
}

function bcbReferenceDateToInstant(value: string): string | null {
  const match = BCB_DATE_PATTERN.exec(value.trim());
  if (match === null) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString();
}

function readBcbObservation(payload: unknown): Readonly<{ data: string; valor: string }> | null {
  if (!Array.isArray(payload) || payload.length === 0) return null;
  if (payload.length !== 1) return null;

  const item = payload[0];
  if (typeof item !== "object" || item === null) return null;
  const data = Reflect.get(item, "data");
  const valor = Reflect.get(item, "valor");
  if (typeof data !== "string" || typeof valor !== "string") return null;

  return Object.freeze({ data, valor });
}

async function defaultHttpClient(url: string): Promise<MarketDataHttpResponse> {
  return fetch(url, { headers: { accept: "application/json" } });
}

async function fetchObservation(
  seriesCode: number,
  client: MarketDataHttpClient,
): Promise<
  | Readonly<{ status: "FOUND"; asOf: string; value: string; sourceUrl: string }>
  | Readonly<{ status: "MISSING" }>
  | Readonly<{ status: "PROVIDER_ERROR"; errorCode: string }>
> {
  const sourceUrl = bcbSgsLatestUrl(seriesCode);
  let response: MarketDataHttpResponse;
  try {
    response = await client(sourceUrl);
  } catch {
    return { status: "PROVIDER_ERROR", errorCode: "NETWORK_ERROR" };
  }

  if (!response.ok) {
    return { status: "PROVIDER_ERROR", errorCode: `HTTP_${response.status}` };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return { status: "PROVIDER_ERROR", errorCode: "INVALID_JSON" };
  }

  if (Array.isArray(payload) && payload.length === 0) return { status: "MISSING" };

  const observation = readBcbObservation(payload);
  if (observation === null) {
    return { status: "PROVIDER_ERROR", errorCode: "INVALID_RESPONSE" };
  }

  const asOf = bcbReferenceDateToInstant(observation.data);
  if (asOf === null) {
    return { status: "PROVIDER_ERROR", errorCode: "INVALID_RESPONSE" };
  }

  return { status: "FOUND", asOf, value: observation.valor, sourceUrl };
}

export class BcbSgsMacroProvider implements MacroProvider {
  public readonly name = BCB_SGS_PROVIDER_NAME;
  private readonly definitions: ReadonlyMap<string, BcbSgsMacroSeriesDefinition>;

  public constructor(
    definitions: readonly BcbSgsMacroSeriesDefinition[] = [BCB_SGS_SELIC_TARGET],
    private readonly client: MarketDataHttpClient = defaultHttpClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    const entries = definitions.map((definition) => {
      const indicatorId = normalizeIndicatorId(definition.indicatorId);
      return [
        indicatorId,
        Object.freeze({
          indicatorId,
          seriesCode: validateSeriesCode(definition.seriesCode),
          unit: normalizeUnit(definition.unit),
        }),
      ] as const;
    });
    if (new Set(entries.map(([indicatorId]) => indicatorId)).size !== entries.length) {
      throw new TypeError("BCB SGS macro definitions cannot contain duplicate indicator ids.");
    }
    this.definitions = new Map(entries);
  }

  public async fetchMacro(indicatorId: string): Promise<MarketDataProviderResult<MacroSnapshot>> {
    const normalizedIndicatorId = normalizeIndicatorId(indicatorId);
    const definition = this.definitions.get(normalizedIndicatorId);
    if (definition === undefined) {
      return missingMarketData(this.name, `Unsupported BCB SGS indicator ${normalizedIndicatorId}.`);
    }

    const result = await fetchObservation(definition.seriesCode, this.client);
    if (result.status === "MISSING") {
      return missingMarketData(this.name, `BCB SGS series ${definition.seriesCode} returned no observation.`);
    }
    if (result.status === "PROVIDER_ERROR") return providerError(this.name, result.errorCode);

    try {
      return foundMarketData(
        this.name,
        createMacroSnapshot({
          indicatorId: definition.indicatorId,
          value: result.value,
          unit: definition.unit,
          asOf: result.asOf,
          retrievedAt: this.now().toISOString(),
          provenance: {
            provider: this.name,
            sourceId: `SGS:${definition.seriesCode}`,
            sourceUrl: result.sourceUrl,
            rawIdentifier: definition.indicatorId,
            normalizationVersion: NORMALIZATION_VERSION,
          },
        }),
      );
    } catch {
      return providerError(this.name, "INVALID_RESPONSE");
    }
  }
}

export class BcbSgsFxProvider implements FxProvider {
  public readonly name = BCB_SGS_PROVIDER_NAME;
  private readonly definitions: ReadonlyMap<string, BcbSgsFxSeriesDefinition>;

  public constructor(
    definitions: readonly BcbSgsFxSeriesDefinition[] = [BCB_SGS_USD_BRL_SALE],
    private readonly client: MarketDataHttpClient = defaultHttpClient,
    private readonly now: () => Date = () => new Date(),
  ) {
    const entries = definitions.map((definition) => {
      const baseCurrency = CurrencyCode.from(definition.baseCurrency).code;
      const quoteCurrency = CurrencyCode.from(definition.quoteCurrency).code;
      if (baseCurrency === quoteCurrency) throw new TypeError("BCB SGS FX pair currencies must differ.");
      const key = `${baseCurrency}/${quoteCurrency}`;
      return [
        key,
        Object.freeze({
          baseCurrency,
          quoteCurrency,
          seriesCode: validateSeriesCode(definition.seriesCode),
        }),
      ] as const;
    });
    if (new Set(entries.map(([key]) => key)).size !== entries.length) {
      throw new TypeError("BCB SGS FX definitions cannot contain duplicate currency pairs.");
    }
    this.definitions = new Map(entries);
  }

  public async fetchFx(
    baseCurrencyInput: string,
    quoteCurrencyInput: string,
  ): Promise<MarketDataProviderResult<FxSnapshot>> {
    const baseCurrency = CurrencyCode.from(baseCurrencyInput).code;
    const quoteCurrency = CurrencyCode.from(quoteCurrencyInput).code;
    const key = `${baseCurrency}/${quoteCurrency}`;
    const definition = this.definitions.get(key);
    if (definition === undefined) {
      return missingMarketData(this.name, `Unsupported BCB SGS FX pair ${key}.`);
    }

    const result = await fetchObservation(definition.seriesCode, this.client);
    if (result.status === "MISSING") {
      return missingMarketData(this.name, `BCB SGS series ${definition.seriesCode} returned no observation.`);
    }
    if (result.status === "PROVIDER_ERROR") return providerError(this.name, result.errorCode);

    try {
      return foundMarketData(
        this.name,
        createFxSnapshot({
          baseCurrency,
          quoteCurrency,
          rate: result.value,
          asOf: result.asOf,
          retrievedAt: this.now().toISOString(),
          provenance: {
            provider: this.name,
            sourceId: `SGS:${definition.seriesCode}`,
            sourceUrl: result.sourceUrl,
            rawIdentifier: key,
            normalizationVersion: NORMALIZATION_VERSION,
          },
        }),
      );
    } catch {
      return providerError(this.name, "INVALID_RESPONSE");
    }
  }
}
