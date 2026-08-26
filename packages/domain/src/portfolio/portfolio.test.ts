import { describe, expect, it } from "vitest";

import { InvalidCurrencyCodeError } from "../financial";
import { InvalidPortfolioIdError, InvalidPortfolioNameError, Portfolio } from "./index";

const FIRST_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440010";
const SECOND_PORTFOLIO_ID = "550e8400-e29b-41d4-a716-446655440011";

describe("Portfolio", () => {
  it("creates a valid portfolio with normalized name and reference currency", () => {
    const portfolio = Portfolio.create({
      id: FIRST_PORTFOLIO_ID,
      name: " Carteira Principal ",
      referenceCurrency: "brl",
    });

    expect(portfolio.id.toString()).toBe(FIRST_PORTFOLIO_ID);
    expect(portfolio.name).toBe("Carteira Principal");
    expect(portfolio.referenceCurrency.toString()).toBe("BRL");
  });

  it("uses identity rather than name to distinguish portfolios", () => {
    const first = Portfolio.create({
      id: FIRST_PORTFOLIO_ID,
      name: "Longo Prazo",
      referenceCurrency: "BRL",
    });
    const second = Portfolio.create({
      id: SECOND_PORTFOLIO_ID,
      name: "Longo Prazo",
      referenceCurrency: "BRL",
    });

    expect(first.sameIdentityAs(second)).toBe(false);
  });

  it("rejects invalid ids, names and currencies", () => {
    expect(() =>
      Portfolio.create({ id: "CARTEIRA-1", name: "Principal", referenceCurrency: "BRL" }),
    ).toThrowError(InvalidPortfolioIdError);

    expect(() =>
      Portfolio.create({ id: FIRST_PORTFOLIO_ID, name: "   ", referenceCurrency: "BRL" }),
    ).toThrowError(InvalidPortfolioNameError);

    expect(() =>
      Portfolio.create({
        id: FIRST_PORTFOLIO_ID,
        name: `${"A".repeat(120)}B`,
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidPortfolioNameError);

    expect(() =>
      Portfolio.create({
        id: FIRST_PORTFOLIO_ID,
        name: "Principal\nOculta",
        referenceCurrency: "BRL",
      }),
    ).toThrowError(InvalidPortfolioNameError);

    expect(() =>
      Portfolio.create({ id: FIRST_PORTFOLIO_ID, name: "Principal", referenceCurrency: "R$" }),
    ).toThrowError(InvalidCurrencyCodeError);
  });

  it("round-trips through a persistible snapshot", () => {
    const original = Portfolio.create({
      id: FIRST_PORTFOLIO_ID,
      name: "Carteira Principal",
      referenceCurrency: "BRL",
    });

    const snapshot = original.toSnapshot();
    const restored = Portfolio.fromSnapshot(snapshot);

    expect(snapshot).toEqual({
      id: FIRST_PORTFOLIO_ID,
      name: "Carteira Principal",
      referenceCurrency: "BRL",
    });
    expect(restored.sameIdentityAs(original)).toBe(true);
    expect(restored.name).toBe(original.name);
    expect(restored.referenceCurrency.equals(original.referenceCurrency)).toBe(true);
  });
});
