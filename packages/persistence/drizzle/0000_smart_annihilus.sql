CREATE TABLE "account_owners" (
	"subject" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_profiles" (
	"owner_subject" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"reference_currency" text NOT NULL,
	"risk_tolerance" text NOT NULL,
	"horizon" text NOT NULL,
	"emergency_reserve_target" jsonb,
	"goals" jsonb NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"provenance" text DEFAULT 'USER_ENTRY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_asset_refs" (
	"owner_subject" text NOT NULL,
	"portfolio_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolio_asset_refs_owner_portfolio_asset_pk" PRIMARY KEY("owner_subject","portfolio_id","asset_id")
);
--> statement-breakpoint
CREATE TABLE "portfolios" (
	"owner_subject" text NOT NULL,
	"id" text NOT NULL,
	"name" text NOT NULL,
	"reference_currency" text NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"provenance" text DEFAULT 'USER_ENTRY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "portfolios_owner_id_pk" PRIMARY KEY("owner_subject","id")
);
--> statement-breakpoint
CREATE TABLE "target_allocations" (
	"owner_subject" text NOT NULL,
	"portfolio_id" text NOT NULL,
	"buckets" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"provenance" text DEFAULT 'USER_ENTRY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "target_allocations_owner_portfolio_pk" PRIMARY KEY("owner_subject","portfolio_id")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"owner_subject" text NOT NULL,
	"id" text NOT NULL,
	"portfolio_id" text NOT NULL,
	"ledger_order" serial NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"settlement_amount" jsonb NOT NULL,
	"asset_id" text,
	"quantity" jsonb,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"provenance" text DEFAULT 'USER_ENTRY' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_owner_id_pk" PRIMARY KEY("owner_subject","id")
);
--> statement-breakpoint
ALTER TABLE "financial_profiles" ADD CONSTRAINT "financial_profiles_owner_subject_account_owners_subject_fk" FOREIGN KEY ("owner_subject") REFERENCES "public"."account_owners"("subject") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_asset_refs" ADD CONSTRAINT "portfolio_asset_refs_portfolio_owner_fk" FOREIGN KEY ("owner_subject","portfolio_id") REFERENCES "public"."portfolios"("owner_subject","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolios" ADD CONSTRAINT "portfolios_owner_subject_account_owners_subject_fk" FOREIGN KEY ("owner_subject") REFERENCES "public"."account_owners"("subject") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "target_allocations" ADD CONSTRAINT "target_allocations_portfolio_owner_fk" FOREIGN KEY ("owner_subject","portfolio_id") REFERENCES "public"."portfolios"("owner_subject","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_portfolio_owner_fk" FOREIGN KEY ("owner_subject","portfolio_id") REFERENCES "public"."portfolios"("owner_subject","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_profiles_profile_id_idx" ON "financial_profiles" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "portfolios_owner_idx" ON "portfolios" USING btree ("owner_subject");--> statement-breakpoint
CREATE INDEX "transactions_owner_portfolio_occurred_idx" ON "transactions" USING btree ("owner_subject","portfolio_id","occurred_at");