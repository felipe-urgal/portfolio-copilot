import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductShell } from "@/components/product-shell";

import { PortfolioWorkspace } from "./portfolio-workspace";

const SNAPSHOT = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

describe("PortfolioWorkspace", () => {
  it("renders the local creation form and product navigation", () => {
    const html = renderToStaticMarkup(
      <ProductShell activeRoute="/portfolio">
        <PortfolioWorkspace />
      </ProductShell>,
    );

    expect(html).toContain('aria-label="Navegação principal"');
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/portfolio"');
    expect(html).toContain('href="/onboarding"');
    expect(html).toContain('href="/health"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Criar carteira");
    expect(html).toContain("Nome da carteira");
    expect(html).toContain("Moeda de referência");
    expect(html).toContain("Criar carteira local");
    expect(html).toContain("Nada é persistido nesta versão");
    expect(html).toContain("Transaction Ledger");
  });

  it("renders a validated snapshot with honest empty positions", () => {
    const html = renderToStaticMarkup(<PortfolioWorkspace initialSnapshot={SNAPSHOT} />);

    expect(html).toContain("Carteira criada nesta sessão");
    expect(html).toContain("Carteira principal");
    expect(html).toContain("BRL");
    expect(html).toContain(SNAPSHOT.id);
    expect(html).toContain("Nenhuma posição disponível");
    expect(html).toContain("Sem transações");
    expect(html).toContain("Nenhum holding ou patrimônio é inventado");

    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });
});
