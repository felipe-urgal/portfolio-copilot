import { describe, expect, it } from "vitest";

import { AssetClass, AssetId, AssetQuantity } from "../asset";
import { Money } from "../financial";
import { PortfolioId } from "../portfolio";
import { applyContributionCostTaxConstraints } from "./contribution-cost-tax-constraints";
import { type ContributionExecutionPlan } from "./contribution-execution-constraints";
import { InvalidContributionCostAmountError } from "./errors";

const PORTFOLIO_ID = PortfolioId.from("550e8400-e29b-41d4-a716-446655440030");
const ASSET_ID = AssetId.from("550e8400-e29b-41d4-a716-446655440031");

function plan(): ContributionExecutionPlan {
  return Object.freeze({
    portfolioId: PORTFOLIO_ID,
    contribution: Money.fromDecimal("10.00", "BRL"),
    destinations: Object.freeze([
      Object.freeze({
        portfolioId: PORTFOLIO_ID,
        assetId: ASSET_ID,
        assetClass: AssetClass.from("EQUITY"),
        allocatedAmount: Money.fromDecimal("10.00", "BRL"),
        minimumTradableQuantity: AssetQuantity.fromDecimal("1"),
      }),
    ]),
    unallocatedContribution: Money.zero("BRL"),
  });
}

describe("contribution cost runtime validation", () => {
  it.each(["transactionCost", "estimatedTaxImpact"] as const)(
    "rejects a non-Money %s with a typed error",
    (field) => {
      const invalid = {} as Money;

      expect(() =>
        applyContributionCostTaxConstraints({
          plan: plan(),
          constraints: [
            {
              assetId: ASSET_ID,
              transactionCost: field === "transactionCost" ? invalid : Money.zero("BRL"),
              estimatedTaxImpact:
                field === "estimatedTaxImpact" ? invalid : Money.zero("BRL"),
            },
          ],
        }),
      ).toThrow(InvalidContributionCostAmountError);
    },
  );
});
