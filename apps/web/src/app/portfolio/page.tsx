import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { FinancialProfileSessionSummary } from "@/components/financial-profile-session-summary";
import { ProductShell } from "@/components/product-shell";
import { PortfolioWorkspace } from "@/features/portfolio/portfolio-workspace";
import { requireAuthenticatedIdentity } from "@/lib/identity-server";

export const metadata: Metadata = {
  title: `Carteira | ${APP_NAME}`,
  description:
    "Portfolio, ledger e aporte local por AssetClass com snapshot auditável e explicação determinística sem Market Data inventado.",
};

export default async function PortfolioPage() {
  const identity = await requireAuthenticatedIdentity();

  return (
    <ProductShell activeRoute="/portfolio" identity={identity}>
      <FinancialProfileSessionSummary />
      <PortfolioWorkspace />
    </ProductShell>
  );
}
