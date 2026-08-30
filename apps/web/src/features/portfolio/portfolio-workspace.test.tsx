import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PortfolioWorkspace } from "./portfolio-workspace";

const SNAPSHOT = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  name: "Carteira principal",
  referenceCurrency: "BRL",
} as const;

const ASSET = {
  id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
  name: "ETF global",
  assetClass: "EQUITY",
  instrumentType: "ETF",
  referenceCurrency: "USD",
} as const;

const CASH_IN = {
  id: "7744df4d-bb41-4a07-b582-a8d8f710a8af",
  portfolioId: SNAPSHOT.id,
  type: "CASH_IN",
  occurredAt: "2026-08-26T21:05:00.000Z",
  settlementAmount: { currency: "BRL", minorUnits: "125000" },
  assetId: null,
  quantity: null,
} as const;

const BUY = {
  id: "d0778205-ab7c-42dd-866f-6ca7ca284103",
  portfolioId: SNAPSHOT.id,
  type: "BUY",
  occurredAt: "2026-08-26T21:06:00.000Z",
  settlementAmount: { currency: "BRL", minorUnits: "250000" },
  assetId: ASSET.id,
  quantity: { scaledUnits: "3000000000000" },
} as const;

const SELL = {
  id: "0e11384d-cb77-4a43-88ff-9d0bb3dfe324",
  portfolioId: SNAPSHOT.id,
  type: "SELL",
  occurredAt: "2026-08-26T21:07:00.000Z",
  settlementAmount: { currency: "BRL", minorUnits: "100000" },
  assetId: ASSET.id,
  quantity: { scaledUnits: "1250000000000" },
} as const;

describe("PortfolioWorkspace", () => {
  it("starts with one focused configuration task and no local copy of global navigation", () => {
    const html = renderToStaticMarkup(<PortfolioWorkspace />);

    expect(html).toContain("Criar carteira");
    expect(html).toContain("Nome da carteira");
    expect(html).toContain("Criar carteira local");
    expect(html).toContain("Transaction Ledger");
    expect(html).toContain("Estado local");
    expect(html).not.toContain('aria-label="Tarefas da carteira"');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('aria-label="Navegação principal"');
    expect(html).not.toContain('href="/dashboard"');
  });

  it("exposes the R7 task model after portfolio creation without an incomplete ARIA tabs pattern", () => {
    const html = renderToStaticMarkup(<PortfolioWorkspace initialSnapshot={SNAPSHOT} />);

    expect(html).toContain('aria-label="Tarefas da carteira"');
    expect(html).toContain("Visão geral");
    expect(html).toContain("Ativos e posições");
    expect(html).toContain("Transações");
    expect(html).toContain("Aporte");
    expect(html).toContain("Configuração");
    expect(html).toContain('id="portfolio-task-overview"');
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain('role="tablist"');
    expect(html).not.toContain('role="tabpanel"');
    expect(html).toContain('id="portfolio-panel-assets"');
    expect(html).toContain('hidden=""');
    expect(html).toContain("Detalhes técnicos e identidade");
    expect(html).toContain("Nada é persistido nesta versão");
  });

  it("keeps asset registration, human selection and positions projected from BUY/SELL", () => {
    const html = renderToStaticMarkup(
      <PortfolioWorkspace
        initialSnapshot={SNAPSHOT}
        initialAssets={[ASSET]}
        initialTransactions={[CASH_IN, BUY, SELL]}
        initialTask="assets"
      />,
    );

    expect(html).toContain("Cadastrar ativo local");
    expect(html).toContain("Nome do ativo");
    expect(html).toContain("Classe econômica");
    expect(html).toContain("Instrumento");
    expect(html).toContain("ETF global");
    expect(html).toContain("Ações · ETF · USD");
    expect(html).toContain("ETF global — Ações");
    expect(html).toContain("1 posição");
    expect(html).toContain("1.75 un.");
    expect(html).toContain("Compra e venda");
    expect(html).toContain("3 un.");
    expect(html).toContain("1.25 un.");
    expect(html).toContain("BRL 2500.00");
    expect(html).toContain("BRL 1000.00");
    expect(html).toContain("3 movimentações");
    expect(html).not.toContain("Patrimônio total");
    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toMatch(/>\s*0%\s*</);
  });

  it("keeps cash flows from creating asset positions", () => {
    const html = renderToStaticMarkup(
      <PortfolioWorkspace
        initialSnapshot={SNAPSHOT}
        initialTransactions={[CASH_IN]}
        initialTask="overview"
      />,
    );

    expect(html).toContain("Entrada de caixa");
    expect(html).toContain("BRL 1250.00");
    expect(html).toContain("Somente fluxos de caixa");
    expect(html).toContain("Nenhuma posição de ativo aberta");
    expect(html).toContain("CASH_IN e CASH_OUT não alteram posições");
  });

  it("keeps the full deterministic contribution journey mounted as a dedicated task", () => {
    const html = renderToStaticMarkup(
      <PortfolioWorkspace initialSnapshot={SNAPSHOT} initialTask="contribution" />,
    );

    expect(html).toContain("Aporte é planejamento, não execução de ordem");
    expect(html).toContain("Baseline do aporte");
    expect(html).toContain("Base monetária manual");
    expect(html).toContain("Baseline ainda não calculado");
  });
});
