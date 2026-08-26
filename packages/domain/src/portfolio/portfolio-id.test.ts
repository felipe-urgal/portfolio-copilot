import { describe, expect, it } from "vitest";

import { InvalidPortfolioIdError, PortfolioId } from "./index";

describe("PortfolioId", () => {
  it("accepts canonical UUID identities and normalizes case", () => {
    const id = PortfolioId.from("550E8400-E29B-41D4-A716-446655440010");

    expect(id.toString()).toBe("550e8400-e29b-41d4-a716-446655440010");
  });

  it("compares identities by value", () => {
    expect(
      PortfolioId.from("550e8400-e29b-41d4-a716-446655440010").equals(
        PortfolioId.from("550E8400-E29B-41D4-A716-446655440010"),
      ),
    ).toBe(true);
  });

  it("rejects empty, malformed and nil identities", () => {
    expect(() => PortfolioId.from("")).toThrowError(InvalidPortfolioIdError);
    expect(() => PortfolioId.from("CARTEIRA-1")).toThrowError(InvalidPortfolioIdError);
    expect(() => PortfolioId.from("00000000-0000-0000-0000-000000000000")).toThrowError(
      InvalidPortfolioIdError,
    );
  });
});
