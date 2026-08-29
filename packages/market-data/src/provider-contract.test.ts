import { describe, expect, it } from "vitest";

import {
  BCB_SGS_BASE_URL,
  BcbSgsFxProvider,
  BcbSgsMacroProvider,
  createPriceSnapshot,
  fetchWithExplicitFallback,
  InMemoryPriceProvider,
  missingMarketData,
  type MarketDataHttpClient,
  type MarketDataObserver,
  type MarketDataProviderResult,
} from "./index";

const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const RETRIEVED_AT = new Date("2026-08-29T12:00:00.000Z");

function jsonClient(payload: unknown, status = 200): MarketDataHttpClient {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload;
    },
  });
}

function expectProviderAttribution<T>(
  result: MarketDataProviderResult<T>,
  expectedProvider: string,
): void {
  expect(result.provider).toBe(expectedProvider);
  expect(["FOUND", "MISSING", "PROVIDER_ERROR"]).toContain(result.status);
}

describe("PriceProvider contract", () => {
  it("returns canonical found and missing results without throwing for absence", async () => {
    const snapshot = createPriceSnapshot({
      assetId: ASSET_ID,
      price: "42.501234",
      currency: "BRL",
      asOf: "2026-08-29T00:00:00.000Z",
      retrievedAt: RETRIEVED_AT.toISOString(),
      provenance: {
        provider: "fixture_prices",
        sourceId: "fixture:1",
        normalizationVersion: "fixture-v1",
      },
    });
    const provider = new InMemoryPriceProvider("fixture_prices", [snapshot]);

    const found = await provider.fetchPrice(ASSET_ID);
    expectProviderAttribution(found, "FIXTURE_PRICES");
    expect(found).toEqual({ status: "FOUND", provider: "FIXTURE_PRICES", snapshot });

    const missing = await provider.fetchPrice("550e8400-e29b-41d4-a716-446655440001");
    expectProviderAttribution(missing, "FIXTURE_PRICES");
    expect(missing).toMatchObject({
      status: "MISSING",
      provider: "FIXTURE_PRICES",
      qualityFlags: ["MISSING"],
    });
  });
});

describe("BCB SGS MacroProvider contract", () => {
  it("maps the official SGS 432 response to a provenance-rich Selic snapshot", async () => {
    let requestedUrl = "";
    const client: MarketDataHttpClient = async (url) => {
      requestedUrl = url;
      return jsonClient([{ data: "29/08/2026", valor: "14.25" }])(url);
    };
    const provider = new BcbSgsMacroProvider(undefined, client, () => RETRIEVED_AT);

    const result = await provider.fetchMacro("bcb:selic_target");

    expect(requestedUrl).toBe(`${BCB_SGS_BASE_URL}.432/dados/ultimos/1?formato=json`);
    expectProviderAttribution(result, "BCB_SGS");
    expect(result).toEqual({
      status: "FOUND",
      provider: "BCB_SGS",
      snapshot: {
        category: "MACRO",
        indicatorId: "BCB:SELIC_TARGET",
        value: "14.25",
        unit: "percent-per-year",
        asOf: "2026-08-29T00:00:00.000Z",
        retrievedAt: "2026-08-29T12:00:00.000Z",
        provenance: {
          provider: "BCB_SGS",
          sourceId: "SGS:432",
          sourceUrl: `${BCB_SGS_BASE_URL}.432/dados/ultimos/1?formato=json`,
          rawIdentifier: "BCB:SELIC_TARGET",
          normalizationVersion: "bcb-sgs-v1",
        },
        qualityFlags: [],
      },
    });
  });

  it("degrades malformed or unavailable upstream responses explicitly", async () => {
    const malformed = new BcbSgsMacroProvider(undefined, jsonClient({ unexpected: true }), () => RETRIEVED_AT);
    await expect(malformed.fetchMacro("BCB:SELIC_TARGET")).resolves.toEqual({
      status: "PROVIDER_ERROR",
      provider: "BCB_SGS",
      errorCode: "INVALID_RESPONSE",
    });

    const unavailable = new BcbSgsMacroProvider(undefined, jsonClient([], 503), () => RETRIEVED_AT);
    await expect(unavailable.fetchMacro("BCB:SELIC_TARGET")).resolves.toEqual({
      status: "PROVIDER_ERROR",
      provider: "BCB_SGS",
      errorCode: "HTTP_503",
    });
  });
});

describe("BCB SGS FxProvider contract", () => {
  it("maps official SGS 1 USD/BRL sale data without floating point conversion", async () => {
    const provider = new BcbSgsFxProvider(
      undefined,
      jsonClient([{ data: "28/08/2026", valor: "5.4312000" }]),
      () => RETRIEVED_AT,
    );

    const result = await provider.fetchFx("usd", "brl");

    expectProviderAttribution(result, "BCB_SGS");
    expect(result).toMatchObject({
      status: "FOUND",
      provider: "BCB_SGS",
      snapshot: {
        category: "FX",
        baseCurrency: "USD",
        quoteCurrency: "BRL",
        rate: "5.4312",
        asOf: "2026-08-28T00:00:00.000Z",
        provenance: {
          provider: "BCB_SGS",
          sourceId: "SGS:1",
        },
      },
    });
  });

  it("returns missing for an unsupported pair instead of inventing conversion", async () => {
    const provider = new BcbSgsFxProvider(undefined, jsonClient([]), () => RETRIEVED_AT);

    await expect(provider.fetchFx("EUR", "BRL")).resolves.toMatchObject({
      status: "MISSING",
      provider: "BCB_SGS",
      qualityFlags: ["MISSING"],
    });
  });
});

describe("provider observability contract", () => {
  it("emits operational metadata without request identifiers or financial values", async () => {
    const events: unknown[] = [];
    const observer: MarketDataObserver = {
      record(event) {
        events.push(event);
      },
    };
    let clock = 1_000;
    const firstProvider = {
      name: "first",
      async load() {
        clock += 7;
        return missingMarketData("first", "No data.");
      },
    };
    const secondProvider = {
      name: "second",
      async load() {
        clock += 3;
        return missingMarketData("second", "No data.");
      },
    };

    await fetchWithExplicitFallback(
      [firstProvider, secondProvider],
      { orderedProviders: ["first", "second"], fallbackOn: ["MISSING"] },
      (provider) => provider.load(),
      { category: "PRICE", observer, now: () => clock },
    );

    expect(events).toEqual([
      { category: "PRICE", provider: "FIRST", status: "MISSING", attempt: 1, durationMs: 7 },
      { category: "PRICE", provider: "SECOND", status: "MISSING", attempt: 2, durationMs: 3 },
    ]);
    expect(JSON.stringify(events)).not.toContain(ASSET_ID);
    expect(JSON.stringify(events)).not.toContain("42.501234");
  });
});
