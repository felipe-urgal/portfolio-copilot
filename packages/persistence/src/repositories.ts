import {
  FinancialProfile,
  Portfolio,
  TargetAllocation,
  Transaction,
  type FinancialProfileSnapshot,
  type PortfolioSnapshot,
  type TargetAllocationSnapshot,
  type TransactionSnapshot,
} from "@portfolio-copilot/domain";
import { and, asc, eq, sql } from "drizzle-orm";

import type { PersistenceDatabase } from "./database";
import { ImmutableLedgerConflictError, OwnedResourceNotFoundError } from "./errors";
import { OwnerSubject, type OwnerSubject as OwnerSubjectValue } from "./owner-subject";
import {
  accountOwners,
  financialProfiles,
  portfolioAssetRefs,
  portfolios,
  targetAllocations,
  transactions,
  type PersistenceProvenance,
} from "./schema";

const DEFAULT_PROVENANCE: PersistenceProvenance = "USER_ENTRY";

function transactionSnapshotFromRow(row: typeof transactions.$inferSelect): TransactionSnapshot {
  return Transaction.fromSnapshot({
    id: row.id,
    portfolioId: row.portfolioId,
    type: row.type,
    occurredAt: row.occurredAt.toISOString(),
    settlementAmount: row.settlementAmount,
    assetId: row.assetId,
    quantity: row.quantity,
  }).toSnapshot();
}

export class OwnedPersistence {
  public constructor(
    private readonly db: PersistenceDatabase,
    public readonly ownerSubject: OwnerSubjectValue,
  ) {}

  public async saveFinancialProfile(
    snapshot: FinancialProfileSnapshot,
    provenance: PersistenceProvenance = DEFAULT_PROVENANCE,
  ): Promise<FinancialProfileSnapshot> {
    const canonical = FinancialProfile.fromSnapshot(snapshot).toSnapshot();

    await this.db
      .insert(financialProfiles)
      .values({
        ownerSubject: this.ownerSubject,
        profileId: canonical.id,
        referenceCurrency: canonical.referenceCurrency,
        riskTolerance: canonical.riskTolerance,
        horizon: canonical.horizon,
        emergencyReserveTarget: canonical.emergencyReserveTarget,
        goals: canonical.goals,
        provenance,
      })
      .onConflictDoUpdate({
        target: financialProfiles.ownerSubject,
        set: {
          profileId: canonical.id,
          referenceCurrency: canonical.referenceCurrency,
          riskTolerance: canonical.riskTolerance,
          horizon: canonical.horizon,
          emergencyReserveTarget: canonical.emergencyReserveTarget,
          goals: canonical.goals,
          provenance,
          updatedAt: new Date(),
        },
      });

    return canonical;
  }

  public async getFinancialProfile(): Promise<FinancialProfileSnapshot | null> {
    const [row] = await this.db
      .select()
      .from(financialProfiles)
      .where(eq(financialProfiles.ownerSubject, this.ownerSubject))
      .limit(1);

    if (!row) return null;

    return FinancialProfile.fromSnapshot({
      id: row.profileId,
      referenceCurrency: row.referenceCurrency,
      riskTolerance: row.riskTolerance as FinancialProfileSnapshot["riskTolerance"],
      horizon: row.horizon as FinancialProfileSnapshot["horizon"],
      emergencyReserveTarget: row.emergencyReserveTarget,
      goals: row.goals,
    }).toSnapshot();
  }

  public async savePortfolio(
    snapshot: PortfolioSnapshot,
    provenance: PersistenceProvenance = DEFAULT_PROVENANCE,
  ): Promise<PortfolioSnapshot> {
    const canonical = Portfolio.fromSnapshot(snapshot).toSnapshot();

    await this.db
      .insert(portfolios)
      .values({
        ownerSubject: this.ownerSubject,
        id: canonical.id,
        name: canonical.name,
        referenceCurrency: canonical.referenceCurrency,
        provenance,
      })
      .onConflictDoUpdate({
        target: [portfolios.ownerSubject, portfolios.id],
        set: {
          name: canonical.name,
          referenceCurrency: canonical.referenceCurrency,
          provenance,
          updatedAt: new Date(),
        },
      });

    return canonical;
  }

