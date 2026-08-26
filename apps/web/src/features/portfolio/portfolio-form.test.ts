import { describe, expect, it } from "vitest";

import { createPortfolioSnapshot } from "./portfolio-form";

const VALID_ID = "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298";

describe("createPortfolioSnapshot", () => {
  it("creates a normalized snapshot through the domain contracts", () => {
    const result = createPortfolioSnapshot(
      {
        name: "  Carteira principal  ",
        referenceCurrency: "brl",
      },
      () => VALID_ID,
    );

    expect(result).toEqual({
      ok: true,
      snapshot: {
        id: VALID_ID,
        name: "Carteira principal",
        referenceCurrency: "BRL",
      },
    });
  });

  it("translates an invalid portfolio name into field feedback", () => {
    const result = createPortfolioSnapshot(
      {
        name: "   ",
        referenceCurrency: "BRL",
      },
      () => VALID_ID,
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        name: "Informe um nome de carteira válido com até 120 caracteres.",
      },
    });
  });

  it("translates an invalid currency into field feedback", () => {
    const result = createPortfolioSnapshot(
      {
        name: "Carteira principal",
        referenceCurrency: "REAL",
      },
      () => VALID_ID,
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        referenceCurrency: "Informe um código de moeda válido com 3 letras, como BRL.",
      },
    });
  });

  it("keeps an invalid generated id as a form-level failure", () => {
    const result = createPortfolioSnapshot(
      {
        name: "Carteira principal",
        referenceCurrency: "BRL",
      },
      () => "invalid-id",
    );

    expect(result).toEqual({
      ok: false,
      errors: {
        form: "Não foi possível gerar a identidade local da carteira. Tente novamente.",
      },
    });
  });
});
