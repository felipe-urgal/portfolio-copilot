import type {
  AssetQuantitySnapshot,
  FinancialGoalSnapshot,
  MoneySnapshot,
  TargetAllocationBucketSnapshot,
} from "@portfolio-copilot/domain";
import {
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type PersistenceProvenance = "USER_ENTRY" | "LOCAL_MIGRATION" | "SYSTEM";

const createdAt = () => timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow();

export const accountOwners = pgTable("account_owners", {
  subject: text("subject").primaryKey(),
  createdAt: createdAt(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const financialProfiles = pgTable(
  "financial_profiles",
  {
    ownerSubject: text("owner_subject")
      .primaryKey()
      .references(() => accountOwners.subject, { onDelete: "cascade" }),
    profileId: text("profile_id").notNull(),
    referenceCurrency: text("reference_currency").notNull(),
    riskTolerance: text("risk_tolerance").notNull(),
    horizon: text("horizon").notNull(),
    emergencyReserveTarget: jsonb("emergency_reserve_target").$type<MoneySnapshot | null>(),
    goals: jsonb("goals").$type<readonly FinancialGoalSnapshot[]>().notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    provenance: text("provenance").$type<PersistenceProvenance>().notNull().default("USER_ENTRY"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("financial_profiles_profile_id_idx").on(table.profileId)],
);

export const portfolios = pgTable(
  "portfolios",
  {
    ownerSubject: text("owner_subject")
      .notNull()
      .references(() => accountOwners.subject, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    referenceCurrency: text("reference_currency").notNull(),
    schemaVersion: integer("schema_version").notNull().default(1),
    provenance: text("provenance").$type<PersistenceProvenance>().notNull().default("USER_ENTRY"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ name: "portfolios_owner_id_pk", columns: [table.ownerSubject, table.id] }),
    index("portfolios_owner_idx").on(table.ownerSubject),
  ],
);

export const portfolioAssetRefs = pgTable(
  "portfolio_asset_refs",
  {
    ownerSubject: text("owner_subject").notNull(),
    portfolioId: text("portfolio_id").notNull(),
    assetId: text("asset_id").notNull(),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "portfolio_asset_refs_owner_portfolio_asset_pk",
      columns: [table.ownerSubject, table.portfolioId, table.assetId],
    }),
    foreignKey({
      name: "portfolio_asset_refs_portfolio_owner_fk",
      columns: [table.ownerSubject, table.portfolioId],
      foreignColumns: [portfolios.ownerSubject, portfolios.id],
    }).onDelete("cascade"),
  ],
);

export const transactions = pgTable(
  "transactions",
  {
    ownerSubject: text("owner_subject").notNull(),
    id: text("id").notNull(),
    portfolioId: text("portfolio_id").notNull(),
    ledgerOrder: serial("ledger_order").notNull(),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "date" }).notNull(),
    settlementAmount: jsonb("settlement_amount").$type<MoneySnapshot>().notNull(),
    assetId: text("asset_id"),
    quantity: jsonb("quantity").$type<AssetQuantitySnapshot | null>(),
    schemaVersion: integer("schema_version").notNull().default(1),
    provenance: text("provenance").$type<PersistenceProvenance>().notNull().default("USER_ENTRY"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ name: "transactions_owner_id_pk", columns: [table.ownerSubject, table.id] }),
    foreignKey({
      name: "transactions_portfolio_owner_fk",
      columns: [table.ownerSubject, table.portfolioId],
      foreignColumns: [portfolios.ownerSubject, portfolios.id],
    }).onDelete("cascade"),
    index("transactions_owner_portfolio_occurred_idx").on(
      table.ownerSubject,
      table.portfolioId,
      table.occurredAt,
    ),
  ],
);

export const targetAllocations = pgTable(
  "target_allocations",
  {
    ownerSubject: text("owner_subject").notNull(),
    portfolioId: text("portfolio_id").notNull(),
    buckets: jsonb("buckets").$type<readonly TargetAllocationBucketSnapshot[]>().notNull(),
    version: integer("version").notNull().default(1),
    schemaVersion: integer("schema_version").notNull().default(1),
    provenance: text("provenance").$type<PersistenceProvenance>().notNull().default("USER_ENTRY"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({
      name: "target_allocations_owner_portfolio_pk",
      columns: [table.ownerSubject, table.portfolioId],
    }),
    foreignKey({
      name: "target_allocations_portfolio_owner_fk",
      columns: [table.ownerSubject, table.portfolioId],
      foreignColumns: [portfolios.ownerSubject, portfolios.id],
    }).onDelete("cascade"),
  ],
);
