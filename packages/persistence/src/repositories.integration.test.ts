import { fileURLToPath } from "node:url";

import {
  Money,
  Transaction,
  type FinancialProfileSnapshot,
  type PortfolioSnapshot,
} from "@portfolio-copilot/domain";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPostgresPersistence, type PostgresPersistence } from "./database";
import { ImmutableLedgerConflictError, OwnedResourceNotFoundError } from "./errors";
import { openOwnedPersistence } from "./repositories";

const DATABASE_URL = process.env.DATABASE_URL?.trim();
const describeWithDatabase = DATABASE_URL ? describe : describe.skip;

const PORTFOLIO: PortfolioSnapshot = {
  id: "550e8400-e29b-41d4-a716-446655440010",
  name: "Carteira principal",
  referenceCurrency: "BRL",
};
const PROFILE: FinancialProfileSnapshot = {
  id: "550e8400-e29b-41d4-a716-446655440030",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: null,
  goals: [],
};
const ASSET_ID = "550e8400-e29b-41d4-a716-446655440000";
const TRANSACTION_ID = "550e8400-e29b-41d4-a716-446655440020";

function trade(amount = "1234.56") {
  return Transaction.create({
    id: TRANSACTION_ID,
    portfolioId: PORTFOLIO.id,
    type: "BUY",
    occurredAt: "2026-08-26T12:30:45.123Z",
    settlementAmount: Money.fromDecimal(amount, "BRL"),
    assetId: ASSET_ID,
    quantity: "10.00000001",
  }).toSnapshot();
}

describeWithDatabase("PostgreSQL owned persistence", () => {
  let connection: PostgresPersistence;

  beforeAll(async () => {
    connection = createPostgresPersistence(DATABASE_URL!);
    await migrate(connection.db, {
      migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)),
    });
  });

  beforeEach(async () => {
    await connection.db.execute(sql`TRUNCATE TABLE account_owners CASCADE`);
  });

  afterAll(async () => {
    await connection.close();
  });

  it("isolates financial profiles and portfolios by authenticated owner", async () => {
    const alice = await openOwnedPersistence(connection.db, "github:alice");
    const bob = await openOwnedPersistence(connection.db, "github:bob");

    await alice.saveFinancialProfile(PROFILE);
    await alice.savePortfolio(PORTFOLIO);
    await bob.savePortfolio({ ...PORTFOLIO, name: "Carteira do Bob" });

    expect(await alice.getFinancialProfile()).toEqual(PROFILE);
    expect(await bob.getFinancialProfile()).toBeNull();
    expect((await alice.getPortfolio(PORTFOLIO.id))?.name).toBe("Carteira principal");
    expect((await bob.getPortfolio(PORTFOLIO.id))?.name).toBe("Carteira do Bob");
  });

  it("keeps ledger writes immutable and idempotent inside one owner scope", async () => {
    const owner = await openOwnedPersistence(connection.db, "github:alice");
    await owner.savePortfolio(PORTFOLIO);

    expect(await owner.appendTransaction(trade())).toEqual(trade());
    expect(await owner.appendTransaction(trade())).toEqual(trade());
    await expect(owner.appendTransaction(trade("999.99"))).rejects.toBeInstanceOf(
      ImmutableLedgerConflictError,
    );
    expect(await owner.listTransactions(PORTFOLIO.id)).toEqual([trade()]);
    expect(await owner.listPortfolioAssetIds(PORTFOLIO.id)).toEqual([ASSET_ID]);
  });

  it("never links a transaction to another owner's portfolio", async () => {
    const alice = await openOwnedPersistence(connection.db, "github:alice");
    const bob = await openOwnedPersistence(connection.db, "github:bob");
    await alice.savePortfolio(PORTFOLIO);

    await expect(bob.appendTransaction(trade())).rejects.toBeInstanceOf(OwnedResourceNotFoundError);
    expect(await bob.listTransactions(PORTFOLIO.id)).toEqual([]);
  });

  it("scopes target allocation to the owned portfolio", async () => {
    const alice = await openOwnedPersistence(connection.db, "github:alice");
    const bob = await openOwnedPersistence(connection.db, "github:bob");
    await alice.savePortfolio(PORTFOLIO);
    await bob.savePortfolio({ ...PORTFOLIO, name: "Carteira do Bob" });

    const target = {
      portfolioId: PORTFOLIO.id,
      buckets: [
        { assetClass: "FIXED_INCOME", targetWeightPercent: "60" },
        { assetClass: "EQUITY", targetWeightPercent: "40" },
      ],
    } as const;

    await alice.saveTargetAllocation(target);

    expect(await alice.getTargetAllocation(PORTFOLIO.id)).toEqual({
      portfolioId: PORTFOLIO.id,
      buckets: [
        { assetClass: "EQUITY", targetWeightPercent: "40" },
        { assetClass: "FIXED_INCOME", targetWeightPercent: "60" },
      ],
    });
    expect(await bob.getTargetAllocation(PORTFOLIO.id)).toBeNull();
  });
});
