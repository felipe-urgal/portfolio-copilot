import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { ProductShell } from "@/components/product-shell";
import { PortfolioWorkspace } from "@/features/portfolio/portfolio-workspace";

export const metadata: Metadata = {
  title: `Carteira | ${APP_NAME}`,
  description:
    "Portfolio, ledger e baseline local de aporte por AssetClass com base monetária manual e sem Market Data inventado.",
};

export default function PortfolioPage() {
  return (
    <ProductShell activeRoute="/portfolio">
      <PortfolioWorkspace />
    </ProductShell>
  );
}