  public async getPortfolio(portfolioId: string): Promise<PortfolioSnapshot | null> {
    const [row] = await this.db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.ownerSubject, this.ownerSubject), eq(portfolios.id, portfolioId)))
      .limit(1);

    if (!row) return null;

    return Portfolio.fromSnapshot({
      id: row.id,
      name: row.name,
      referenceCurrency: row.referenceCurrency,
    }).toSnapshot();
  }

  public async listPortfolios(): Promise<readonly PortfolioSnapshot[]> {
    const rows = await this.db
      .select()
      .from(portfolios)
      .where(eq(portfolios.ownerSubject, this.ownerSubject))
      .orderBy(asc(portfolios.createdAt), asc(portfolios.id));

    return rows.map((row) =>
      Portfolio.fromSnapshot({
        id: row.id,
        name: row.name,
        referenceCurrency: row.referenceCurrency,
      }).toSnapshot(),
    );
  }

  public async appendTransaction(
    snapshot: TransactionSnapshot,
    provenance: PersistenceProvenance = DEFAULT_PROVENANCE,
  ): Promise<TransactionSnapshot> {
    const canonical = Transaction.fromSnapshot(snapshot).toSnapshot();
    const ownedPortfolio = await this.getPortfolio(canonical.portfolioId);

    if (ownedPortfolio === null) throw new OwnedResourceNotFoundError("portfolio");

    return this.db.transaction(async (tx) => {
      const inserted = await tx
        .insert(transactions)
        .values({
          ownerSubject: this.ownerSubject,
          id: canonical.id,
          portfolioId: canonical.portfolioId,
          type: canonical.type,
          occurredAt: new Date(canonical.occurredAt),
          settlementAmount: canonical.settlementAmount,
          assetId: canonical.assetId,
          quantity: canonical.quantity,
          provenance,
        })
        .onConflictDoNothing({ target: [transactions.ownerSubject, transactions.id] })
        .returning();

      if (inserted.length === 0) {
        const [existing] = await tx
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.ownerSubject, this.ownerSubject),
              eq(transactions.id, canonical.id),
            ),
          )
          .limit(1);

        if (!existing) throw new ImmutableLedgerConflictError();

        const existingSnapshot = transactionSnapshotFromRow(existing);
        if (JSON.stringify(existingSnapshot) !== JSON.stringify(canonical)) {
          throw new ImmutableLedgerConflictError();
        }

        return existingSnapshot;
      }

      if (canonical.assetId !== null) {
        await tx
          .insert(portfolioAssetRefs)
          .values({
            ownerSubject: this.ownerSubject,
            portfolioId: canonical.portfolioId,
            assetId: canonical.assetId,
          })
          .onConflictDoNothing();
      }

      return transactionSnapshotFromRow(inserted[0]!);
    });
  }

  public async listTransactions(portfolioId: string): Promise<readonly TransactionSnapshot[]> {
    const rows = await this.db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.ownerSubject, this.ownerSubject),
          eq(transactions.portfolioId, portfolioId),
        ),
      )
      .orderBy(asc(transactions.occurredAt), asc(transactions.ledgerOrder));

    return rows.map(transactionSnapshotFromRow);
  }

  public async listPortfolioAssetIds(portfolioId: string): Promise<readonly string[]> {
    const rows = await this.db
      .select({ assetId: portfolioAssetRefs.assetId })
      .from(portfolioAssetRefs)
      .where(
        and(
          eq(portfolioAssetRefs.ownerSubject, this.ownerSubject),
          eq(portfolioAssetRefs.portfolioId, portfolioId),
        ),
      )
      .orderBy(asc(portfolioAssetRefs.assetId));

    return rows.map((row) => row.assetId);
  }

  public async saveTargetAllocation(
    snapshot: TargetAllocationSnapshot,
    provenance: PersistenceProvenance = DEFAULT_PROVENANCE,
  ): Promise<TargetAllocationSnapshot> {
    const canonical = TargetAllocation.fromSnapshot(snapshot).toSnapshot();
    const ownedPortfolio = await this.getPortfolio(canonical.portfolioId);

    if (ownedPortfolio === null) throw new OwnedResourceNotFoundError("portfolio");

    await this.db
      .insert(targetAllocations)
      .values({
        ownerSubject: this.ownerSubject,
        portfolioId: canonical.portfolioId,
        buckets: canonical.buckets,
        provenance,
      })
      .onConflictDoUpdate({
        target: [targetAllocations.ownerSubject, targetAllocations.portfolioId],
        set: {
          buckets: canonical.buckets,
          provenance,
          version: sql`${targetAllocations.version} + 1`,
          updatedAt: new Date(),
        },
      });

    return canonical;
  }

  public async getTargetAllocation(portfolioId: string): Promise<TargetAllocationSnapshot | null> {
    const [row] = await this.db
      .select()
      .from(targetAllocations)
      .where(
        and(
          eq(targetAllocations.ownerSubject, this.ownerSubject),
          eq(targetAllocations.portfolioId, portfolioId),
        ),
      )
      .limit(1);

    if (!row) return null;

    return TargetAllocation.fromSnapshot({
      portfolioId: row.portfolioId,
      buckets: row.buckets,
    }).toSnapshot();
  }
}

export async function openOwnedPersistence(
  db: PersistenceDatabase,
  rawOwnerSubject: string,
): Promise<OwnedPersistence> {
  const ownerSubject = OwnerSubject(rawOwnerSubject);

  await db
    .insert(accountOwners)
    .values({ subject: ownerSubject })
    .onConflictDoUpdate({
      target: accountOwners.subject,
      set: { lastSeenAt: new Date() },
    });

  return new OwnedPersistence(db, ownerSubject);
}
