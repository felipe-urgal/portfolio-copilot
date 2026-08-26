import type { Metadata } from "next";

import { APP_NAME } from "@portfolio-copilot/shared";

import { ProductShell } from "@/components/product-shell";
import { PortfolioWorkspace } from "@/features/portfolio/portfolio-workspace";

export const metadata: Metadata = {
  title: `Carteira | ${APP_NAME}`,
  description:
    "Cadastro local do Portfolio com snapshot validado e posições vazias sem dados inventados.",
};

export default function PortfolioPage() {
  return (
    <ProductShell activeRoute="/portfolio">
      <PortfolioWorkspace />
    </ProductShell>
  );
}
