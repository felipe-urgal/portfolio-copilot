import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ProductShell } from "@/components/product-shell";

import { PortfolioWorkspace } from "./portfolio-workspace";

const SNAPSHOT = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const CASH_IN = {
  id: "7744df4d-bb41-4a07-b582-a8d8f710a8af",
  portfolioId: SNAPSHOT.id,
  type: "CASH_IN",
  occurredAt: "2026-08-26T21:05:00.000Z",
  settlementAmount: {
    currency: "BRL",
    minorUnits: "125000",
  },
  assetId: null,
  quantity: null,
} as const;

describe("PortfolioWorkspace", () => {
  it("renders the local portfolio creation form and product navigation", () => {
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

  it("renders cash-flow controls only after a validated portfolio exists", () => {
    const html = renderToStaticMarkup(<PortfolioWorkspace initialSnapshot={SNAPSHOT} />);

    expect(html).toContain("Carteira criada nesta sessão");
    expect(html).toContain("Transaction Ledger");
    expect(html).toContain("Tipo de movimentação");
    expect(html).toContain("Entrada");
    expect(html).toContain("Saída");
    expect(html).toContain("Registrar movimentação");
    expect(html).toContain("Ledger sem movimentações");
    expect(html).toContain("Compra");
    expect(html).toContain("Venda");
    expect(html).toContain("Compra e venda exigem um Asset real selecionável");
    expect(html).toContain("Nenhuma posição de ativo disponível");
    expect(html).toContain("Sem transações");
  });

  it("renders real cash transaction snapshots without inventing asset positions", () => {
    const html = renderToStaticMarkup(
      <PortfolioWorkspace initialSnapshot={SNAPSHOT} initialTransactions={[CASH_IN]} />,
    );

    expect(html).toContain("Carteira principal");
    expect(html).toContain(SNAPSHOT.id);
    expect(html).toContain("Entrada de caixa");
    expect(html).toContain("BRL 1250.00");
    expect(html).toContain(CASH_IN.occurredAt);
    expect(html).toContain(CASH_IN.id);
    expect(html).toContain("1 movimentação");
    expect(html).toContain("Somente fluxos de caixa");
    expect(html).toContain("CASH_IN e CASH_OUT não carregam AssetId nem quantidade");
    expect(html).toContain("Nenhuma posição de ativo disponível");

    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toMatch(/>\s*0%\s*</);
  });
});
