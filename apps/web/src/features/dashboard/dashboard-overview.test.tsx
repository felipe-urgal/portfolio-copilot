import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { FinancialProfileSnapshot } from "@portfolio-copilot/domain";

import { FinancialSessionProvider } from "@/components/financial-session";

import { DashboardOverview } from "./dashboard-overview";

const PROFILE: FinancialProfileSnapshot = {
  id: "8d5a7a27-2db8-4a51-a6c8-d84f78fd1298",
  referenceCurrency: "BRL",
  riskTolerance: "MEDIUM",
  horizon: "LONG",
  emergencyReserveTarget: { currency: "BRL", minorUnits: "1500000" },
  goals: [
    {
      id: "62c1cf28-ea08-4f0f-b2ec-991ee889f55d",
      type: "RETIREMENT",
      targetAmount: { currency: "BRL", minorUnits: "200000000" },
      targetDate: null,
    },
  ],
};

function renderDashboard(initialFinancialProfile: FinancialProfileSnapshot | null = null): string {
  return renderToStaticMarkup(
    <FinancialSessionProvider initialFinancialProfile={initialFinancialProfile}>
      <DashboardOverview displayName="Felipe" />
    </FinancialSessionProvider>,
  );
}

describe("DashboardOverview R6", () => {
  it("prioritizes honest context and a concrete next action when the profile is absent", () => {
    const html = renderDashboard();

    expect(html).toContain("Olá, Felipe");
    expect(html).toContain("Perfil pendente");
    expect(html).toContain("Panorama");
    expect(html).toContain("Construa a base factual da sua carteira");
    expect(html).toContain("Complete seu perfil financeiro");
    expect(html).toContain("Contexto ainda não configurado");
    expect(html).not.toMatch(/R\$\s*\d/);
    expect(html).not.toContain("0,00");
    expect(html).not.toMatch(/>\s*0%\s*</);
  });

  it("keeps nested empty states within the dashboard section headings", () => {
    const html = renderDashboard();

    expect(html).toContain('id="portfolio-panorama-title">Carteira</h2>');
    expect(html).toContain(">Construa a base factual da sua carteira</p>");
    expect(html).toContain(">Perfil financeiro</h2>");
    expect(html).toContain(">Contexto ainda não configurado</p>");
    expect(html).not.toContain(">Construa a base factual da sua carteira</h2>");
    expect(html).not.toContain(">Contexto ainda não configurado</h2>");
  });

  it("uses only validated profile facts as compact dashboard metrics and context", () => {
    const html = renderDashboard(PROFILE);

    expect(html).toContain("Perfil configurado");
    expect(html).toContain("Objetivos declarados");
    expect(html).toContain("BRL 15.000,00");
    expect(html).toContain("Meta declarada; não representa saldo atual");
    expect(html).toContain("Média");
    expect(html).toContain("Longo prazo");
    expect(html).toContain("Estruture os fatos da carteira");
    expect(html).not.toContain(PROFILE.id);
    expect(html).not.toContain("saldo atual da reserva");
    expect(html).not.toMatch(/>\s*\d+%\s*</);
  });

  it("keeps unavailable portfolio and market metrics out of the primary hierarchy", () => {
    const html = renderDashboard(PROFILE);

    expect(html).not.toContain("Patrimônio total");
    expect(html).not.toContain("Aporte do mês");
    expect(html).not.toContain("Dado indisponível");
    expect(html).toContain("O que ainda não aparece neste Dashboard");
    expect(html).toContain("Patrimônio, retorno, composição, posições");
    expect(html).toContain("Market Data");
    expect(html).toContain("Aguardando base compartilhada");
  });
});
