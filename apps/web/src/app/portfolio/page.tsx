import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { ProductShell } from "@/components/product-shell";
import { PortfolioWorkspace } from "@/features/portfolio/portfolio-workspace";

export const metadata: Metadata = {
  title: `Carteira | ${APP_NAME}`,
  description:
    "Portfolio, ativos e Transaction Ledger locais com BUY/SELL e posições derivadas sem dados inventados.",
};

export default function PortfolioPage() {
  return (
    <ProductShell activeRoute="/portfolio">
      <PortfolioWorkspace />
    </ProductShell>
  );
}
